'''
Entry point module (keep at root):

This module starts the debugger.
'''
import sys  # @NoMove
if sys.version_info[:2] < (2, 6):
    raise RuntimeError('The PyDev.Debugger requires Python 2.6 onwards to be run. If you need to use an older Python version, use an older version of the debugger.')

import atexit
from collections import defaultdict
from contextlib import contextmanager
from functools import partial
import itertools
import os
import traceback
import weakref

from _pydev_bundle import pydev_imports, pydev_log
from _pydev_bundle._pydev_filesystem_encoding import getfilesystemencoding
from _pydev_bundle.pydev_is_thread_alive import is_thread_alive
from _pydev_bundle.pydev_override import overrides
from _pydev_imps._pydev_saved_modules import thread
from _pydev_imps._pydev_saved_modules import threading
from _pydev_imps._pydev_saved_modules import time
from _pydevd_bundle import pydevd_extension_utils
from _pydevd_bundle.pydevd_filtering import FilesFiltering
from _pydevd_bundle import pydevd_io, pydevd_vm_type
from _pydevd_bundle import pydevd_utils
from _pydevd_bundle.pydevd_additional_thread_info import set_additional_thread_info
from _pydevd_bundle.pydevd_breakpoints import ExceptionBreakpoint, get_exception_breakpoint
from _pydevd_bundle.pydevd_comm_constants import (CMD_THREAD_SUSPEND, CMD_STEP_INTO, CMD_SET_BREAK,
    CMD_STEP_INTO_MY_CODE, CMD_STEP_OVER, CMD_SMART_STEP_INTO, CMD_RUN_TO_LINE,
    CMD_SET_NEXT_STATEMENT, CMD_STEP_RETURN, CMD_ADD_EXCEPTION_BREAK, CMD_STEP_RETURN_MY_CODE,
    CMD_STEP_OVER_MY_CODE)
from _pydevd_bundle.pydevd_constants import (IS_JYTH_LESS25, get_thread_id, get_current_thread_id,
    dict_keys, dict_iter_items, DebugInfoHolder, PYTHON_SUSPEND, STATE_SUSPEND, STATE_RUN, get_frame,
    clear_cached_thread_id, INTERACTIVE_MODE_AVAILABLE, SHOW_DEBUG_INFO_ENV, IS_PY34_OR_GREATER, IS_PY2, NULL,
    NO_FTRACE, IS_IRONPYTHON, JSON_PROTOCOL, IS_CPYTHON)
from _pydevd_bundle.pydevd_defaults import PydevdCustomization
from _pydevd_bundle.pydevd_custom_frames import CustomFramesContainer, custom_frames_container_init
from _pydevd_bundle.pydevd_dont_trace_files import DONT_TRACE, PYDEV_FILE, LIB_FILE
from _pydevd_bundle.pydevd_extension_api import DebuggerEventHandler
from _pydevd_bundle.pydevd_frame_utils import add_exception_to_frame, remove_exception_from_frame
from _pydevd_bundle.pydevd_kill_all_pydevd_threads import kill_all_pydev_threads
from _pydevd_bundle.pydevd_net_command_factory_xml import NetCommandFactory
from _pydevd_bundle.pydevd_trace_dispatch import (
    trace_dispatch as _trace_dispatch, global_cache_skips, global_cache_frame_skips, fix_top_level_trace_and_get_trace_func)
from _pydevd_bundle.pydevd_utils import save_main_module, is_current_thread_main_thread
from _pydevd_frame_eval.pydevd_frame_eval_main import (
    frame_eval_func, dummy_trace_dispatch)
import pydev_ipython  # @UnusedImport
from _pydevd_bundle.pydevd_source_mapping import SourceMapping
from pydevd_concurrency_analyser.pydevd_concurrency_logger import ThreadingLogger, AsyncioLogger, send_message, cur_time
from pydevd_concurrency_analyser.pydevd_thread_wrappers import wrap_threads
from pydevd_file_utils import get_abs_path_real_path_and_base_from_frame, NORM_PATHS_AND_BASE_CONTAINER, get_abs_path_real_path_and_base_from_file
from pydevd_file_utils import get_fullname, rPath, get_package_dir
import pydevd_tracing
from _pydevd_bundle.pydevd_comm import (InternalThreadCommand, InternalThreadCommandForAnyThread,
    create_server_socket)
from _pydevd_bundle.pydevd_comm import(InternalConsoleExec,
    PyDBDaemonThread, _queue, ReaderThread, GetGlobalDebugger, get_global_debugger,
    set_global_debugger, WriterThread,
    start_client, start_server, InternalGetBreakpointException, InternalSendCurrExceptionTrace,
    InternalSendCurrExceptionTraceProceeded, run_as_pydevd_daemon_thread)

from _pydevd_bundle.pydevd_breakpoints import stop_on_unhandled_exception
from _pydevd_bundle.pydevd_collect_try_except_info import collect_try_except_info
from _pydevd_bundle.pydevd_suspended_frames import SuspendedFramesManager
from socket import SHUT_RDWR
from _pydevd_bundle.pydevd_api import PyDevdAPI

__version_info__ = (1, 3, 3)
__version_info_str__ = []
for v in __version_info__:
    __version_info_str__.append(str(v))

__version__ = '.'.join(__version_info_str__)

# IMPORTANT: pydevd_constants must be the 1st thing defined because it'll keep a reference to the original sys._getframe


def install_breakpointhook(pydevd_breakpointhook=None):
    if pydevd_breakpointhook is None:

        def pydevd_breakpointhook(*args, **kwargs):
            hookname = os.getenv('PYTHONBREAKPOINT')
            if (
                   hookname is not None
                   and len(hookname) > 0
                   and hasattr(sys, '__breakpointhook__')
                   and sys.__breakpointhook__ != pydevd_breakpointhook
                ):
                sys.__breakpointhook__(*args, **kwargs)
            else:
                settrace(*args, **kwargs)

    if sys.version_info[0:2] >= (3, 7):
        # There are some choices on how to provide the breakpoint hook. Namely, we can provide a
        # PYTHONBREAKPOINT which provides the import path for a method to be executed or we
        # can override sys.breakpointhook.
        # pydevd overrides sys.breakpointhook instead of providing an environment variable because
        # it's possible that the debugger starts the user program but is not available in the
        # PYTHONPATH (and would thus fail to be imported if PYTHONBREAKPOINT was set to pydevd.settrace).
        # Note that the implementation still takes PYTHONBREAKPOINT in account (so, if it was provided
        # by someone else, it'd still work).
        sys.breakpointhook = pydevd_breakpointhook
    else:
        if sys.version_info[0] >= 3:
            import builtins as __builtin__  # Py3 noqa
        else:
            import __builtin__  # noqa

        # In older versions, breakpoint() isn't really available, so, install the hook directly
        # in the builtins.
        __builtin__.breakpoint = pydevd_breakpointhook
        sys.__breakpointhook__ = pydevd_breakpointhook


# Install the breakpoint hook at import time.
install_breakpointhook()

SUPPORT_PLUGINS = not IS_JYTH_LESS25
PluginManager = None
if SUPPORT_PLUGINS:
    from _pydevd_bundle.pydevd_plugin_utils import PluginManager

threadingEnumerate = threading.enumerate
threadingCurrentThread = threading.currentThread

try:
    'dummy'.encode('utf-8')  # Added because otherwise Jython 2.2.1 wasn't finding the encoding (if it wasn't loaded in the main thread).
except:
    pass

_debugger_setup = False
bufferStdOutToServer = False
bufferStdErrToServer = False

file_system_encoding = getfilesystemencoding()

_CACHE_FILE_TYPE = {}


#=======================================================================================================================
# PyDBCommandThread
#=======================================================================================================================
class PyDBCommandThread(PyDBDaemonThread):

    def __init__(self, py_db):
        PyDBDaemonThread.__init__(self)
        self._py_db_command_thread_event = py_db._py_db_command_thread_event
        self.py_db = py_db
        self.setName('pydevd.CommandThread')

    @overrides(PyDBDaemonThread._on_run)
    def _on_run(self):
        # Delay a bit this initialization to wait for the main program to start.
        time.sleep(0.3)

        if self.killReceived:
            return

        try:
            while not self.killReceived:
                try:
                    self.py_db.process_internal_commands()
                except:
                    pydev_log.info('Finishing debug communication...(2)')
                self._py_db_command_thread_event.clear()
                self._py_db_command_thread_event.wait(0.3)
        except:
            try:
                pydev_log.debug(sys.exc_info()[0])
            except:
                # In interpreter shutdown many things can go wrong (any module variables may
                # be None, streams can be closed, etc).
                pass

            # only got this error in interpreter shutdown
            # pydev_log.info('Finishing debug communication...(3)')


#=======================================================================================================================
# CheckOutputThread
# Non-daemon thread: guarantees that all data is written even if program is finished
#=======================================================================================================================
class CheckOutputThread(PyDBDaemonThread):

    def __init__(self, py_db):
        PyDBDaemonThread.__init__(self)
        self.py_db = py_db
        self.setName('pydevd.CheckAliveThread')
        self.daemon = False

    @overrides(PyDBDaemonThread._on_run)
    def _on_run(self):
        while not self.killReceived:
            time.sleep(0.3)
            if not self.py_db.has_threads_alive() and self.py_db.writer.empty():
                try:
                    pydev_log.debug("No threads alive, finishing debug session")
                    self.py_db.finish_debugging_session()
                    kill_all_pydev_threads()
                    self.wait_pydb_threads_to_finish()
                except:
                    pydev_log.exception()

                self.killReceived = True
                return

            self.py_db.check_output_redirect()

    def wait_pydb_threads_to_finish(self, timeout=0.5):
        pydev_log.debug("Waiting for pydb daemon threads to finish")
        pydb_daemon_threads = self.created_pydb_daemon_threads
        started_at = time.time()
        while time.time() < started_at + timeout:
            if len(pydb_daemon_threads) == 1 and pydb_daemon_threads.get(self, None):
                return
            time.sleep(1 / 30.)
        pydev_log.debug("The following pydb threads may not have finished correctly: %s",
                        ', '.join([t.getName() for t in pydb_daemon_threads if t is not self]))


class AbstractSingleNotificationBehavior(object):
    '''
    The basic usage should be:

    # Increment the request time for the suspend.
    single_notification_behavior.increment_suspend_time()

    # Notify that this is a pause request (when a pause, not a breakpoint).
    single_notification_behavior.on_pause()

    # Mark threads to be suspended.
    set_suspend(...)

    # On do_wait_suspend, use notify_thread_suspended:
    def do_wait_suspend(...):
        with single_notification_behavior.notify_thread_suspended(thread_id):
            ...
    '''

    __slots__ = [
        '_last_resume_notification_time',
        '_last_suspend_notification_time',
        '_lock',
        '_next_request_time',
        '_suspend_time_request',
        '_suspended_thread_ids',
        '_pause_requested',
    ]

    NOTIFY_OF_PAUSE_TIMEOUT = .5

    def __init__(self):
        self._next_request_time = partial(next, itertools.count())
        self._last_suspend_notification_time = -1
        self._last_resume_notification_time = -1
        self._suspend_time_request = self._next_request_time()
        self._lock = thread.allocate_lock()
        self._suspended_thread_ids = set()
        self._pause_requested = False

    def send_suspend_notification(self, thread_id, stop_reason):
        raise AssertionError('abstract: subclasses must override.')

    def send_resume_notification(self, thread_id):
        raise AssertionError('abstract: subclasses must override.')

    def increment_suspend_time(self):
        with self._lock:
            self._suspend_time_request = self._next_request_time()

    def on_pause(self):
        # Upon a pause, we should force sending new suspend notifications
        # if no notification is sent after some time and there's some thread already stopped.
        with self._lock:
            self._pause_requested = True
            global_suspend_time = self._suspend_time_request
        run_as_pydevd_daemon_thread(self._notify_after_timeout, global_suspend_time)

    def _notify_after_timeout(self, global_suspend_time):
        time.sleep(self.NOTIFY_OF_PAUSE_TIMEOUT)
        with self._lock:
            if self._suspended_thread_ids:
                if global_suspend_time > self._last_suspend_notification_time:
                    self._last_suspend_notification_time = global_suspend_time
                    # Notify about any thread which is currently suspended.
                    self.send_suspend_notification(next(iter(self._suspended_thread_ids)), CMD_THREAD_SUSPEND)

    @contextmanager
    def notify_thread_suspended(self, thread_id, stop_reason):
        with self._lock:
            pause_requested = self._pause_requested
            if pause_requested:
                # When a suspend notification is sent, reset the pause flag.
                self._pause_requested = False

            self._suspended_thread_ids.add(thread_id)

            # CMD_THREAD_SUSPEND should always be a side-effect of a break, so, only
            # issue for a CMD_THREAD_SUSPEND if a pause is pending.
            if stop_reason != CMD_THREAD_SUSPEND or pause_requested:
                if self._suspend_time_request > self._last_suspend_notification_time:
                    self._last_suspend_notification_time = self._suspend_time_request
                    self.send_suspend_notification(thread_id, stop_reason)
        try:
            yield  # At this point the thread must be actually suspended.
        finally:
            # on resume (step, continue all):
            with self._lock:
                self._suspended_thread_ids.remove(thread_id)
                if self._last_resume_notification_time < self._last_suspend_notification_time:
                    self._last_resume_notification_time = self._last_suspend_notification_time
                    self.send_resume_notification(thread_id)


