from functools import partial
import itertools
import os

from _pydev_bundle._pydev_imports_tipper import TYPE_IMPORT, TYPE_CLASS, TYPE_FUNCTION, TYPE_ATTR, \
    TYPE_BUILTIN, TYPE_PARAM
from _pydev_bundle.pydev_is_thread_alive import is_thread_alive
from _pydev_bundle.pydev_override import overrides
from _pydev_imps._pydev_saved_modules import threading
from _pydevd_bundle._debug_adapter import pydevd_schema
from _pydevd_bundle._debug_adapter.pydevd_schema import ModuleEvent, ModuleEventBody, Module, \
    OutputEventBody, OutputEvent, ContinuedEventBody
from _pydevd_bundle.pydevd_comm_constants import CMD_THREAD_CREATE, CMD_RETURN, CMD_MODULE_EVENT, \
    CMD_WRITE_TO_CONSOLE, CMD_STEP_INTO, CMD_STEP_INTO_MY_CODE, CMD_STEP_OVER, CMD_STEP_OVER_MY_CODE, \
    CMD_STEP_RETURN, CMD_STEP_CAUGHT_EXCEPTION, CMD_ADD_EXCEPTION_BREAK, CMD_SET_BREAK, \
    CMD_SET_NEXT_STATEMENT, CMD_THREAD_SUSPEND_SINGLE_NOTIFICATION, \
    CMD_THREAD_RESUME_SINGLE_NOTIFICATION, CMD_THREAD_KILL, CMD_STOP_ON_START
from _pydevd_bundle.pydevd_constants import get_thread_id, dict_values
from _pydevd_bundle.pydevd_net_command import NetCommand, NULL_NET_COMMAND
from _pydevd_bundle.pydevd_net_command_factory_xml import NetCommandFactory
from _pydevd_bundle.pydevd_utils import get_non_pydevd_threads
import pydevd_file_utils
from _pydevd_bundle.pydevd_comm import build_exception_info_response, pydevd_find_thread_by_id
from _pydevd_bundle.pydevd_additional_thread_info_regular import set_additional_thread_info


class ModulesManager(object):

    def __init__(self):
        self._lock = threading.Lock()
        self._modules = {}
        self._next_id = partial(next, itertools.count(0))

    def track_module(self, filename_in_utf8, module_name, frame):
        '''
        :return list(NetCommand):
            Returns a list with the module events to be sent.
        '''
        if filename_in_utf8 in self._modules:
            return []

        module_events = []
        with self._lock:
            # Must check again after getting the lock.
            if filename_in_utf8 in self._modules:
                return

            version = frame.f_globals.get('__version__', '')
            package_name = frame.f_globals.get('__package__', '')
            module_id = self._next_id()

            module = Module(module_id, module_name, filename_in_utf8)
            if version:
                module.version = version

            if package_name:
                # Note: package doesn't appear in the docs but seems to be expected?
                module.kwargs['package'] = package_name

            module_event = ModuleEvent(ModuleEventBody('new', module))

            module_events.append(NetCommand(CMD_MODULE_EVENT, 0, module_event, is_json=True))

            self._modules[filename_in_utf8] = module.to_dict()
        return module_events

    def get_modules_info(self):
        '''
        :return list(Module)
        '''
        with self._lock:
            return dict_values(self._modules)