class ThreadsSuspendedSingleNotification(AbstractSingleNotificationBehavior):

    __slots__ = AbstractSingleNotificationBehavior.__slots__ + [
        'multi_threads_single_notification', '_py_db', '_callbacks', '_callbacks_lock']

    def __init__(self, py_db):
        AbstractSingleNotificationBehavior.__init__(self)
        # If True, pydevd will send a single notification when all threads are suspended/resumed.
        self.multi_threads_single_notification = False
        self._py_db = weakref.ref(py_db)
        self._callbacks_lock = threading.Lock()
        self._callbacks = []

    def add_on_resumed_callback(self, callback):
        with self._callbacks_lock:
            self._callbacks.append(callback)

    @overrides(AbstractSingleNotificationBehavior.send_resume_notification)
    def send_resume_notification(self, thread_id):
        py_db = self._py_db()
        if py_db is not None:
            py_db.writer.add_command(py_db.cmd_factory.make_thread_resume_single_notification(thread_id))

            with self._callbacks_lock:
                callbacks = self._callbacks
                self._callbacks = []

            for callback in callbacks:
                callback()

    @overrides(AbstractSingleNotificationBehavior.send_suspend_notification)
    def send_suspend_notification(self, thread_id, stop_reason):
        py_db = self._py_db()
        if py_db is not None:
            py_db.writer.add_command(py_db.cmd_factory.make_thread_suspend_single_notification(py_db, thread_id, stop_reason))

    @overrides(AbstractSingleNotificationBehavior.notify_thread_suspended)
    @contextmanager
    def notify_thread_suspended(self, thread_id, stop_reason):
        if self.multi_threads_single_notification:
            with AbstractSingleNotificationBehavior.notify_thread_suspended(self, thread_id, stop_reason):
                yield
        else:
            yield


class PyDB(object):
    """ Main debugging class
    Lots of stuff going on here:

    PyDB starts two threads on startup that connect to remote debugger (RDB)
    The threads continuously read & write commands to RDB.
    PyDB communicates with these threads through command queues.
       Every RDB command is processed by calling process_net_command.
       Every PyDB net command is sent to the net by posting NetCommand to WriterThread queue

       Some commands need to be executed on the right thread (suspend/resume & friends)
       These are placed on the internal command queue.
    """

    def __init__(self, set_as_global=True):
        if set_as_global:
            pydevd_tracing.replace_sys_set_trace_func()

        self.reader = None
        self.writer = None
        self._waiting_for_connection_thread = None
        self._on_configuration_done_event = threading.Event()
        self.output_checker_thread = None
        self.py_db_command_thread = None
        self.quitting = None
        self.cmd_factory = NetCommandFactory()
        self._cmd_queue = defaultdict(_queue.Queue)  # Key is thread id or '*', value is Queue
        self.suspended_frames_manager = SuspendedFramesManager()
        self._files_filtering = FilesFiltering()
        self.source_mapping = SourceMapping()

        # These are the breakpoints received by the PyDevdAPI. They are meant to store
        # the breakpoints in the api -- its actual contents are managed by the api.
        self.api_received_breakpoints = {}

        # These are the breakpoints meant to be consumed during runtime.
        self.breakpoints = {}

        # Set communication protocol
        PyDevdAPI().set_protocol(self, 0, PydevdCustomization.DEFAULT_PROTOCOL)

        # mtime to be raised when breakpoints change
        self.mtime = 0

        self.file_to_id_to_line_breakpoint = {}
        self.file_to_id_to_plugin_breakpoint = {}

        # Note: breakpoints dict should not be mutated: a copy should be created
        # and later it should be assigned back (to prevent concurrency issues).
        self.break_on_uncaught_exceptions = {}
        self.break_on_caught_exceptions = {}

        self.ready_to_run = False
        self._main_lock = thread.allocate_lock()
        self._lock_running_thread_ids = thread.allocate_lock()
        self._py_db_command_thread_event = threading.Event()
        if set_as_global:
            CustomFramesContainer._py_db_command_thread_event = self._py_db_command_thread_event

        self._finish_debugging_session = False
        self._termination_event_set = False
        self.signature_factory = None
        self.SetTrace = pydevd_tracing.SetTrace
        self.skip_on_exceptions_thrown_in_same_context = False
        self.ignore_exceptions_thrown_in_lines_with_ignore_exception = True

        # Suspend debugger even if breakpoint condition raises an exception.
        # May be changed with CMD_PYDEVD_JSON_CONFIG.
        self.skip_suspend_on_breakpoint_exception = ()  # By default suspend on any Exception.
        self.skip_print_breakpoint_exception = ()  # By default print on any Exception.

        # By default user can step into properties getter/setter/deleter methods
        self.disable_property_trace = False
        self.disable_property_getter_trace = False
        self.disable_property_setter_trace = False
        self.disable_property_deleter_trace = False

        # this is a dict of thread ids pointing to thread ids. Whenever a command is passed to the java end that
        # acknowledges that a thread was created, the thread id should be passed here -- and if at some time we do not
        # find that thread alive anymore, we must remove it from this list and make the java side know that the thread
        # was killed.
        self._running_thread_ids = {}
        # Note: also access '_enable_thread_notifications' with '_lock_running_thread_ids'
        self._enable_thread_notifications = False

        self._set_breakpoints_with_id = False

        # This attribute holds the file-> lines which have an @IgnoreException.
        self.filename_to_lines_where_exceptions_are_ignored = {}

        # working with plugins (lazily initialized)
        self.plugin = None
        self.has_plugin_line_breaks = False
        self.has_plugin_exception_breaks = False
        self.thread_analyser = None
        self.asyncio_analyser = None

        # matplotlib support in debugger and debug console
        self.mpl_in_use = False
        self.mpl_hooks_in_debug_console = False
        self.mpl_modules_for_patching = {}

        self._filename_to_not_in_scope = {}
        self.first_breakpoint_reached = False
        self._exclude_filters_enabled = self._files_filtering.use_exclude_filters()
        self._is_libraries_filter_enabled = self._files_filtering.use_libraries_filter()
        self.is_files_filter_enabled = self._exclude_filters_enabled or self._is_libraries_filter_enabled
        self.show_return_values = False
        self.remove_return_values_flag = False
        self.redirect_output = False

        # this flag disables frame evaluation even if it's available
        self.use_frame_eval = True

        # If True, pydevd will send a single notification when all threads are suspended/resumed.
        self._threads_suspended_single_notification = ThreadsSuspendedSingleNotification(self)

        # If True a step command will do a step in one thread and will also resume all other threads.
        self.stepping_resumes_all_threads = False

        self._local_thread_trace_func = threading.local()

        # Bind many locals to the debugger because upon teardown those names may become None
        # in the namespace (and thus can't be relied upon unless the reference was previously
        # saved).
        if IS_IRONPYTHON:

            # A partial() cannot be used in IronPython for sys.settrace.
            def new_trace_dispatch(frame, event, arg):
                return _trace_dispatch(self, frame, event, arg)

            self.trace_dispatch = new_trace_dispatch
        else:
            self.trace_dispatch = partial(_trace_dispatch, self)
        self.fix_top_level_trace_and_get_trace_func = fix_top_level_trace_and_get_trace_func
        self.frame_eval_func = frame_eval_func
        self.dummy_trace_dispatch = dummy_trace_dispatch

        # Note: this is different from pydevd_constants.thread_get_ident because we want Jython
        # to be None here because it also doesn't have threading._active.
        try:
            self.threading_get_ident = threading.get_ident  # Python 3
            self.threading_active = threading._active
        except:
            try:
                self.threading_get_ident = threading._get_ident  # Python 2 noqa
                self.threading_active = threading._active
            except:
                self.threading_get_ident = None  # Jython
                self.threading_active = None
        self.threading_current_thread = threading.currentThread
        self.set_additional_thread_info = set_additional_thread_info
        self.stop_on_unhandled_exception = stop_on_unhandled_exception
        self.collect_try_except_info = collect_try_except_info
        self.get_exception_breakpoint = get_exception_breakpoint
        self._dont_trace_get_file_type = DONT_TRACE.get
        self.PYDEV_FILE = PYDEV_FILE
        self.LIB_FILE = LIB_FILE

        self._in_project_scope_cache = {}
        self._exclude_by_filter_cache = {}
        self._apply_filter_cache = {}
        self._ignore_system_exit_codes = set()

        if set_as_global:
            # Set as the global instance only after it's initialized.
            set_global_debugger(self)

    def on_configuration_done(self):
        '''
        Note: only called when using the DAP (Debug Adapter Protocol).
        '''
        self._on_configuration_done_event.set()

    def on_disconnect(self):
        '''
        Note: only called when using the DAP (Debug Adapter Protocol).
        '''
        self._on_configuration_done_event.clear()

    def set_ignore_system_exit_codes(self, ignore_system_exit_codes):
        assert isinstance(ignore_system_exit_codes, (list, tuple, set))
        self._ignore_system_exit_codes = set(ignore_system_exit_codes)

    def ignore_system_exit_code(self, system_exit_exc):
        if hasattr(system_exit_exc, 'code'):
            return system_exit_exc.code in self._ignore_system_exit_codes
        else:
            return system_exit_exc in self._ignore_system_exit_codes

    def block_until_configuration_done(self):
        self._on_configuration_done_event.wait()

    def add_fake_frame(self, thread_id, frame_id, frame):
        self.suspended_frames_manager.add_fake_frame(thread_id, frame_id, frame)

    def handle_breakpoint_condition(self, info, pybreakpoint, new_frame):
        condition = pybreakpoint.condition
        try:
            if pybreakpoint.handle_hit_condition(new_frame):
                return True

            if not condition:
                return False

            return eval(condition, new_frame.f_globals, new_frame.f_locals)
        except Exception as e:
            if IS_PY2:
                # Must be bytes on py2.
                if isinstance(condition, unicode):  # noqa
                    condition = condition.encode('utf-8')

            if not isinstance(e, self.skip_print_breakpoint_exception):
                sys.stderr.write('Error while evaluating expression: %s\n' % (condition,))

                etype, value, tb = sys.exc_info()
                traceback.print_exception(etype, value, tb.tb_next)

            if not isinstance(e, self.skip_suspend_on_breakpoint_exception):
                try:
                    # add exception_type and stacktrace into thread additional info
                    etype, value, tb = sys.exc_info()
                    error = ''.join(traceback.format_exception_only(etype, value))
                    stack = traceback.extract_stack(f=tb.tb_frame.f_back)

                    # On self.set_suspend(thread, CMD_SET_BREAK) this info will be
                    # sent to the client.
                    info.conditional_breakpoint_exception = \
                        ('Condition:\n' + condition + '\n\nError:\n' + error, stack)
                except:
                    pydev_log.exception()
                return True

            return False

        finally:
            etype, value, tb = None, None, None

    def handle_breakpoint_expression(self, pybreakpoint, info, new_frame):
        try:
            try:
                val = eval(pybreakpoint.expression, new_frame.f_globals, new_frame.f_locals)
            except:
                val = sys.exc_info()[1]
        finally:
            if val is not None:
                info.pydev_message = str(val)

    def _internal_get_file_type(self, abs_real_path_and_basename):
        basename = abs_real_path_and_basename[-1]
        if basename.startswith('<frozen '):
            # In Python 3.7 "<frozen ..." appear multiple times during import and should be
            # ignored for the user.
            return self.PYDEV_FILE
        return self._dont_trace_get_file_type(basename)

    def dont_trace_external_files(self, abs_path):
        '''
        :param abs_path:
            The result from get_abs_path_real_path_and_base_from_file or
            get_abs_path_real_path_and_base_from_frame.

        :return
            True :
                If files should NOT be traced.

            False:
                If files should be traced.
        '''
        # By default all external files are traced. Note: this function is expected to
        # be changed for another function in PyDevdAPI.set_dont_trace_start_end_patterns.
        return False

    def get_file_type(self, frame, abs_real_path_and_basename=None, _cache_file_type=_CACHE_FILE_TYPE):
        '''
        :param abs_real_path_and_basename:
            The result from get_abs_path_real_path_and_base_from_file or
            get_abs_path_real_path_and_base_from_frame.

        :return
            _pydevd_bundle.pydevd_dont_trace_files.PYDEV_FILE:
                If it's a file internal to the debugger which shouldn't be
                traced nor shown to the user.

            _pydevd_bundle.pydevd_dont_trace_files.LIB_FILE:
                If it's a file in a library which shouldn't be traced.

            None:
                If it's a regular user file which should be traced.
        '''
        if abs_real_path_and_basename is None:
            try:
                # Make fast path faster!
                abs_real_path_and_basename = NORM_PATHS_AND_BASE_CONTAINER[frame.f_code.co_filename]
            except:
                abs_real_path_and_basename = get_abs_path_real_path_and_base_from_frame(frame)

        # Note 1: we have to take into account that we may have files as '<string>', and that in
        # this case the cache key can't rely only on the filename. With the current cache, there's
        # still a potential miss if 2 functions which have exactly the same content are compiled
        # with '<string>', but in practice as we only separate the one from python -c from the rest
        # this shouldn't be a problem in practice.

        # Note 2: firstlineno added to make misses faster in the first comparison.

        # Note 3: this cache key is repeated in pydevd_frame_evaluator.pyx:get_func_code_info (for
        # speedups).
        cache_key = (frame.f_code.co_firstlineno, abs_real_path_and_basename[0], frame.f_code)
        try:
            return _cache_file_type[cache_key]
        except:
            if abs_real_path_and_basename[0] == '<string>':

                # Consider it an untraceable file unless there's no back frame (ignoring
                # internal files and runpy.py).
                f = frame.f_back
                while f is not None:
                    if (self.get_file_type(f) != self.PYDEV_FILE and
                            get_abs_path_real_path_and_base_from_file(f.f_code.co_filename)[2] != 'runpy.py'):
                        # We found some back frame that's not internal, which means we must consider
                        # this a library file.
                        # This is done because we only want to trace files as <string> if they don't
                        # have any back frame (which is the case for python -c ...), for all other
                        # cases we don't want to trace them because we can't show the source to the
                        # user (at least for now...).

                        # Note that we return as a LIB_FILE and not PYDEV_FILE because we still want
                        # to show it in the stack.
                        _cache_file_type[cache_key] = LIB_FILE
                        return LIB_FILE
                    f = f.f_back
                else:
                    # This is a top-level file (used in python -c), so, trace it as usual... we
                    # still won't be able to show the sources, but some tests require this to work.
                    _cache_file_type[cache_key] = None
                    return None

            file_type = self._internal_get_file_type(abs_real_path_and_basename)
            if file_type is None:
                if self.dont_trace_external_files(abs_real_path_and_basename[0]):
                    file_type = PYDEV_FILE
            _cache_file_type[cache_key] = file_type
            return file_type

    def is_cache_file_type_empty(self):
        return not _CACHE_FILE_TYPE

    def get_cache_file_type(self, _cache=_CACHE_FILE_TYPE):  # i.e.: Make it local.
        return _cache

    def get_thread_local_trace_func(self):
        try:
            thread_trace_func = self._local_thread_trace_func.thread_trace_func
        except AttributeError:
            thread_trace_func = self.trace_dispatch
        return thread_trace_func

    def enable_tracing(self, thread_trace_func=None, apply_to_all_threads=False):
        '''
        Enables tracing.

        If in regular mode (tracing), will set the tracing function to the tracing
        function for this thread -- by default it's `PyDB.trace_dispatch`, but after
        `PyDB.enable_tracing` is called with a `thread_trace_func`, the given function will
        be the default for the given thread.

        :param bool apply_to_all_threads:
            If True we'll set the tracing function in all threads, not only in the current thread.
            If False only the tracing for the current function should be changed.
            In general apply_to_all_threads should only be true if this is the first time
            this function is called on a multi-threaded program (either programmatically or attach
            to pid).
        '''
        if self.frame_eval_func is not None:
            self.frame_eval_func()
            pydevd_tracing.SetTrace(self.dummy_trace_dispatch)

            if IS_CPYTHON and apply_to_all_threads:
                pydevd_tracing.set_trace_to_threads(self.dummy_trace_dispatch)
            return

        if apply_to_all_threads:
            # If applying to all threads, don't use the local thread trace function.
            assert thread_trace_func is not None
        else:
            if thread_trace_func is None:
                thread_trace_func = self.get_thread_local_trace_func()
            else:
                self._local_thread_trace_func.thread_trace_func = thread_trace_func

        pydevd_tracing.SetTrace(thread_trace_func)
        if IS_CPYTHON and apply_to_all_threads:
            pydevd_tracing.set_trace_to_threads(thread_trace_func)

    def disable_tracing(self):
        pydevd_tracing.SetTrace(None)

    def on_breakpoints_changed(self, removed=False):
        '''
        When breakpoints change, we have to re-evaluate all the assumptions we've made so far.
        '''
        if not self.ready_to_run:
            # No need to do anything if we're still not running.
            return

        self.mtime += 1
        if not removed:
            # When removing breakpoints we can leave tracing as was, but if a breakpoint was added
            # we have to reset the tracing for the existing functions to be re-evaluated.
            self.set_tracing_for_untraced_contexts()

    def set_tracing_for_untraced_contexts(self):
        # Enable the tracing for existing threads (because there may be frames being executed that
        # are currently untraced).

        if IS_CPYTHON:
            # Note: use sys._current_frames instead of threading.enumerate() because this way
            # we also see C/C++ threads, not only the ones visible to the threading module.
            tid_to_frame = sys._current_frames()

            ignore_thread_ids = set(
                t.ident for t in threadingEnumerate()
                if getattr(t, 'is_pydev_daemon_thread', False) or getattr(t, 'pydev_do_not_trace', False)
            )

            for thread_id, frame in tid_to_frame.items():
                if thread_id not in ignore_thread_ids:
                    self.set_trace_for_frame_and_parents(frame)

        else:
            try:
                threads = threadingEnumerate()
                for t in threads:
                    if getattr(t, 'is_pydev_daemon_thread', False) or getattr(t, 'pydev_do_not_trace', False):
                        continue

                    additional_info = set_additional_thread_info(t)
                    frame = additional_info.get_topmost_frame(t)
                    try:
                        if frame is not None:
                            self.set_trace_for_frame_and_parents(frame)
                    finally:
                        frame = None
            finally:
                frame = None
                t = None
                threads = None
                additional_info = None

    @property
    def multi_threads_single_notification(self):
        return self._threads_suspended_single_notification.multi_threads_single_notification

    @multi_threads_single_notification.setter
    def multi_threads_single_notification(self, notify):
        self._threads_suspended_single_notification.multi_threads_single_notification = notify

    @property
    def threads_suspended_single_notification(self):
        return self._threads_suspended_single_notification

    def get_plugin_lazy_init(self):
        if self.plugin is None and SUPPORT_PLUGINS:
            self.plugin = PluginManager(self)
        return self.plugin

    def in_project_scope(self, frame, filename=None):
        '''
        Note: in general this method should not be used (apply_files_filter should be used
        in most cases as it also handles the project scope check).

        :param frame:
            The frame we want to check.

        :param filename:
            Must be the result from get_abs_path_real_path_and_base_from_frame(frame)[0] (can
            be used to speed this function a bit if it's already available to the caller, but
            in general it's not needed).
        '''
        try:
            if filename is None:
                try:
                    # Make fast path faster!
                    abs_real_path_and_basename = NORM_PATHS_AND_BASE_CONTAINER[frame.f_code.co_filename]
                except:
                    abs_real_path_and_basename = get_abs_path_real_path_and_base_from_frame(frame)

                filename = abs_real_path_and_basename[0]

            cache_key = (frame.f_code.co_firstlineno, filename, frame.f_code)

            return self._in_project_scope_cache[cache_key]
        except KeyError:
            cache = self._in_project_scope_cache
            try:
                abs_real_path_and_basename  # If we've gotten it previously, use it again.
            except NameError:
                abs_real_path_and_basename = get_abs_path_real_path_and_base_from_frame(frame)

            # pydevd files are never considered to be in the project scope.
            file_type = self.get_file_type(frame, abs_real_path_and_basename)
            if file_type == self.PYDEV_FILE:
                cache[cache_key] = False

            elif file_type == self.LIB_FILE and filename == '<string>':
                # This means it's a <string> which should be considered to be a library file and
                # shouldn't be considered as a part of the project.
                # (i.e.: lib files must be traced if they're put inside a project).
                cache[cache_key] = False

            else:
                cache[cache_key] = self._files_filtering.in_project_roots(filename)

            return cache[cache_key]

    def _clear_filters_caches(self):
        self._in_project_scope_cache.clear()
        self._exclude_by_filter_cache.clear()
        self._apply_filter_cache.clear()
        self._exclude_filters_enabled = self._files_filtering.use_exclude_filters()
        self._is_libraries_filter_enabled = self._files_filtering.use_libraries_filter()
        self.is_files_filter_enabled = self._exclude_filters_enabled or self._is_libraries_filter_enabled

    def clear_dont_trace_start_end_patterns_caches(self):
        # When start/end patterns are changed we must clear all caches which would be
        # affected by a change in get_file_type() and reset the tracing function
        # as places which were traced may no longer need to be traced and vice-versa.
        self.on_breakpoints_changed()
        _CACHE_FILE_TYPE.clear()
        self._clear_filters_caches()
        self._clear_skip_caches()

    def _exclude_by_filter(self, frame, filename):
        '''
        :param str filename:
            The filename to filter.

        :return: True if it should be excluded, False if it should be included and None
            if no rule matched the given file.
        '''
        cache_key = (filename, frame.f_code.co_name)
        try:
            return self._exclude_by_filter_cache[cache_key]
        except KeyError:
            cache = self._exclude_by_filter_cache

            # pydevd files are always filtered out
            if self.get_file_type(frame) == self.PYDEV_FILE:
                cache[cache_key] = True
            else:
                module_name = None
                if self._files_filtering.require_module:
                    module_name = frame.f_globals.get('__name__', '')
                cache[cache_key] = self._files_filtering.exclude_by_filter(filename, module_name)

            return cache[cache_key]

    def apply_files_filter(self, frame, filename, force_check_project_scope):
        '''
        Should only be called if `self.is_files_filter_enabled == True`.

        Note that it covers both the filter by specific paths includes/excludes as well
        as the check which filters out libraries if not in the project scope.

        :param force_check_project_scope:
            Check that the file is in the project scope even if the global setting
            is off.

        :return bool:
            True if it should be excluded when stepping and False if it should be
            included.
        '''
        cache_key = (frame.f_code.co_firstlineno, filename, force_check_project_scope, frame.f_code)
        try:
            return self._apply_filter_cache[cache_key]
        except KeyError:
            if self.plugin is not None and (self.has_plugin_line_breaks or self.has_plugin_exception_breaks):
                # If it's explicitly needed by some plugin, we can't skip it.
                if not self.plugin.can_skip(self, frame):
                    pydev_log.debug_once('File traced (included by plugins): %s', filename)
                    self._apply_filter_cache[cache_key] = False
                    return False

            if self._exclude_filters_enabled:
                exclude_by_filter = self._exclude_by_filter(frame, filename)
                if exclude_by_filter is not None:
                    if exclude_by_filter:
                        # ignore files matching stepping filters
                        pydev_log.debug_once('File not traced (excluded by filters): %s', filename)

                        self._apply_filter_cache[cache_key] = True
                        return True
                    else:
                        pydev_log.debug_once('File traced (explicitly included by filters): %s', filename)

                        self._apply_filter_cache[cache_key] = False
                        return False

            if (self._is_libraries_filter_enabled or force_check_project_scope) and not self.in_project_scope(frame):
                # ignore library files while stepping
                self._apply_filter_cache[cache_key] = True
                if force_check_project_scope:
                    pydev_log.debug_once('File not traced (not in project): %s', filename)
                else:
                    pydev_log.debug_once('File not traced (not in project - force_check_project_scope): %s', filename)

                return True

            if force_check_project_scope:
                pydev_log.debug_once('File traced: %s (force_check_project_scope)', filename)
            else:
                pydev_log.debug_once('File traced: %s', filename)
            self._apply_filter_cache[cache_key] = False
            return False

    def exclude_exception_by_filter(self, exception_breakpoint, trace, is_uncaught):
        if not exception_breakpoint.ignore_libraries and not self._exclude_filters_enabled:
            return False

        if trace is None:
            return True

        # We need to get the place where it was raised if it's an uncaught exception...
        if is_uncaught:
            while trace.tb_next is not None:
                trace = trace.tb_next

        ignore_libraries = exception_breakpoint.ignore_libraries
        exclude_filters_enabled = self._exclude_filters_enabled

        if (ignore_libraries and not self.in_project_scope(trace.tb_frame)) \
                or (exclude_filters_enabled and self._exclude_by_filter(trace.tb_frame, trace.tb_frame.f_code.co_filename)):
            return True

        return False

    def set_project_roots(self, project_roots):
        self._files_filtering.set_project_roots(project_roots)
        self._clear_skip_caches()
        self._clear_filters_caches()

    def set_exclude_filters(self, exclude_filters):
        self._files_filtering.set_exclude_filters(exclude_filters)
        self._clear_skip_caches()
        self._clear_filters_caches()

    def set_use_libraries_filter(self, use_libraries_filter):
        self._files_filtering.set_use_libraries_filter(use_libraries_filter)
        self._clear_skip_caches()
        self._clear_filters_caches()

    def get_use_libraries_filter(self):
        return self._files_filtering.use_libraries_filter()

    def get_require_module_for_filters(self):
        return self._files_filtering.require_module

    def has_threads_alive(self):
        for t in pydevd_utils.get_non_pydevd_threads():
            if isinstance(t, PyDBDaemonThread):
                pydev_log.error_once(
                    'Error in debugger: Found PyDBDaemonThread not marked with is_pydev_daemon_thread=True.\n')

            if is_thread_alive(t):
                if not t.isDaemon() or hasattr(t, "__pydevd_main_thread"):
                    return True

        return False

    def finish_debugging_session(self):
        self._finish_debugging_session = True

    def initialize_network(self, sock, terminate_on_socket_close=True):
        assert sock is not None
        try:
            sock.settimeout(None)  # infinite, no timeouts from now on - jython does not have it
        except:
            pass
        curr_reader = getattr(self, 'reader', None)
        curr_writer = getattr(self, 'writer', None)
        if curr_reader:
            curr_reader.do_kill_pydev_thread()
        if curr_writer:
            curr_writer.do_kill_pydev_thread()

        self.writer = WriterThread(sock, terminate_on_socket_close=terminate_on_socket_close)
        self.reader = ReaderThread(sock, terminate_on_socket_close=terminate_on_socket_close)
        self.writer.start()
        self.reader.start()

        time.sleep(0.1)  # give threads time to start

    def connect(self, host, port):
        if host:
            s = start_client(host, port)
        else:
            s = start_server(port)

        self.initialize_network(s)

    def create_wait_for_connection_thread(self):
        if self._waiting_for_connection_thread is not None:
            raise AssertionError('There is already another thread waiting for a connection.')

        self._waiting_for_connection_thread = self._WaitForConnectionThread(self)
        self._waiting_for_connection_thread.start()

    class _WaitForConnectionThread(PyDBDaemonThread):

        def __init__(self, py_db):
            PyDBDaemonThread.__init__(self)
            self.py_db = py_db
            self._server_socket = None

        def run(self):
            host = SetupHolder.setup['client']
            port = SetupHolder.setup['port']

            self._server_socket = create_server_socket(host=host, port=port)

            while not self.killReceived:
                try:
                    s = self._server_socket
                    if s is None:
                        return

                    s.listen(1)
                    new_socket, _addr = s.accept()
                    if self.killReceived:
                        pydev_log.info("Connection (from wait_for_attach) accepted but ignored as kill was already received.")
                        return

                    pydev_log.info("Connection (from wait_for_attach) accepted.")
                    reader = getattr(self.py_db, 'reader', None)
                    if reader is not None:
                        # This is needed if a new connection is done without the client properly
                        # sending a disconnect for the previous connection.
                        api = PyDevdAPI()
                        api.request_disconnect(self.py_db, resume_threads=False)

                    self.py_db.initialize_network(new_socket, terminate_on_socket_close=False)

                except:
                    if DebugInfoHolder.DEBUG_TRACE_LEVEL > 0:
                        pydev_log.exception()
                        pydev_log.debug("Exiting _WaitForConnectionThread: %s\n", port)

        def do_kill_pydev_thread(self):
            PyDBDaemonThread.do_kill_pydev_thread(self)
            s = self._server_socket
            try:
                s.shutdown(SHUT_RDWR)
            except:
                pass
            try:
                s.close()
            except:
                pass
            self._server_socket = None

    def get_internal_queue(self, thread_id):
        """ returns internal command queue for a given thread.
        if new queue is created, notify the RDB about it """
        if thread_id.startswith('__frame__'):
            thread_id = thread_id[thread_id.rfind('|') + 1:]
        return self._cmd_queue[thread_id]

    def post_method_as_internal_command(self, thread_id, method, *args, **kwargs):
        if thread_id == '*':
            internal_cmd = InternalThreadCommandForAnyThread(thread_id, method, *args, **kwargs)
        else:
            internal_cmd = InternalThreadCommand(thread_id, method, *args, **kwargs)
        self.post_internal_command(internal_cmd, thread_id)

    def post_internal_command(self, int_cmd, thread_id):
        """ if thread_id is *, post to the '*' queue"""
        queue = self.get_internal_queue(thread_id)
        queue.put(int_cmd)

    def enable_output_redirection(self, redirect_stdout, redirect_stderr):
        global bufferStdOutToServer
        global bufferStdErrToServer

        bufferStdOutToServer = redirect_stdout
        bufferStdErrToServer = redirect_stderr
        self.redirect_output = redirect_stdout or redirect_stderr
        if bufferStdOutToServer:
            init_stdout_redirect()
        if bufferStdErrToServer:
            init_stderr_redirect()

    def check_output_redirect(self):
        global bufferStdOutToServer
        global bufferStdErrToServer

        if bufferStdOutToServer:
            init_stdout_redirect()

        if bufferStdErrToServer:
            init_stderr_redirect()

    def init_matplotlib_in_debug_console(self):
        # import hook and patches for matplotlib support in debug console
        from _pydev_bundle.pydev_import_hook import import_hook_manager
        if is_current_thread_main_thread():
            for module in dict_keys(self.mpl_modules_for_patching):
                import_hook_manager.add_module_name(module, self.mpl_modules_for_patching.pop(module))

    def init_matplotlib_support(self):
        # prepare debugger for integration with matplotlib GUI event loop
        from pydev_ipython.matplotlibtools import activate_matplotlib, activate_pylab, activate_pyplot, do_enable_gui

        # enable_gui_function in activate_matplotlib should be called in main thread. Unlike integrated console,
        # in the debug console we have no interpreter instance with exec_queue, but we run this code in the main
        # thread and can call it directly.
        class _MatplotlibHelper:
            _return_control_osc = False

        def return_control():
            # Some of the input hooks (e.g. Qt4Agg) check return control without doing
            # a single operation, so we don't return True on every
            # call when the debug hook is in place to allow the GUI to run
            _MatplotlibHelper._return_control_osc = not _MatplotlibHelper._return_control_osc
            return _MatplotlibHelper._return_control_osc

        from pydev_ipython.inputhook import set_return_control_callback
        set_return_control_callback(return_control)

        self.mpl_modules_for_patching = {"matplotlib": lambda: activate_matplotlib(do_enable_gui),
                            "matplotlib.pyplot": activate_pyplot,
                            "pylab": activate_pylab }

    def _activate_mpl_if_needed(self):
        if len(self.mpl_modules_for_patching) > 0:
            if is_current_thread_main_thread():  # Note that we call only in the main thread.
                for module in dict_keys(self.mpl_modules_for_patching):
                    if module in sys.modules:
                        activate_function = self.mpl_modules_for_patching.pop(module, None)
                        if activate_function is not None:
                            activate_function()
                        self.mpl_in_use = True

    def _call_mpl_hook(self):
        try:
            from pydev_ipython.inputhook import get_inputhook
            inputhook = get_inputhook()
            if inputhook:
                inputhook()
        except:
            pass

    def notify_skipped_step_in_because_of_filters(self, frame):
        self.writer.add_command(self.cmd_factory.make_skipped_step_in_because_of_filters(self, frame))

    def notify_thread_created(self, thread_id, thread, use_lock=True):
        if self.writer is None:
            # Protect about threads being created before the communication structure is in place
            # (note that they will appear later on anyways as pydevd does reconcile live/dead threads
            # when processing internal commands, albeit it may take longer and in general this should
            # not be usual as it's expected that the debugger is live before other threads are created).
            return

        with self._lock_running_thread_ids if use_lock else NULL:
            if not self._enable_thread_notifications:
                return

            if thread_id in self._running_thread_ids:
                return

            additional_info = set_additional_thread_info(thread)
            if additional_info.pydev_notify_kill:
                # After we notify it should be killed, make sure we don't notify it's alive (on a racing condition
                # this could happen as we may notify before the thread is stopped internally).
                return

            self._running_thread_ids[thread_id] = thread

        self.writer.add_command(self.cmd_factory.make_thread_created_message(thread))

    def notify_thread_not_alive(self, thread_id, use_lock=True):
        """ if thread is not alive, cancel trace_dispatch processing """
        if self.writer is None:
            return

        with self._lock_running_thread_ids if use_lock else NULL:
            if not self._enable_thread_notifications:
                return

            thread = self._running_thread_ids.pop(thread_id, None)
            if thread is None:
                return

            additional_info = set_additional_thread_info(thread)
            was_notified = additional_info.pydev_notify_kill
            if not was_notified:
                additional_info.pydev_notify_kill = True

        self.writer.add_command(self.cmd_factory.make_thread_killed_message(thread_id))

    def set_enable_thread_notifications(self, enable):
        with self._lock_running_thread_ids:
            if self._enable_thread_notifications != enable:
                self._enable_thread_notifications = enable

                if enable:
                    # As it was previously disabled, we have to notify about existing threads again
                    # (so, clear the cache related to that).
                    self._running_thread_ids = {}

    def process_internal_commands(self):
        '''This function processes internal commands
        '''
        with self._main_lock:
            self.check_output_redirect()

            program_threads_alive = {}
            all_threads = threadingEnumerate()
            program_threads_dead = []
            with self._lock_running_thread_ids:
                reset_cache = not self._running_thread_ids

                for t in all_threads:
                    if getattr(t, 'is_pydev_daemon_thread', False):
                        pass  # I.e.: skip the DummyThreads created from pydev daemon threads
                    elif isinstance(t, PyDBDaemonThread):
                        pydev_log.error_once('Error in debugger: Found PyDBDaemonThread not marked with is_pydev_daemon_thread=True.')

                    elif is_thread_alive(t):
                        if reset_cache:
                            # Fix multiprocessing debug with breakpoints in both main and child processes
                            # (https://youtrack.jetbrains.com/issue/PY-17092) When the new process is created, the main
                            # thread in the new process already has the attribute 'pydevd_id', so the new thread doesn't
                            # get new id with its process number and the debugger loses access to both threads.
                            # Therefore we should update thread_id for every main thread in the new process.
                            clear_cached_thread_id(t)

                        thread_id = get_thread_id(t)
                        program_threads_alive[thread_id] = t

                        self.notify_thread_created(thread_id, t, use_lock=False)

                # Compute and notify about threads which are no longer alive.
                thread_ids = list(self._running_thread_ids.keys())
                for thread_id in thread_ids:
                    if thread_id not in program_threads_alive:
                        program_threads_dead.append(thread_id)

                for thread_id in program_threads_dead:
                    self.notify_thread_not_alive(thread_id, use_lock=False)

            # Without self._lock_running_thread_ids
            if len(program_threads_alive) == 0:
                self.finish_debugging_session()
                for t in all_threads:
                    if hasattr(t, 'do_kill_pydev_thread'):
                        t.do_kill_pydev_thread()
            else:
                # Actually process the commands now (make sure we don't have a lock for _lock_running_thread_ids
                # acquired at this point as it could lead to a deadlock if some command evaluated tried to
                # create a thread and wait for it -- which would try to notify about it getting that lock).
                curr_thread_id = get_current_thread_id(threadingCurrentThread())

                for thread_id in (curr_thread_id, '*'):
                    queue = self.get_internal_queue(thread_id)

                    # some commands must be processed by the thread itself... if that's the case,
                    # we will re-add the commands to the queue after executing.
                    cmds_to_add_back = []

                    try:
                        while True:
                            int_cmd = queue.get(False)

                            if not self.mpl_hooks_in_debug_console and isinstance(int_cmd, InternalConsoleExec):
                                # add import hooks for matplotlib patches if only debug console was started
                                try:
                                    self.init_matplotlib_in_debug_console()
                                    self.mpl_in_use = True
                                except:
                                    pydev_log.debug("Matplotlib support in debug console failed", traceback.format_exc())
                                self.mpl_hooks_in_debug_console = True

                            if int_cmd.can_be_executed_by(curr_thread_id):
                                pydev_log.verbose("processing internal command ", int_cmd)
                                int_cmd.do_it(self)
                            else:
                                pydev_log.verbose("NOT processing internal command ", int_cmd)
                                cmds_to_add_back.append(int_cmd)

                    except _queue.Empty:  # @UndefinedVariable
                        # this is how we exit
                        for int_cmd in cmds_to_add_back:
                            queue.put(int_cmd)

    def consolidate_breakpoints(self, file, id_to_breakpoint, breakpoints):
        break_dict = {}
        for _breakpoint_id, pybreakpoint in dict_iter_items(id_to_breakpoint):
            break_dict[pybreakpoint.line] = pybreakpoint

        breakpoints[file] = break_dict
        self._clear_skip_caches()

    def _clear_skip_caches(self):
        global_cache_skips.clear()
        global_cache_frame_skips.clear()

    def add_break_on_exception(
        self,
        exception,
        condition,
        expression,
        notify_on_handled_exceptions,
        notify_on_unhandled_exceptions,
        notify_on_first_raise_only,
        ignore_libraries=False
        ):
        try:
            eb = ExceptionBreakpoint(
                exception,
                condition,
                expression,
                notify_on_handled_exceptions,
                notify_on_unhandled_exceptions,
                notify_on_first_raise_only,
                ignore_libraries
            )
        except ImportError:
            pydev_log.critical("Error unable to add break on exception for: %s (exception could not be imported).", exception)
            return None

        if eb.notify_on_unhandled_exceptions:
            cp = self.break_on_uncaught_exceptions.copy()
            cp[exception] = eb
            if DebugInfoHolder.DEBUG_TRACE_BREAKPOINTS > 0:
                pydev_log.critical("Exceptions to hook on terminate: %s.", cp)
            self.break_on_uncaught_exceptions = cp

        if eb.notify_on_handled_exceptions:
            cp = self.break_on_caught_exceptions.copy()
            cp[exception] = eb
            if DebugInfoHolder.DEBUG_TRACE_BREAKPOINTS > 0:
                pydev_log.critical("Exceptions to hook always: %s.", cp)
            self.break_on_caught_exceptions = cp

        return eb

    def _mark_suspend(self, thread, stop_reason):
        info = set_additional_thread_info(thread)
        info.suspend_type = PYTHON_SUSPEND
        thread.stop_reason = stop_reason

        # Note: don't set the 'pydev_original_step_cmd' here if unset.

        if info.pydev_step_cmd == -1:
            # If the step command is not specified, set it to step into
            # to make sure it'll break as soon as possible.
            info.pydev_step_cmd = CMD_STEP_INTO

        # Mark as suspend as the last thing.
        info.pydev_state = STATE_SUSPEND

        return info

    def set_suspend(self, thread, stop_reason, suspend_other_threads=False, is_pause=False):
        '''
        :param thread:
            The thread which should be suspended.

        :param stop_reason:
            Reason why the thread was suspended.

        :param suspend_other_threads:
            Whether to force other threads to be suspended (i.e.: when hitting a breakpoint
            with a suspend all threads policy).

        :param is_pause:
            If this is a pause to suspend all threads, any thread can be considered as the 'main'
            thread paused.
        '''
        self._threads_suspended_single_notification.increment_suspend_time()
        if is_pause:
            self._threads_suspended_single_notification.on_pause()

        info = self._mark_suspend(thread, stop_reason)

        if is_pause:
            # Must set tracing after setting the state to suspend.
            frame = info.get_topmost_frame(thread)
            if frame is not None:
                try:
                    self.set_trace_for_frame_and_parents(frame)
                finally:
                    frame = None

        # If conditional breakpoint raises any exception during evaluation send the details to the client.
        if stop_reason == CMD_SET_BREAK and info.conditional_breakpoint_exception is not None:
            conditional_breakpoint_exception_tuple = info.conditional_breakpoint_exception
            info.conditional_breakpoint_exception = None
            self._send_breakpoint_condition_exception(thread, conditional_breakpoint_exception_tuple)

        if not suspend_other_threads and self.multi_threads_single_notification:
            # In the mode which gives a single notification when all threads are
            # stopped, stop all threads whenever a set_suspend is issued.
            suspend_other_threads = True

        if suspend_other_threads:
            # Suspend all other threads.
            all_threads = pydevd_utils.get_non_pydevd_threads()
            for t in all_threads:
                if getattr(t, 'pydev_do_not_trace', None):
                    pass  # skip some other threads, i.e. ipython history saving thread from debug console
                else:
                    if t is thread:
                        continue
                    info = self._mark_suspend(t, CMD_THREAD_SUSPEND)
                    frame = info.get_topmost_frame(t)

                    # Reset the time as in this case this was not the main thread suspended.
                    if frame is not None:
                        try:
                            self.set_trace_for_frame_and_parents(frame)
                        finally:
                            frame = None

    def _send_breakpoint_condition_exception(self, thread, conditional_breakpoint_exception_tuple):
        """If conditional breakpoint raises an exception during evaluation
        send exception details to java
        """
        thread_id = get_thread_id(thread)
        # conditional_breakpoint_exception_tuple - should contain 2 values (exception_type, stacktrace)
        if conditional_breakpoint_exception_tuple and len(conditional_breakpoint_exception_tuple) == 2:
            exc_type, stacktrace = conditional_breakpoint_exception_tuple
            int_cmd = InternalGetBreakpointException(thread_id, exc_type, stacktrace)
            self.post_internal_command(int_cmd, thread_id)

    def send_caught_exception_stack(self, thread, arg, curr_frame_id):
        """Sends details on the exception which was caught (and where we stopped) to the java side.

        arg is: exception type, description, traceback object
        """
        thread_id = get_thread_id(thread)
        int_cmd = InternalSendCurrExceptionTrace(thread_id, arg, curr_frame_id)
        self.post_internal_command(int_cmd, thread_id)

    def send_caught_exception_stack_proceeded(self, thread):
        """Sends that some thread was resumed and is no longer showing an exception trace.
        """
        thread_id = get_thread_id(thread)
        int_cmd = InternalSendCurrExceptionTraceProceeded(thread_id)
        self.post_internal_command(int_cmd, thread_id)
        self.process_internal_commands()

    def send_process_created_message(self):
        """Sends a message that a new process has been created.
        """
        if self.writer is None or self.cmd_factory is None:
            return
        cmd = self.cmd_factory.make_process_created_message()
        self.writer.add_command(cmd)

    def set_next_statement(self, frame, event, func_name, next_line):
        stop = False
        response_msg = ""
        old_line = frame.f_lineno
        if event == 'line' or event == 'exception':
            # If we're already in the correct context, we have to stop it now, because we can act only on
            # line events -- if a return was the next statement it wouldn't work (so, we have this code
            # repeated at pydevd_frame).

            curr_func_name = frame.f_code.co_name

            # global context is set with an empty name
            if curr_func_name in ('?', '<module>'):
                curr_func_name = ''

            if func_name == '*' or curr_func_name == func_name:
                line = next_line
                frame.f_trace = self.trace_dispatch
                frame.f_lineno = line
                stop = True
            else:
                response_msg = "jump is available only within the bottom frame"
        return stop, old_line, response_msg

    def cancel_async_evaluation(self, thread_id, frame_id):
        self._main_lock.acquire()
        try:
            all_threads = threadingEnumerate()
            for t in all_threads:
                if getattr(t, 'is_pydev_daemon_thread', False) and hasattr(t, 'cancel_event') and t.thread_id == thread_id and \
                        t.frame_id == frame_id:
                    t.cancel_event.set()
        except:
            pydev_log.exception()
        finally:
            self._main_lock.release()

    def find_frame(self, thread_id, frame_id):
        """ returns a frame on the thread that has a given frame_id """
        return self.suspended_frames_manager.find_frame(thread_id, frame_id)

    def do_wait_suspend(self, thread, frame, event, arg, is_unhandled_exception=False):  # @UnusedVariable
        """ busy waits until the thread state changes to RUN
        it expects thread's state as attributes of the thread.
        Upon running, processes any outstanding Stepping commands.

        :param is_unhandled_exception:
            If True we should use the line of the exception instead of the current line in the frame
            as the paused location on the top-level frame (exception info must be passed on 'arg').
        """
        # print('do_wait_suspend %s %s %s %s' % (frame.f_lineno, frame.f_code.co_name, frame.f_code.co_filename, event))
        self.process_internal_commands()

        thread_id = get_current_thread_id(thread)

        # Send the suspend message
        message = thread.additional_info.pydev_message
        suspend_type = thread.additional_info.trace_suspend_type
        thread.additional_info.trace_suspend_type = 'trace'  # Reset to trace mode for next call.
        frame_id_to_lineno = {}
        stop_reason = thread.stop_reason
        if is_unhandled_exception:
            # arg must be the exception info (tuple(exc_type, exc, traceback))
            tb = arg[2]
            while tb is not None:
                frame_id_to_lineno[id(tb.tb_frame)] = tb.tb_lineno
                tb = tb.tb_next

        with self.suspended_frames_manager.track_frames(self) as frames_tracker:
            frames_tracker.track(thread_id, frame, frame_id_to_lineno)
            cmd = frames_tracker.create_thread_suspend_command(thread_id, stop_reason, message, suspend_type)
            self.writer.add_command(cmd)

            with CustomFramesContainer.custom_frames_lock:  # @UndefinedVariable
                from_this_thread = []

                for frame_custom_thread_id, custom_frame in dict_iter_items(CustomFramesContainer.custom_frames):
                    if custom_frame.thread_id == thread.ident:
                        frames_tracker.track(thread_id, custom_frame.frame, frame_id_to_lineno, frame_custom_thread_id=frame_custom_thread_id)
                        # print('Frame created as thread: %s' % (frame_custom_thread_id,))

                        self.writer.add_command(self.cmd_factory.make_custom_frame_created_message(
                            frame_custom_thread_id, custom_frame.name))

                        self.writer.add_command(
                            frames_tracker.create_thread_suspend_command(frame_custom_thread_id, CMD_THREAD_SUSPEND, "", suspend_type))

                    from_this_thread.append(frame_custom_thread_id)

            with self._threads_suspended_single_notification.notify_thread_suspended(thread_id, stop_reason):
                keep_suspended = self._do_wait_suspend(thread, frame, event, arg, suspend_type, from_this_thread, frames_tracker)

        if keep_suspended:
            # This means that we should pause again after a set next statement.
            self._threads_suspended_single_notification.increment_suspend_time()
            self.do_wait_suspend(thread, frame, event, arg, is_unhandled_exception)

    def _do_wait_suspend(self, thread, frame, event, arg, suspend_type, from_this_thread, frames_tracker):
        info = thread.additional_info
        keep_suspended = False

        with self._main_lock:  # Use lock to check if suspended state changed
            activate_matplotlib = info.pydev_state == STATE_SUSPEND and not self._finish_debugging_session

        in_main_thread = is_current_thread_main_thread()
        if activate_matplotlib and in_main_thread:
            # before every stop check if matplotlib modules were imported inside script code
            self._activate_mpl_if_needed()

        while True:
            with self._main_lock:  # Use lock to check if suspended state changed
                if info.pydev_state != STATE_SUSPEND or self._finish_debugging_session:
                    break

            if in_main_thread and self.mpl_in_use:
                # call input hooks if only matplotlib is in use
                self._call_mpl_hook()

            self.process_internal_commands()
            time.sleep(0.01)

        self.cancel_async_evaluation(get_current_thread_id(thread), str(id(frame)))

        # process any stepping instructions
        if info.pydev_step_cmd in (CMD_STEP_INTO, CMD_STEP_INTO_MY_CODE):
            info.pydev_step_stop = None
            info.pydev_smart_step_stop = None
            self.set_trace_for_frame_and_parents(frame)

        elif info.pydev_step_cmd in (CMD_STEP_OVER, CMD_STEP_OVER_MY_CODE):
            info.pydev_step_stop = frame
            info.pydev_smart_step_stop = None
            self.set_trace_for_frame_and_parents(frame)

        elif info.pydev_step_cmd == CMD_SMART_STEP_INTO:
            info.pydev_step_stop = None
            info.pydev_smart_step_stop = frame
            self.set_trace_for_frame_and_parents(frame)

        elif info.pydev_step_cmd == CMD_RUN_TO_LINE or info.pydev_step_cmd == CMD_SET_NEXT_STATEMENT:
            self.set_trace_for_frame_and_parents(frame)
            stop = False
            response_msg = ""
            try:
                stop, _old_line, response_msg = self.set_next_statement(frame, event, info.pydev_func_name, info.pydev_next_line)
            except ValueError as e:
                response_msg = "%s" % e
            finally:
                seq = info.pydev_message
                cmd = self.cmd_factory.make_set_next_stmnt_status_message(seq, stop, response_msg)
                self.writer.add_command(cmd)
                info.pydev_message = ''

            if stop:
                # Uninstall the current frames tracker before running it.
                frames_tracker.untrack_all()
                cmd = self.cmd_factory.make_thread_run_message(get_current_thread_id(thread), info.pydev_step_cmd)
                self.writer.add_command(cmd)
                info.pydev_state = STATE_SUSPEND
                thread.stop_reason = CMD_SET_NEXT_STATEMENT
                keep_suspended = True

            else:
                # Set next did not work...
                info.pydev_original_step_cmd = -1
                info.pydev_step_cmd = -1
                info.pydev_state = STATE_SUSPEND
                thread.stop_reason = CMD_THREAD_SUSPEND
                # return to the suspend state and wait for other command (without sending any
                # additional notification to the client).
                return self._do_wait_suspend(thread, frame, event, arg, suspend_type, from_this_thread, frames_tracker)

        elif info.pydev_step_cmd in (CMD_STEP_RETURN, CMD_STEP_RETURN_MY_CODE):
            back_frame = frame.f_back
            force_check_project_scope = info.pydev_step_cmd == CMD_STEP_RETURN_MY_CODE

            if force_check_project_scope or self.is_files_filter_enabled:
                while back_frame is not None:
                    if self.apply_files_filter(back_frame, back_frame.f_code.co_filename, force_check_project_scope):
                        frame = back_frame
                        back_frame = back_frame.f_back
                    else:
                        break

            if back_frame is not None:
                # steps back to the same frame (in a return call it will stop in the 'back frame' for the user)
                info.pydev_step_stop = frame
                self.set_trace_for_frame_and_parents(frame)
            else:
                # No back frame?!? -- this happens in jython when we have some frame created from an awt event
                # (the previous frame would be the awt event, but this doesn't make part of 'jython', only 'java')
                # so, if we're doing a step return in this situation, it's the same as just making it run
                info.pydev_step_stop = None
                info.pydev_original_step_cmd = -1
                info.pydev_step_cmd = -1
                info.pydev_state = STATE_RUN

        del frame
        cmd = self.cmd_factory.make_thread_run_message(get_current_thread_id(thread), info.pydev_step_cmd)
        self.writer.add_command(cmd)

        with CustomFramesContainer.custom_frames_lock:
            # The ones that remained on last_running must now be removed.
            for frame_id in from_this_thread:
                # print('Removing created frame: %s' % (frame_id,))
                self.writer.add_command(self.cmd_factory.make_thread_killed_message(frame_id))

        return keep_suspended

    def do_stop_on_unhandled_exception(self, thread, frame, frames_byid, arg):
        pydev_log.debug("We are stopping in unhandled exception.")
        try:
            add_exception_to_frame(frame, arg)
            self.set_suspend(thread, CMD_ADD_EXCEPTION_BREAK)
            self.do_wait_suspend(thread, frame, 'exception', arg, is_unhandled_exception=True)
        except:
            pydev_log.exception("We've got an error while stopping in unhandled exception: %s.", arg[0])
        finally:
            remove_exception_from_frame(frame)
            frame = None

    def set_trace_for_frame_and_parents(self, frame, **kwargs):
        disable = kwargs.pop('disable', False)
        assert not kwargs

        while frame is not None:
            # Don't change the tracing on debugger-related files
            file_type = self.get_file_type(frame)

            if file_type is None:
                if disable:
                    pydev_log.debug('Disable tracing of frame: %s - %s', frame.f_code.co_filename, frame.f_code.co_name)
                    if frame.f_trace is not None and frame.f_trace is not NO_FTRACE:
                        frame.f_trace = NO_FTRACE

                elif frame.f_trace is not self.trace_dispatch:
                    pydev_log.debug('Set tracing of frame: %s - %s', frame.f_code.co_filename, frame.f_code.co_name)
                    frame.f_trace = self.trace_dispatch
            else:
                pydev_log.debug('SKIP set tracing of frame: %s - %s', frame.f_code.co_filename, frame.f_code.co_name)

            frame = frame.f_back

        del frame

    def _create_pydb_command_thread(self):
        curr_pydb_command_thread = self.py_db_command_thread
        if curr_pydb_command_thread is not None:
            curr_pydb_command_thread.do_kill_pydev_thread()

        new_pydb_command_thread = self.py_db_command_thread = PyDBCommandThread(self)
        new_pydb_command_thread.start()

    def _create_check_output_thread(self):
        curr_output_checker_thread = self.output_checker_thread
        if curr_output_checker_thread is not None:
            curr_output_checker_thread.do_kill_pydev_thread()

        output_checker_thread = self.output_checker_thread = CheckOutputThread(self)
        output_checker_thread.start()

    def start_auxiliary_daemon_threads(self):
        self._create_pydb_command_thread()
        self._create_check_output_thread()

    def prepare_to_run(self):
        ''' Shared code to prepare debugging by installing traces and registering threads '''
        self.patch_threads()
        self.start_auxiliary_daemon_threads()

    def patch_threads(self):
        try:
            # not available in jython!
            threading.settrace(self.trace_dispatch)  # for all future threads
        except:
            pass

        from _pydev_bundle.pydev_monkey import patch_thread_modules
        patch_thread_modules()

    def run(self, file, globals=None, locals=None, is_module=False, set_trace=True):
        module_name = None
        entry_point_fn = ''
        if is_module:
            # When launching with `python -m <module>`, python automatically adds
            # an empty path to the PYTHONPATH which resolves files in the current
            # directory, so, depending how pydevd itself is launched, we may need
            # to manually add such an entry to properly resolve modules in the
            # current directory (see: https://github.com/Microsoft/ptvsd/issues/1010).
            if '' not in sys.path:
                sys.path.insert(0, '')
            file, _, entry_point_fn = file.partition(':')
            module_name = file
            filename = get_fullname(file)
            if filename is None:
                mod_dir = get_package_dir(module_name)
                if mod_dir is None:
                    sys.stderr.write("No module named %s\n" % file)
                    return
                else:
                    filename = get_fullname("%s.__main__" % module_name)
                    if filename is None:
                        sys.stderr.write("No module named %s\n" % file)
                        return
                    else:
                        file = filename
            else:
                file = filename
                mod_dir = os.path.dirname(filename)
                main_py = os.path.join(mod_dir, '__main__.py')
                main_pyc = os.path.join(mod_dir, '__main__.pyc')
                if filename.endswith('__init__.pyc'):
                    if os.path.exists(main_pyc):
                        filename = main_pyc
                    elif os.path.exists(main_py):
                        filename = main_py
                elif filename.endswith('__init__.py'):
                    if os.path.exists(main_pyc) and not os.path.exists(main_py):
                        filename = main_pyc
                    elif os.path.exists(main_py):
                        filename = main_py

            sys.argv[0] = filename

        if os.path.isdir(file):
            new_target = os.path.join(file, '__main__.py')
            if os.path.isfile(new_target):
                file = new_target

        m = None
        if globals is None:
            m = save_main_module(file, 'pydevd')
            globals = m.__dict__
            try:
                globals['__builtins__'] = __builtins__
            except NameError:
                pass  # Not there on Jython...

        if locals is None:
            locals = globals

        # Predefined (writable) attributes: __name__ is the module's name;
        # __doc__ is the module's documentation string, or None if unavailable;
        # __file__ is the pathname of the file from which the module was loaded,
        # if it was loaded from a file. The __file__ attribute is not present for
        # C modules that are statically linked into the interpreter; for extension modules
        # loaded dynamically from a shared library, it is the pathname of the shared library file.

        # I think this is an ugly hack, bug it works (seems to) for the bug that says that sys.path should be the same in
        # debug and run.
        if sys.path[0] != '' and m is not None and m.__file__.startswith(sys.path[0]):
            # print >> sys.stderr, 'Deleting: ', sys.path[0]
            del sys.path[0]

        if not is_module:
            # now, the local directory has to be added to the pythonpath
            # sys.path.insert(0, os.getcwd())
            # Changed: it's not the local directory, but the directory of the file launched
            # The file being run must be in the pythonpath (even if it was not before)
            sys.path.insert(0, os.path.split(rPath(file))[0])

        if set_trace:

            while not self.ready_to_run:
                time.sleep(0.1)  # busy wait until we receive run command

            # call prepare_to_run when we already have all information about breakpoints
            self.prepare_to_run()

        t = threadingCurrentThread()
        thread_id = get_current_thread_id(t)

        if self.thread_analyser is not None:
            wrap_threads()
            self.thread_analyser.set_start_time(cur_time())
            send_message("threading_event", 0, t.getName(), thread_id, "thread", "start", file, 1, None, parent=thread_id)

        if self.asyncio_analyser is not None:
            # we don't have main thread in asyncio graph, so we should add a fake event
            send_message("asyncio_event", 0, "Task", "Task", "thread", "stop", file, 1, frame=None, parent=None)

        try:
            if INTERACTIVE_MODE_AVAILABLE:
                self.init_matplotlib_support()
        except:
            sys.stderr.write("Matplotlib support in debugger failed\n")
            pydev_log.exception()

        if hasattr(sys, 'exc_clear'):
            # we should clean exception information in Python 2, before user's code execution
            sys.exc_clear()

        # Notify that the main thread is created.
        self.notify_thread_created(thread_id, t)

        # Note: important: set the tracing right before calling _exec.
        if set_trace:
            self.enable_tracing()

        return self._exec(is_module, entry_point_fn, module_name, file, globals, locals)

    def _exec(self, is_module, entry_point_fn, module_name, file, globals, locals):
        '''
        This function should have frames tracked by unhandled exceptions (the `_exec` name is important).
        '''
        if not is_module:
            pydev_imports.execfile(file, globals, locals)  # execute the script
        else:
            # treat ':' as a separator between module and entry point function
            # if there is no entry point we run we same as with -m switch. Otherwise we perform
            # an import and execute the entry point
            if entry_point_fn:
                mod = __import__(module_name, level=0, fromlist=[entry_point_fn], globals=globals, locals=locals)
                func = getattr(mod, entry_point_fn)
                func()
            else:
                # Run with the -m switch
                import runpy
                if hasattr(runpy, '_run_module_as_main'):
                    # Newer versions of Python actually use this when the -m switch is used.
                    if sys.version_info[:2] <= (2, 6):
                        runpy._run_module_as_main(module_name, set_argv0=False)
                    else:
                        runpy._run_module_as_main(module_name, alter_argv=False)
                else:
                    runpy.run_module(module_name)
        return globals

    def exiting(self):
        # Either or both standard streams can be closed at this point,
        # in which case flush() will fail.
        try:
            sys.stdout.flush()
        except:
            pass
        try:
            sys.stderr.flush()
        except:
            pass

        self.check_output_redirect()
        cmd = self.cmd_factory.make_exit_message()
        self.writer.add_command(cmd)

    def wait_for_commands(self, globals):
        self._activate_mpl_if_needed()

        thread = threading.currentThread()
        from _pydevd_bundle import pydevd_frame_utils
        frame = pydevd_frame_utils.Frame(None, -1, pydevd_frame_utils.FCode("Console",
                                                                            os.path.abspath(os.path.dirname(__file__))), globals, globals)
        thread_id = get_current_thread_id(thread)
        self.add_fake_frame(thread_id, id(frame), frame)

        cmd = self.cmd_factory.make_show_console_message(self, thread_id, frame)
        self.writer.add_command(cmd)

        while True:
            if self.mpl_in_use:
                # call input hooks if only matplotlib is in use
                self._call_mpl_hook()
            self.process_internal_commands()
            time.sleep(0.01)