class NetCommandFactoryJson(NetCommandFactory):
    '''
    Factory for commands which will provide messages as json (they should be
    similar to the debug adapter where possible, although some differences
    are currently Ok).

    Note that it currently overrides the xml version so that messages
    can be done one at a time (any message not overridden will currently
    use the xml version) -- after having all messages handled, it should
    no longer use NetCommandFactory as the base class.
    '''

    def __init__(self):
        NetCommandFactory.__init__(self)
        self.modules_manager = ModulesManager()

    @overrides(NetCommandFactory.make_version_message)
    def make_version_message(self, seq):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_protocol_set_message)
    def make_protocol_set_message(self, seq):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_thread_created_message)
    def make_thread_created_message(self, thread):

        # Note: the thread id for the debug adapter must be an int
        # (make the actual id from get_thread_id respect that later on).
        msg = pydevd_schema.ThreadEvent(
            pydevd_schema.ThreadEventBody('started', get_thread_id(thread)),
        )

        return NetCommand(CMD_THREAD_CREATE, 0, msg, is_json=True)

    @overrides(NetCommandFactory.make_thread_killed_message)
    def make_thread_killed_message(self, tid):
        msg = pydevd_schema.ThreadEvent(
            pydevd_schema.ThreadEventBody('exited', tid),
        )

        return NetCommand(CMD_THREAD_KILL, 0, msg, is_json=True)

    @overrides(NetCommandFactory.make_list_threads_message)
    def make_list_threads_message(self, py_db, seq):
        threads = []
        for thread in get_non_pydevd_threads():
            if is_thread_alive(thread):
                thread_id = get_thread_id(thread)

                # Notify that it's created (no-op if we already notified before).
                py_db.notify_thread_created(thread_id, thread)

                thread_schema = pydevd_schema.Thread(id=thread_id, name=thread.getName())
                threads.append(thread_schema.to_dict())

        body = pydevd_schema.ThreadsResponseBody(threads)
        response = pydevd_schema.ThreadsResponse(
            request_seq=seq, success=True, command='threads', body=body)

        return NetCommand(CMD_RETURN, 0, response, is_json=True)

    @overrides(NetCommandFactory.make_get_completions_message)
    def make_get_completions_message(self, seq, completions, qualifier, start):
        COMPLETION_TYPE_LOOK_UP = {
            TYPE_IMPORT: pydevd_schema.CompletionItemType.MODULE,
            TYPE_CLASS: pydevd_schema.CompletionItemType.CLASS,
            TYPE_FUNCTION: pydevd_schema.CompletionItemType.FUNCTION,
            TYPE_ATTR: pydevd_schema.CompletionItemType.FIELD,
            TYPE_BUILTIN: pydevd_schema.CompletionItemType.KEYWORD,
            TYPE_PARAM: pydevd_schema.CompletionItemType.VARIABLE,
        }

        qualifier = qualifier.lower()
        qualifier_len = len(qualifier)
        targets = []
        for completion in completions:
            label = completion[0]
            if label.lower().startswith(qualifier):
                completion = pydevd_schema.CompletionItem(
                    label=label, type=COMPLETION_TYPE_LOOK_UP[completion[3]], start=start, length=qualifier_len)
                targets.append(completion.to_dict())

        body = pydevd_schema.CompletionsResponseBody(targets)
        response = pydevd_schema.CompletionsResponse(
            request_seq=seq, success=True, command='completions', body=body)
        return NetCommand(CMD_RETURN, 0, response, is_json=True)

    def _format_frame_name(self, fmt, initial_name, module_name, line, path):
        if fmt is None:
            return initial_name
        frame_name = initial_name
        if fmt.get('module', False):
            if module_name:
                if initial_name == '<module>':
                    frame_name = module_name
                else:
                    frame_name = '%s.%s' % (module_name, initial_name)
            else:
                basename = os.path.basename(path)
                basename = basename[0:-3] if basename.lower().endswith('.py') else basename
                if initial_name == '<module>':
                    frame_name = '%s in %s' % (initial_name, basename)
                else:
                    frame_name = '%s.%s' % (basename, initial_name)

        if fmt.get('line', False):
            frame_name = '%s : %d' % (frame_name, line)

        return frame_name

    @overrides(NetCommandFactory.make_get_thread_stack_message)
    def make_get_thread_stack_message(self, py_db, seq, thread_id, topmost_frame, fmt, must_be_suspended=False, start_frame=0, levels=0):
        frames = []
        module_events = []
        if topmost_frame is not None:
            frame_id_to_lineno = {}
            try:
                # : :type suspended_frames_manager: SuspendedFramesManager
                suspended_frames_manager = py_db.suspended_frames_manager
                info = suspended_frames_manager.get_topmost_frame_and_frame_id_to_line(thread_id)
                if info is None:
                    # Could not find stack of suspended frame...
                    if must_be_suspended:
                        return None
                else:
                    # Note: we have to use the topmost frame where it was suspended (it may
                    # be different if it was an exception).
                    topmost_frame, frame_id_to_lineno = info

                for frame_id, frame, method_name, original_filename, filename_in_utf8, lineno in self._iter_visible_frames_info(
                        py_db, topmost_frame, frame_id_to_lineno
                    ):

                    module_name = frame.f_globals.get('__name__', '')

                    module_events.extend(self.modules_manager.track_module(filename_in_utf8, module_name, frame))

                    presentation_hint = None
                    if not getattr(frame, 'IS_PLUGIN_FRAME', False):  # Never filter out plugin frames!
                        if py_db.is_files_filter_enabled and py_db.apply_files_filter(frame, original_filename, False):
                            continue

                        if not py_db.in_project_scope(frame):
                            presentation_hint = 'subtle'

                    formatted_name = self._format_frame_name(fmt, method_name, module_name, lineno, filename_in_utf8)
                    frames.append(pydevd_schema.StackFrame(
                        frame_id, formatted_name, lineno, column=1, source={
                            'path': filename_in_utf8,
                            'sourceReference': pydevd_file_utils.get_client_filename_source_reference(filename_in_utf8),
                        },
                        presentationHint=presentation_hint).to_dict())
            finally:
                topmost_frame = None

        for module_event in module_events:
            py_db.writer.add_command(module_event)

        total_frames = len(frames)
        stack_frames = frames
        if bool(levels):
            start = start_frame
            end = min(start + levels, total_frames)
            stack_frames = frames[start:end]

        response = pydevd_schema.StackTraceResponse(
            request_seq=seq,
            success=True,
            command='stackTrace',
            body=pydevd_schema.StackTraceResponseBody(stackFrames=stack_frames, totalFrames=total_frames))
        return NetCommand(CMD_RETURN, 0, response, is_json=True)

    @overrides(NetCommandFactory.make_io_message)
    def make_io_message(self, v, ctx):
        category = 'stdout' if int(ctx) == 1 else 'stderr'
        body = OutputEventBody(v, category)
        event = OutputEvent(body)
        return NetCommand(CMD_WRITE_TO_CONSOLE, 0, event, is_json=True)

    _STEP_REASONS = set([
        CMD_STEP_INTO,
        CMD_STEP_INTO_MY_CODE,
        CMD_STEP_OVER,
        CMD_STEP_OVER_MY_CODE,
        CMD_STEP_RETURN,
        CMD_STEP_INTO_MY_CODE,
    ])
    _EXCEPTION_REASONS = set([
        CMD_STEP_CAUGHT_EXCEPTION,
        CMD_ADD_EXCEPTION_BREAK,
    ])

    @overrides(NetCommandFactory.make_thread_suspend_single_notification)
    def make_thread_suspend_single_notification(self, py_db, thread_id, stop_reason):
        exc_desc = None
        exc_name = None
        thread = pydevd_find_thread_by_id(thread_id)
        info = set_additional_thread_info(thread)

        if stop_reason in self._STEP_REASONS:
            if info.pydev_original_step_cmd == CMD_STOP_ON_START:

                # Just to make sure that's not set as the original reason anymore.
                info.pydev_original_step_cmd = -1
                stop_reason = 'entry'
            else:
                stop_reason = 'step'
        elif stop_reason in self._EXCEPTION_REASONS:
            stop_reason = 'exception'
        elif stop_reason == CMD_SET_BREAK:
            stop_reason = 'breakpoint'
        elif stop_reason == CMD_SET_NEXT_STATEMENT:
            stop_reason = 'goto'
        else:
            stop_reason = 'pause'

        if stop_reason == 'exception':
            exception_info_response = build_exception_info_response(
                py_db, thread_id, -1, set_additional_thread_info, self._iter_visible_frames_info, max_frames=-1)
            exception_info_response

            exc_name = exception_info_response.body.exceptionId
            exc_desc = exception_info_response.body.description

        body = pydevd_schema.StoppedEventBody(
            reason=stop_reason,
            description=exc_desc,
            threadId=thread_id,
            text=exc_name,
            allThreadsStopped=True,
            preserveFocusHint=stop_reason not in ['step', 'exception', 'breakpoint', 'entry', 'goto'],
        )
        event = pydevd_schema.StoppedEvent(body)
        return NetCommand(CMD_THREAD_SUSPEND_SINGLE_NOTIFICATION, 0, event, is_json=True)

    @overrides(NetCommandFactory.make_thread_resume_single_notification)
    def make_thread_resume_single_notification(self, thread_id):
        body = ContinuedEventBody(threadId=thread_id, allThreadsContinued=True)
        event = pydevd_schema.ContinuedEvent(body)
        return NetCommand(CMD_THREAD_RESUME_SINGLE_NOTIFICATION, 0, event, is_json=True)

    @overrides(NetCommandFactory.make_set_next_stmnt_status_message)
    def make_set_next_stmnt_status_message(self, seq, is_success, exception_msg):
        response = pydevd_schema.GotoResponse(
            request_seq=int(seq),
            success=is_success,
            command='goto',
            body={},
            message=(None if is_success else exception_msg))
        return NetCommand(CMD_RETURN, 0, response, is_json=True)

    @overrides(NetCommandFactory.make_send_curr_exception_trace_message)
    def make_send_curr_exception_trace_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_send_curr_exception_trace_proceeded_message)
    def make_send_curr_exception_trace_proceeded_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_send_breakpoint_exception_message)
    def make_send_breakpoint_exception_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_process_created_message)
    def make_process_created_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_thread_suspend_message)
    def make_thread_suspend_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_thread_run_message)
    def make_thread_run_message(self, *args, **kwargs):
        return NULL_NET_COMMAND  # Not a part of the debug adapter protocol

    @overrides(NetCommandFactory.make_skipped_step_in_because_of_filters)
    def make_skipped_step_in_because_of_filters(self, py_db, frame):
        msg = 'Frame skipped from debugging during step-in.'
        if py_db.get_use_libraries_filter():
            msg += '\nNote: may have been skipped because of "justMyCode" option (default == true).'

        body = OutputEventBody(msg, category='console')
        event = OutputEvent(body)
        return NetCommand(CMD_WRITE_TO_CONSOLE, 0, event, is_json=True)