def set_debug(setup):
    setup['DEBUG_RECORD_SOCKET_READS'] = True
    setup['DEBUG_TRACE_BREAKPOINTS'] = 1
    setup['DEBUG_TRACE_LEVEL'] = 3


def enable_qt_support(qt_support_mode):
    from _pydev_bundle import pydev_monkey_qt
    pydev_monkey_qt.patch_qt(qt_support_mode)


def dump_threads(stream=None):
    '''
    Helper to dump thread info (default is printing to stderr).
    '''
    pydevd_utils.dump_threads(stream)


def usage(doExit=0):
    sys.stdout.write('Usage:\n')
    sys.stdout.write('pydevd.py --port N [(--client hostname) | --server] --file executable [file_options]\n')
    if doExit:
        sys.exit(0)


class _CustomWriter(object):

    def __init__(self, out_ctx, wrap_stream, wrap_buffer, on_write=None):
        '''
        :param out_ctx:
            1=stdout and 2=stderr

        :param wrap_stream:
            Either sys.stdout or sys.stderr.

        :param bool wrap_buffer:
            If True the buffer attribute (which wraps writing bytes) should be
            wrapped.

        :param callable(str) on_write:
            May be a custom callable to be called when to write something.
            If not passed the default implementation will create an io message
            and send it through the debugger.
        '''
        self.encoding = getattr(wrap_stream, 'encoding', os.environ.get('PYTHONIOENCODING', 'utf-8'))
        self._out_ctx = out_ctx
        if wrap_buffer:
            self.buffer = _CustomWriter(out_ctx, wrap_stream, wrap_buffer=False, on_write=on_write)
        self._on_write = on_write

    def flush(self):
        pass  # no-op here

    def write(self, s):
        if self._on_write is not None:
            self._on_write(s)
            return

        if s:
            if IS_PY2:
                # Need s in bytes
                if isinstance(s, unicode):  # noqa
                    # Note: python 2.6 does not accept the "errors" keyword.
                    s = s.encode('utf-8', 'replace')
            else:
                # Need s in str
                if isinstance(s, bytes):
                    s = s.decode(self.encoding, errors='replace')

            py_db = get_global_debugger()
            if py_db is not None:
                # Note that the actual message contents will be a xml with utf-8, although
                # the entry is str on py3 and bytes on py2.
                cmd = py_db.cmd_factory.make_io_message(s, self._out_ctx)
                py_db.writer.add_command(cmd)


def init_stdout_redirect(on_write=None):
    if not hasattr(sys, '_pydevd_out_buffer_'):
        wrap_buffer = True if not IS_PY2 else False
        original = sys.stdout
        sys._pydevd_out_buffer_ = _CustomWriter(1, original, wrap_buffer, on_write)
        sys.stdout_original = original
        sys.stdout = pydevd_io.IORedirector(original, sys._pydevd_out_buffer_, wrap_buffer)  # @UndefinedVariable


def init_stderr_redirect(on_write=None):
    if not hasattr(sys, '_pydevd_err_buffer_'):
        wrap_buffer = True if not IS_PY2 else False
        original = sys.stderr
        sys._pydevd_err_buffer_ = _CustomWriter(2, original, wrap_buffer, on_write)
        sys.stderr_original = original
        sys.stderr = pydevd_io.IORedirector(original, sys._pydevd_err_buffer_, wrap_buffer)  # @UndefinedVariable


def _enable_attach(address):
    '''
    Starts accepting connections at the given host/port. The debugger will not be initialized nor
    configured, it'll only start accepting connections (and will have the tracing setup in this
    thread).

    Meant to be used with the DAP (Debug Adapter Protocol) with _wait_for_attach().

    :param address: (host, port)
    :type address: tuple(str, int)
    '''
    host = address[0]
    port = int(address[1])

    if _debugger_setup:
        if port != SetupHolder.setup['port']:
            raise AssertionError('Unable to listen in port: %s (already listening in port: %s)' % (port, SetupHolder.setup['port']))
    settrace(host=host, port=port, suspend=False, wait_for_ready_to_run=False, block_until_connected=False)


def _wait_for_attach():
    '''
    Meant to be called after _enable_attach() -- the current thread will only unblock after a
    connection is in place and the the DAP (Debug Adapter Protocol) sends the ConfigurationDone
    request.
    '''
    py_db = get_global_debugger()
    if py_db is None:
        raise AssertionError('Debugger still not created. Please use _enable_attach() before using _wait_for_attach().')

    py_db.block_until_configuration_done()


#=======================================================================================================================
# settrace
#=======================================================================================================================
def settrace(
    host=None,
    stdoutToServer=False,
    stderrToServer=False,
    port=5678,
    suspend=True,
    trace_only_current_thread=False,
    overwrite_prev_trace=False,
    patch_multiprocessing=False,
    stop_at_frame=None,
    block_until_connected=True,
    wait_for_ready_to_run=True,
    ):
    '''Sets the tracing function with the pydev debug function and initializes needed facilities.

    @param host: the user may specify another host, if the debug server is not in the same machine (default is the local
        host)

    @param stdoutToServer: when this is true, the stdout is passed to the debug server

    @param stderrToServer: when this is true, the stderr is passed to the debug server
        so that they are printed in its console and not in this process console.

    @param port: specifies which port to use for communicating with the server (note that the server must be started
        in the same port). @note: currently it's hard-coded at 5678 in the client

    @param suspend: whether a breakpoint should be emulated as soon as this function is called.

    @param trace_only_current_thread: determines if only the current thread will be traced or all current and future
        threads will also have the tracing enabled.

    @param overwrite_prev_trace: deprecated

    @param patch_multiprocessing: if True we'll patch the functions which create new processes so that launched
        processes are debugged.

    @param stop_at_frame: if passed it'll stop at the given frame, otherwise it'll stop in the function which
        called this method.

    @param wait_for_ready_to_run: if True settrace will block until the ready_to_run flag is set to True,
        otherwise, it'll set ready_to_run to True and this function won't block.

        Note that if wait_for_ready_to_run == False, there are no guarantees that the debugger is synchronized
        with what's configured in the client (IDE), the only guarantee is that when leaving this function
        the debugger will be already connected.
    '''
    with _set_trace_lock:
        _locked_settrace(
            host,
            stdoutToServer,
            stderrToServer,
            port,
            suspend,
            trace_only_current_thread,
            patch_multiprocessing,
            stop_at_frame,
            block_until_connected,
            wait_for_ready_to_run,
        )


_set_trace_lock = thread.allocate_lock()


def _locked_settrace(
    host,
    stdoutToServer,
    stderrToServer,
    port,
    suspend,
    trace_only_current_thread,
    patch_multiprocessing,
    stop_at_frame,
    block_until_connected,
    wait_for_ready_to_run,
    ):
    if patch_multiprocessing:
        try:
            from _pydev_bundle import pydev_monkey
        except:
            pass
        else:
            pydev_monkey.patch_new_process_functions()

    if host is None:
        from _pydev_bundle import pydev_localhost
        host = pydev_localhost.get_localhost()

    global _debugger_setup
    global bufferStdOutToServer
    global bufferStdErrToServer

    if not _debugger_setup:
        pydevd_vm_type.setup_type()

        if SetupHolder.setup is None:
            setup = {
                'client': host,  # dispatch expects client to be set to the host address when server is False
                'server': False,
                'port': int(port),
                'multiprocess': patch_multiprocessing,
            }
            SetupHolder.setup = setup

        debugger = get_global_debugger()
        if debugger is None:
            debugger = PyDB()
        if block_until_connected:
            debugger.connect(host, port)  # Note: connect can raise error.
        else:
            # Create a dummy writer and wait for the real connection.
            debugger.writer = WriterThread(NULL, terminate_on_socket_close=False)
            debugger.create_wait_for_connection_thread()

        # Mark connected only if it actually succeeded.
        _debugger_setup = True
        bufferStdOutToServer = stdoutToServer
        bufferStdErrToServer = stderrToServer

        if bufferStdOutToServer:
            init_stdout_redirect()

        if bufferStdErrToServer:
            init_stderr_redirect()

        patch_stdin(debugger)

        t = threadingCurrentThread()
        additional_info = set_additional_thread_info(t)

        if not wait_for_ready_to_run:
            debugger.ready_to_run = True

        while not debugger.ready_to_run:
            time.sleep(0.1)  # busy wait until we receive run command

        debugger.start_auxiliary_daemon_threads()

        if trace_only_current_thread:
            debugger.enable_tracing()
        else:
            # Trace future threads.
            debugger.patch_threads()

            debugger.enable_tracing(debugger.trace_dispatch, apply_to_all_threads=True)

            # As this is the first connection, also set tracing for any untraced threads
            debugger.set_tracing_for_untraced_contexts()

        debugger.set_trace_for_frame_and_parents(get_frame().f_back)

        with CustomFramesContainer.custom_frames_lock:  # @UndefinedVariable
            for _frameId, custom_frame in dict_iter_items(CustomFramesContainer.custom_frames):
                debugger.set_trace_for_frame_and_parents(custom_frame.frame)

        # Stop the tracing as the last thing before the actual shutdown for a clean exit.
        atexit.register(stoptrace)

    else:
        # ok, we're already in debug mode, with all set, so, let's just set the break
        debugger = get_global_debugger()

        debugger.set_trace_for_frame_and_parents(get_frame().f_back)

        t = threadingCurrentThread()
        additional_info = set_additional_thread_info(t)

        if trace_only_current_thread:
            debugger.enable_tracing()
        else:
            # Trace future threads.
            debugger.patch_threads()
            debugger.enable_tracing(debugger.trace_dispatch, apply_to_all_threads=True)

    # Suspend as the last thing after all tracing is in place.
    if suspend:
        if stop_at_frame is not None:
            # If the step was set we have to go to run state and
            # set the proper frame for it to stop.
            additional_info.pydev_state = STATE_RUN
            additional_info.pydev_original_step_cmd = CMD_STEP_OVER
            additional_info.pydev_step_cmd = CMD_STEP_OVER
            additional_info.pydev_step_stop = stop_at_frame
            additional_info.suspend_type = PYTHON_SUSPEND
        else:
            # Ask to break as soon as possible.
            debugger.set_suspend(t, CMD_SET_BREAK)


def stoptrace():
    global _debugger_setup
    if _debugger_setup:
        pydevd_tracing.restore_sys_set_trace_func()
        sys.settrace(None)
        try:
            # not available in jython!
            threading.settrace(None)  # for all future threads
        except:
            pass

        from _pydev_bundle.pydev_monkey import undo_patch_thread_modules
        undo_patch_thread_modules()

        debugger = get_global_debugger()

        if debugger:

            debugger.set_trace_for_frame_and_parents(get_frame(), disable=True)
            debugger.exiting()

            kill_all_pydev_threads()

        _debugger_setup = False


class Dispatcher(object):

    def __init__(self):
        self.port = None

    def connect(self, host, port):
        self.host = host
        self.port = port
        self.client = start_client(self.host, self.port)
        self.reader = DispatchReader(self)
        self.reader.pydev_do_not_trace = False  # we run reader in the same thread so we don't want to loose tracing
        self.reader.run()

    def close(self):
        try:
            self.reader.do_kill_pydev_thread()
        except :
            pass


class DispatchReader(ReaderThread):

    def __init__(self, dispatcher):
        self.dispatcher = dispatcher
        ReaderThread.__init__(self, self.dispatcher.client)

    @overrides(ReaderThread._on_run)
    def _on_run(self):
        dummy_thread = threading.currentThread()
        dummy_thread.is_pydev_daemon_thread = False
        return ReaderThread._on_run(self)

    def handle_except(self):
        ReaderThread.handle_except(self)

    def process_command(self, cmd_id, seq, text):
        if cmd_id == 99:
            self.dispatcher.port = int(text)
            self.killReceived = True


DISPATCH_APPROACH_NEW_CONNECTION = 1  # Used by PyDev
DISPATCH_APPROACH_EXISTING_CONNECTION = 2  # Used by PyCharm
DISPATCH_APPROACH = DISPATCH_APPROACH_NEW_CONNECTION


def dispatch():
    setup = SetupHolder.setup
    host = setup['client']
    port = setup['port']
    if DISPATCH_APPROACH == DISPATCH_APPROACH_EXISTING_CONNECTION:
        dispatcher = Dispatcher()
        try:
            dispatcher.connect(host, port)
            port = dispatcher.port
        finally:
            dispatcher.close()
    return host, port


def settrace_forked():
    '''
    When creating a fork from a process in the debugger, we need to reset the whole debugger environment!
    '''
    from _pydevd_bundle.pydevd_constants import GlobalDebuggerHolder
    GlobalDebuggerHolder.global_dbg = None
    threading.current_thread().additional_info = None
    PyDBDaemonThread.created_pydb_daemon_threads = {}

    from _pydevd_frame_eval.pydevd_frame_eval_main import clear_thread_local_info
    host, port = dispatch()

    import pydevd_tracing
    pydevd_tracing.restore_sys_set_trace_func()

    if port is not None:
        global _debugger_setup
        _debugger_setup = False

        custom_frames_container_init()

        if clear_thread_local_info is not None:
            clear_thread_local_info()

        settrace(
                host,
                port=port,
                suspend=False,
                trace_only_current_thread=False,
                overwrite_prev_trace=True,
                patch_multiprocessing=True,
        )


#=======================================================================================================================
# SetupHolder
#=======================================================================================================================
class SetupHolder:

    setup = None


def apply_debugger_options(setup_options):
    """

    :type setup_options: dict[str, bool]
    """
    default_options = {'save-signatures': False, 'qt-support': ''}
    default_options.update(setup_options)
    setup_options = default_options

    debugger = GetGlobalDebugger()
    if setup_options['save-signatures']:
        if pydevd_vm_type.get_vm_type() == pydevd_vm_type.PydevdVmType.JYTHON:
            sys.stderr.write("Collecting run-time type information is not supported for Jython\n")
        else:
            # Only import it if we're going to use it!
            from _pydevd_bundle.pydevd_signature import SignatureFactory
            debugger.signature_factory = SignatureFactory()

    if setup_options['qt-support']:
        enable_qt_support(setup_options['qt-support'])


def patch_stdin(debugger):
    from _pydev_bundle.pydev_console_utils import DebugConsoleStdIn
    orig_stdin = sys.stdin
    sys.stdin = DebugConsoleStdIn(debugger, orig_stdin)

# Dispatch on_debugger_modules_loaded here, after all primary debugger modules are loaded


for handler in pydevd_extension_utils.extensions_of_type(DebuggerEventHandler):
    handler.on_debugger_modules_loaded(debugger_version=__version__)


#=======================================================================================================================
# main
#=======================================================================================================================
def main():

    # parse the command line. --file is our last argument that is required
    try:
        from _pydevd_bundle.pydevd_command_line_handling import process_command_line
        setup = process_command_line(sys.argv)
        SetupHolder.setup = setup
    except ValueError:
        pydev_log.exception()
        usage(1)

    if setup['print-in-debugger-startup']:
        try:
            pid = ' (pid: %s)' % os.getpid()
        except:
            pid = ''
        sys.stderr.write("pydev debugger: starting%s\n" % pid)

    pydev_log.debug("Executing file %s" % setup['file'])
    pydev_log.debug("arguments: %s" % str(sys.argv))

    pydevd_vm_type.setup_type(setup.get('vm_type', None))

    if SHOW_DEBUG_INFO_ENV:
        set_debug(setup)

    DebugInfoHolder.DEBUG_RECORD_SOCKET_READS = setup.get('DEBUG_RECORD_SOCKET_READS', DebugInfoHolder.DEBUG_RECORD_SOCKET_READS)
    DebugInfoHolder.DEBUG_TRACE_BREAKPOINTS = setup.get('DEBUG_TRACE_BREAKPOINTS', DebugInfoHolder.DEBUG_TRACE_BREAKPOINTS)
    DebugInfoHolder.DEBUG_TRACE_LEVEL = setup.get('DEBUG_TRACE_LEVEL', DebugInfoHolder.DEBUG_TRACE_LEVEL)

    port = setup['port']
    host = setup['client']
    f = setup['file']
    fix_app_engine_debug = False

    debugger = get_global_debugger()
    if debugger is None:
        debugger = PyDB()

    try:
        from _pydev_bundle import pydev_monkey
    except:
        pass  # Not usable on jython 2.1
    else:
        if setup['multiprocess']:  # PyDev
            pydev_monkey.patch_new_process_functions()

        elif setup['multiproc']:  # PyCharm
            pydev_log.debug("Started in multiproc mode\n")
            global DISPATCH_APPROACH
            DISPATCH_APPROACH = DISPATCH_APPROACH_EXISTING_CONNECTION

            dispatcher = Dispatcher()
            try:
                dispatcher.connect(host, port)
                if dispatcher.port is not None:
                    port = dispatcher.port
                    pydev_log.debug("Received port %d\n" % port)
                    pydev_log.info("pydev debugger: process %d is connecting\n" % os.getpid())

                    try:
                        pydev_monkey.patch_new_process_functions()
                    except:
                        pydev_log.exception("Error patching process functions.")
                else:
                    pydev_log.critical("pydev debugger: couldn't get port for new debug process.")
            finally:
                dispatcher.close()
        else:
            try:
                pydev_monkey.patch_new_process_functions_with_warning()
            except:
                pydev_log.exception("Error patching process functions.")

            # Only do this patching if we're not running with multiprocess turned on.
            if f.find('dev_appserver.py') != -1:
                if os.path.basename(f).startswith('dev_appserver.py'):
                    appserver_dir = os.path.dirname(f)
                    version_file = os.path.join(appserver_dir, 'VERSION')
                    if os.path.exists(version_file):
                        try:
                            stream = open(version_file, 'r')
                            try:
                                for line in stream.read().splitlines():
                                    line = line.strip()
                                    if line.startswith('release:'):
                                        line = line[8:].strip()
                                        version = line.replace('"', '')
                                        version = version.split('.')
                                        if int(version[0]) > 1:
                                            fix_app_engine_debug = True

                                        elif int(version[0]) == 1:
                                            if int(version[1]) >= 7:
                                                # Only fix from 1.7 onwards
                                                fix_app_engine_debug = True
                                        break
                            finally:
                                stream.close()
                        except:
                            pydev_log.exception()

    try:
        # In the default run (i.e.: run directly on debug mode), we try to patch stackless as soon as possible
        # on a run where we have a remote debug, we may have to be more careful because patching stackless means
        # that if the user already had a stackless.set_schedule_callback installed, he'd loose it and would need
        # to call it again (because stackless provides no way of getting the last function which was registered
        # in set_schedule_callback).
        #
        # So, ideally, if there's an application using stackless and the application wants to use the remote debugger
        # and benefit from stackless debugging, the application itself must call:
        #
        # import pydevd_stackless
        # pydevd_stackless.patch_stackless()
        #
        # itself to be able to benefit from seeing the tasklets created before the remote debugger is attached.
        from _pydevd_bundle import pydevd_stackless
        pydevd_stackless.patch_stackless()
    except:
        # It's ok not having stackless there...
        try:
            if hasattr(sys, 'exc_clear'):
                sys.exc_clear()  # the exception information should be cleaned in Python 2
        except:
            pass

    is_module = setup['module']
    patch_stdin(debugger)

    if setup['json-dap']:
        PyDevdAPI().set_protocol(debugger, 0, JSON_PROTOCOL)

    if fix_app_engine_debug:
        sys.stderr.write("pydev debugger: google app engine integration enabled\n")
        curr_dir = os.path.dirname(__file__)
        app_engine_startup_file = os.path.join(curr_dir, 'pydev_app_engine_debug_startup.py')

        sys.argv.insert(1, '--python_startup_script=' + app_engine_startup_file)
        import json
        setup['pydevd'] = __file__
        sys.argv.insert(2, '--python_startup_args=%s' % json.dumps(setup),)
        sys.argv.insert(3, '--automatic_restart=no')
        sys.argv.insert(4, '--max_module_instances=1')

        # Run the dev_appserver
        debugger.run(setup['file'], None, None, is_module, set_trace=False)
    else:
        if setup['save-threading']:
            debugger.thread_analyser = ThreadingLogger()
        if setup['save-asyncio']:
            if IS_PY34_OR_GREATER:
                debugger.asyncio_analyser = AsyncioLogger()

        apply_debugger_options(setup)

        try:
            debugger.connect(host, port)
        except:
            sys.stderr.write("Could not connect to %s: %s\n" % (host, port))
            pydev_log.exception()
            sys.exit(1)

        global _debugger_setup
        _debugger_setup = True  # Mark that the debugger is setup when started from the ide.

        globals = debugger.run(setup['file'], None, None, is_module)

        if setup['cmd-line']:
            debugger.wait_for_commands(globals)


if __name__ == '__main__':
    main()
