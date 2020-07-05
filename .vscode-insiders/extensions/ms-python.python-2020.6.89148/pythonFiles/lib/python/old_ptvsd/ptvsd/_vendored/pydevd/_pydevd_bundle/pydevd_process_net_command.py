import json
import os
import sys
import traceback

from _pydev_bundle import pydev_log
from _pydev_bundle.pydev_log import exception as pydev_log_exception
from _pydevd_bundle import pydevd_traceproperty, pydevd_dont_trace, pydevd_utils
from _pydevd_bundle.pydevd_additional_thread_info import set_additional_thread_info
from _pydevd_bundle.pydevd_breakpoints import get_exception_class
from _pydevd_bundle.pydevd_comm import (pydevd_find_thread_by_id,
    InternalEvaluateConsoleExpression, InternalConsoleGetCompletions, InternalRunCustomOperation,
    internal_get_next_statement_targets)
from _pydevd_bundle.pydevd_constants import IS_PY3K, NEXT_VALUE_SEPARATOR, IS_WINDOWS
from _pydevd_bundle.pydevd_comm_constants import ID_TO_MEANING, CMD_EXEC_EXPRESSION
from _pydevd_bundle.pydevd_api import PyDevdAPI
from _pydev_bundle.pydev_imports import StringIO


class _PyDevCommandProcessor(object):

    def __init__(self):
        self.api = PyDevdAPI()

    def process_net_command(self, py_db, cmd_id, seq, text):
        '''Processes a command received from the Java side

        @param cmd_id: the id of the command
        @param seq: the sequence of the command
        @param text: the text received in the command
        '''
        meaning = ID_TO_MEANING[str(cmd_id)]

        # print('Handling %s (%s)' % (meaning, text))

        method_name = meaning.lower()

        on_command = getattr(self, method_name.lower(), None)
        if on_command is None:
            # I have no idea what this is all about
            cmd = py_db.cmd_factory.make_error_message(seq, "unexpected command " + str(cmd_id))
            py_db.writer.add_command(cmd)
            return

        py_db._main_lock.acquire()
        try:
            cmd = on_command(py_db, cmd_id, seq, text)
            if cmd is not None:
                py_db.writer.add_command(cmd)
        except:
            if traceback is not None and sys is not None and pydev_log_exception is not None:
                pydev_log_exception()

                stream = StringIO()
                traceback.print_exc(file=stream)
                cmd = py_db.cmd_factory.make_error_message(
                    seq,
                    "Unexpected exception in process_net_command.\nInitial params: %s. Exception: %s" % (
                        ((cmd_id, seq, text), stream.getvalue())
                    )
                )
                if cmd is not None:
                    py_db.writer.add_command(cmd)

        finally:
            py_db._main_lock.release()

    def cmd_run(self, py_db, cmd_id, seq, text):
        return self.api.run(py_db)

    def cmd_list_threads(self, py_db, cmd_id, seq, text):
        return self.api.list_threads(py_db, seq)

    def cmd_get_completions(self, py_db, cmd_id, seq, text):
        # we received some command to get a variable
        # the text is: thread_id\tframe_id\tactivation token
        thread_id, frame_id, _scope, act_tok = text.split('\t', 3)

        return self.api.request_completions(py_db, seq, thread_id, frame_id, act_tok)

    def cmd_get_thread_stack(self, py_db, cmd_id, seq, text):
        # Receives a thread_id and a given timeout, which is the time we should
        # wait to the provide the stack if a given thread is still not suspended.
        if '\t' in text:
            thread_id, timeout = text.split('\t')
            timeout = float(timeout)
        else:
            thread_id = text
            timeout = .5  # Default timeout is .5 seconds

        return self.api.request_stack(py_db, seq, thread_id, fmt={}, timeout=timeout)

    def cmd_set_protocol(self, py_db, cmd_id, seq, text):
        return self.api.set_protocol(py_db, seq, text.strip())

    def cmd_thread_suspend(self, py_db, cmd_id, seq, text):
        return self.api.request_suspend_thread(py_db, text.strip())

    def cmd_version(self, py_db, cmd_id, seq, text):
        # Default based on server process (although ideally the IDE should
        # provide it).
        if IS_WINDOWS:
            ide_os = 'WINDOWS'
        else:
            ide_os = 'UNIX'

        # Breakpoints can be grouped by 'LINE' or by 'ID'.
        breakpoints_by = 'LINE'

        splitted = text.split('\t')
        if len(splitted) == 1:
            _local_version = splitted

        elif len(splitted) == 2:
            _local_version, ide_os = splitted

        elif len(splitted) == 3:
            _local_version, ide_os, breakpoints_by = splitted

        version_msg = self.api.set_ide_os_and_breakpoints_by(py_db, seq, ide_os, breakpoints_by)

        # Enable thread notifications after the version command is completed.
        self.api.set_enable_thread_notifications(py_db, True)

        return version_msg

    def cmd_thread_run(self, py_db, cmd_id, seq, text):
        return self.api.request_resume_thread(text.strip())

    def _cmd_step(self, py_db, cmd_id, seq, text):
        return self.api.request_step(py_db, text.strip(), cmd_id)

    cmd_step_into = _cmd_step
    cmd_step_into_my_code = _cmd_step
    cmd_step_over = _cmd_step
    cmd_step_over_my_code = _cmd_step
    cmd_step_return = _cmd_step
    cmd_step_return_my_code = _cmd_step

    def _cmd_set_next(self, py_db, cmd_id, seq, text):
        thread_id, line, func_name = text.split('\t', 2)
        return self.api.request_set_next(py_db, seq, thread_id, cmd_id, line, func_name)

    cmd_run_to_line = _cmd_set_next
    cmd_set_next_statement = _cmd_set_next
    cmd_smart_step_into = _cmd_set_next

    def cmd_reload_code(self, py_db, cmd_id, seq, text):
        module_name = text.strip()
        self.api.request_reload_code(py_db, seq, module_name)

    def cmd_change_variable(self, py_db, cmd_id, seq, text):
        # the text is: thread\tstackframe\tFRAME|GLOBAL\tattribute_to_change\tvalue_to_change
        thread_id, frame_id, scope, attr_and_value = text.split('\t', 3)

        tab_index = attr_and_value.rindex('\t')
        attr = attr_and_value[0:tab_index].replace('\t', '.')
        value = attr_and_value[tab_index + 1:]
        self.api.request_change_variable(py_db, seq, thread_id, frame_id, scope, attr, value)

    def cmd_get_variable(self, py_db, cmd_id, seq, text):
        # we received some command to get a variable
        # the text is: thread_id\tframe_id\tFRAME|GLOBAL\tattributes*
        thread_id, frame_id, scopeattrs = text.split('\t', 2)

        if scopeattrs.find('\t') != -1:  # there are attributes beyond scope
            scope, attrs = scopeattrs.split('\t', 1)
        else:
            scope, attrs = (scopeattrs, None)

        self.api.request_get_variable(py_db, seq, thread_id, frame_id, scope, attrs)

    def cmd_get_array(self, py_db, cmd_id, seq, text):
        # Note: untested and unused in pydev
        # we received some command to get an array variable
        # the text is: thread_id\tframe_id\tFRAME|GLOBAL\tname\ttemp\troffs\tcoffs\trows\tcols\tformat
        roffset, coffset, rows, cols, format, thread_id, frame_id, scopeattrs = text.split('\t', 7)

        if scopeattrs.find('\t') != -1:  # there are attributes beyond scope
            scope, attrs = scopeattrs.split('\t', 1)
        else:
            scope, attrs = (scopeattrs, None)

        self.api.request_get_array(py_db, seq, roffset, coffset, rows, cols, format, thread_id, frame_id, scope, attrs)

    def cmd_show_return_values(self, py_db, cmd_id, seq, text):
        show_return_values = text.split('\t')[1]
        self.api.set_show_return_values(py_db, int(show_return_values) == 1)

    def cmd_load_full_value(self, py_db, cmd_id, seq, text):
        # Note: untested and unused in pydev
        thread_id, frame_id, scopeattrs = text.split('\t', 2)
        vars = scopeattrs.split(NEXT_VALUE_SEPARATOR)

        self.api.request_load_full_value(py_db, seq, thread_id, frame_id, vars)

    def cmd_get_description(self, py_db, cmd_id, seq, text):
        # Note: untested and unused in pydev
        thread_id, frame_id, expression = text.split('\t', 2)
        self.api.request_get_description(py_db, seq, thread_id, frame_id, expression)

    def cmd_get_frame(self, py_db, cmd_id, seq, text):
        thread_id, frame_id, scope = text.split('\t', 2)
        self.api.request_get_frame(py_db, seq, thread_id, frame_id)

    def cmd_set_break(self, py_db, cmd_id, seq, text):
        # func name: 'None': match anything. Empty: match global, specified: only method context.
        # command to add some breakpoint.
        # text is filename\tline. Add to breakpoints dictionary
        suspend_policy = u"NONE"  # Can be 'NONE' or 'ALL'
        is_logpoint = False
        hit_condition = None
        if py_db._set_breakpoints_with_id:
            try:
                try:
                    breakpoint_id, btype, filename, line, func_name, condition, expression, hit_condition, is_logpoint, suspend_policy = text.split(u'\t', 9)
                except ValueError:  # not enough values to unpack
                    # No suspend_policy passed (use default).
                    breakpoint_id, btype, filename, line, func_name, condition, expression, hit_condition, is_logpoint = text.split(u'\t', 8)
                is_logpoint = is_logpoint == u'True'
            except ValueError:  # not enough values to unpack
                breakpoint_id, btype, filename, line, func_name, condition, expression = text.split(u'\t', 6)

            breakpoint_id = int(breakpoint_id)
            line = int(line)

            # We must restore new lines and tabs as done in
            # AbstractDebugTarget.breakpointAdded
            condition = condition.replace(u"@_@NEW_LINE_CHAR@_@", u'\n').\
                replace(u"@_@TAB_CHAR@_@", u'\t').strip()

            expression = expression.replace(u"@_@NEW_LINE_CHAR@_@", u'\n').\
                replace(u"@_@TAB_CHAR@_@", u'\t').strip()
        else:
            # Note: this else should be removed after PyCharm migrates to setting
            # breakpoints by id (and ideally also provides func_name).
            btype, filename, line, func_name, suspend_policy, condition, expression = text.split(u'\t', 6)
            # If we don't have an id given for each breakpoint, consider
            # the id to be the line.
            breakpoint_id = line = int(line)

            condition = condition.replace(u"@_@NEW_LINE_CHAR@_@", u'\n'). \
                replace(u"@_@TAB_CHAR@_@", u'\t').strip()

            expression = expression.replace(u"@_@NEW_LINE_CHAR@_@", u'\n'). \
                replace(u"@_@TAB_CHAR@_@", u'\t').strip()

        if condition is not None and (len(condition) <= 0 or condition == u"None"):
            condition = None

        if expression is not None and (len(expression) <= 0 or expression == u"None"):
            expression = None

        if hit_condition is not None and (len(hit_condition) <= 0 or hit_condition == u"None"):
            hit_condition = None

        result = self.api.add_breakpoint(
            py_db, self.api.filename_to_str(filename), btype, breakpoint_id, line, condition, func_name, expression, suspend_policy, hit_condition, is_logpoint)
        error_code = result.error_code

        if error_code:
            translated_filename = result.translated_filename
            if error_code == self.api.ADD_BREAKPOINT_FILE_NOT_FOUND:
                pydev_log.critical('pydev debugger: warning: Trying to add breakpoint to file that does not exist: %s (will have no effect).' % (translated_filename,))

            elif error_code == self.api.ADD_BREAKPOINT_FILE_EXCLUDED_BY_FILTERS:
                pydev_log.critical('pydev debugger: warning: Trying to add breakpoint to file that is excluded by filters: %s (will have no effect).' % (translated_filename,))

            else:
                # Shouldn't get here.
                pydev_log.critical('pydev debugger: warning: Breakpoint not validated (reason unknown -- please report as error): %s.' % (translated_filename,))

    def cmd_remove_break(self, py_db, cmd_id, seq, text):
        # command to remove some breakpoint
        # text is type\file\tid. Remove from breakpoints dictionary
        breakpoint_type, filename, breakpoint_id = text.split('\t', 2)

        filename = self.api.filename_to_str(filename)

        try:
            breakpoint_id = int(breakpoint_id)
        except ValueError:
            pydev_log.critical('Error removing breakpoint. Expected breakpoint_id to be an int. Found: %s', breakpoint_id)

        else:
            self.api.remove_breakpoint(py_db, filename, breakpoint_type, breakpoint_id)

    def _cmd_exec_or_evaluate_expression(self, py_db, cmd_id, seq, text):
        # command to evaluate the given expression
        # text is: thread\tstackframe\tLOCAL\texpression
        attr_to_set_result = ""
        try:
            thread_id, frame_id, scope, expression, trim, attr_to_set_result = text.split('\t', 5)
        except ValueError:
            thread_id, frame_id, scope, expression, trim = text.split('\t', 4)
        is_exec = cmd_id == CMD_EXEC_EXPRESSION
        trim_if_too_big = int(trim) == 1

        self.api.request_exec_or_evaluate(
            py_db, seq, thread_id, frame_id, expression, is_exec, trim_if_too_big, attr_to_set_result)

    cmd_evaluate_expression = _cmd_exec_or_evaluate_expression
    cmd_exec_expression = _cmd_exec_or_evaluate_expression

    def cmd_console_exec(self, py_db, cmd_id, seq, text):
        # command to exec expression in console, in case expression is only partially valid 'False' is returned
        # text is: thread\tstackframe\tLOCAL\texpression

        thread_id, frame_id, scope, expression = text.split('\t', 3)
        self.api.request_console_exec(py_db, seq, thread_id, frame_id, expression)

    def cmd_set_py_exception(self, py_db, cmd_id, seq, text):
        # Command which receives set of exceptions on which user wants to break the debugger
        # text is:
        #
        # break_on_uncaught;
        # break_on_caught;
        # skip_on_exceptions_thrown_in_same_context;
        # ignore_exceptions_thrown_in_lines_with_ignore_exception;
        # ignore_libraries;
        # TypeError;ImportError;zipimport.ZipImportError;
        #
        # i.e.: true;true;true;true;true;TypeError;ImportError;zipimport.ZipImportError;
        #
        # This API is optional and works 'in bulk' -- it's possible
        # to get finer-grained control with CMD_ADD_EXCEPTION_BREAK/CMD_REMOVE_EXCEPTION_BREAK
        # which allows setting caught/uncaught per exception.
        splitted = text.split(';')
        py_db.break_on_uncaught_exceptions = {}
        py_db.break_on_caught_exceptions = {}
        if len(splitted) >= 5:
            if splitted[0] == 'true':
                break_on_uncaught = True
            else:
                break_on_uncaught = False

            if splitted[1] == 'true':
                break_on_caught = True
            else:
                break_on_caught = False

            if splitted[2] == 'true':
                py_db.skip_on_exceptions_thrown_in_same_context = True
            else:
                py_db.skip_on_exceptions_thrown_in_same_context = False

            if splitted[3] == 'true':
                py_db.ignore_exceptions_thrown_in_lines_with_ignore_exception = True
            else:
                py_db.ignore_exceptions_thrown_in_lines_with_ignore_exception = False

            if splitted[4] == 'true':
                ignore_libraries = True
            else:
                ignore_libraries = False

            for exception_type in splitted[5:]:
                exception_type = exception_type.strip()
                if not exception_type:
                    continue

                exception_breakpoint = py_db.add_break_on_exception(
                    exception_type,
                    condition=None,
                    expression=None,
                    notify_on_handled_exceptions=break_on_caught,
                    notify_on_unhandled_exceptions=break_on_uncaught,
                    notify_on_first_raise_only=True,
                    ignore_libraries=ignore_libraries,
                )

            py_db.on_breakpoints_changed()

        else:
            sys.stderr.write("Error when setting exception list. Received: %s\n" % (text,))

    def _load_source(self, py_db, cmd_id, seq, text):
        filename = text
        filename = self.api.filename_to_str(filename)
        self.api.request_load_source(py_db, seq, filename)

    cmd_load_source = _load_source
    cmd_get_file_contents = _load_source

    def cmd_set_property_trace(self, py_db, cmd_id, seq, text):
        # Command which receives whether to trace property getter/setter/deleter
        # text is feature_state(true/false);disable_getter/disable_setter/disable_deleter
        if text:
            splitted = text.split(';')
            if len(splitted) >= 3:
                if py_db.disable_property_trace is False and splitted[0] == 'true':
                    # Replacing property by custom property only when the debugger starts
                    pydevd_traceproperty.replace_builtin_property()
                    py_db.disable_property_trace = True
                # Enable/Disable tracing of the property getter
                if splitted[1] == 'true':
                    py_db.disable_property_getter_trace = True
                else:
                    py_db.disable_property_getter_trace = False
                # Enable/Disable tracing of the property setter
                if splitted[2] == 'true':
                    py_db.disable_property_setter_trace = True
                else:
                    py_db.disable_property_setter_trace = False
                # Enable/Disable tracing of the property deleter
                if splitted[3] == 'true':
                    py_db.disable_property_deleter_trace = True
                else:
                    py_db.disable_property_deleter_trace = False

    def cmd_add_exception_break(self, py_db, cmd_id, seq, text):
        # Note that this message has some idiosyncrasies...
        #
        # notify_on_handled_exceptions can be 0, 1 or 2
        # 0 means we should not stop on handled exceptions.
        # 1 means we should stop on handled exceptions showing it on all frames where the exception passes.
        # 2 means we should stop on handled exceptions but we should only notify about it once.
        #
        # To ignore_libraries properly, besides setting ignore_libraries to 1, the IDE_PROJECT_ROOTS environment
        # variable must be set (so, we'll ignore anything not below IDE_PROJECT_ROOTS) -- this is not ideal as
        # the environment variable may not be properly set if it didn't start from the debugger (we should
        # create a custom message for that).
        #
        # There are 2 global settings which can only be set in CMD_SET_PY_EXCEPTION. Namely:
        #
        # py_db.skip_on_exceptions_thrown_in_same_context
        # - If True, we should only show the exception in a caller, not where it was first raised.
        #
        # py_db.ignore_exceptions_thrown_in_lines_with_ignore_exception
        # - If True exceptions thrown in lines with '@IgnoreException' will not be shown.

        condition = ""
        expression = ""
        if text.find('\t') != -1:
            try:
                exception, condition, expression, notify_on_handled_exceptions, notify_on_unhandled_exceptions, ignore_libraries = text.split('\t', 5)
            except:
                exception, notify_on_handled_exceptions, notify_on_unhandled_exceptions, ignore_libraries = text.split('\t', 3)
        else:
            exception, notify_on_handled_exceptions, notify_on_unhandled_exceptions, ignore_libraries = text, 0, 0, 0

        condition = condition.replace("@_@NEW_LINE_CHAR@_@", '\n').replace("@_@TAB_CHAR@_@", '\t').strip()

        if condition is not None and (len(condition) == 0 or condition == "None"):
            condition = None

        expression = expression.replace("@_@NEW_LINE_CHAR@_@", '\n').replace("@_@TAB_CHAR@_@", '\t').strip()

        if expression is not None and (len(expression) == 0 or expression == "None"):
            expression = None

        if exception.find('-') != -1:
            breakpoint_type, exception = exception.split('-')
        else:
            breakpoint_type = 'python'

        if breakpoint_type == 'python':
            self.api.add_python_exception_breakpoint(
                py_db, exception, condition, expression,
                notify_on_handled_exceptions=int(notify_on_handled_exceptions) > 0,
                notify_on_unhandled_exceptions=int(notify_on_unhandled_exceptions) == 1,
                notify_on_first_raise_only=int(notify_on_handled_exceptions) == 2,
                ignore_libraries=int(ignore_libraries) > 0,
            )
        else:
            self.api.add_plugins_exception_breakpoint(py_db, breakpoint_type, exception)

    def cmd_remove_exception_break(self, py_db, cmd_id, seq, text):
        exception = text
        if exception.find('-') != -1:
            exception_type, exception = exception.split('-')
        else:
            exception_type = 'python'

        if exception_type == 'python':
            self.api.remove_python_exception_breakpoint(py_db, exception)
        else:
            self.api.remove_plugins_exception_breakpoint(py_db, exception_type, exception)

    def cmd_add_django_exception_break(self, py_db, cmd_id, seq, text):
        self.api.add_plugins_exception_breakpoint(py_db, breakpoint_type='django', exception=text)

    def cmd_remove_django_exception_break(self, py_db, cmd_id, seq, text):
        self.api.remove_plugins_exception_breakpoint(py_db, exception_type='django', exception=text)

    def cmd_evaluate_console_expression(self, py_db, cmd_id, seq, text):
        # Command which takes care for the debug console communication
        if text != "":
            thread_id, frame_id, console_command = text.split('\t', 2)
            console_command, line = console_command.split('\t')

            if console_command == 'EVALUATE':
                int_cmd = InternalEvaluateConsoleExpression(
                    seq, thread_id, frame_id, line, buffer_output=True)

            elif console_command == 'EVALUATE_UNBUFFERED':
                int_cmd = InternalEvaluateConsoleExpression(
                    seq, thread_id, frame_id, line, buffer_output=False)

            elif console_command == 'GET_COMPLETIONS':
                int_cmd = InternalConsoleGetCompletions(seq, thread_id, frame_id, line)

            else:
                raise ValueError('Unrecognized command: %s' % (console_command,))

            py_db.post_internal_command(int_cmd, thread_id)

    def cmd_run_custom_operation(self, py_db, cmd_id, seq, text):
        # Command which runs a custom operation
        if text != "":
            try:
                location, custom = text.split('||', 1)
            except:
                sys.stderr.write('Custom operation now needs a || separator. Found: %s\n' % (text,))
                raise

            thread_id, frame_id, scopeattrs = location.split('\t', 2)

            if scopeattrs.find('\t') != -1:  # there are attributes beyond scope
                scope, attrs = scopeattrs.split('\t', 1)
            else:
                scope, attrs = (scopeattrs, None)

            # : style: EXECFILE or EXEC
            # : encoded_code_or_file: file to execute or code
            # : fname: name of function to be executed in the resulting namespace
            style, encoded_code_or_file, fnname = custom.split('\t', 3)
            int_cmd = InternalRunCustomOperation(seq, thread_id, frame_id, scope, attrs,
                                                 style, encoded_code_or_file, fnname)
            py_db.post_internal_command(int_cmd, thread_id)

    def cmd_ignore_thrown_exception_at(self, py_db, cmd_id, seq, text):
        if text:
            replace = 'REPLACE:'  # Not all 3.x versions support u'REPLACE:', so, doing workaround.
            if not IS_PY3K:
                replace = unicode(replace)  # noqa

            if text.startswith(replace):
                text = text[8:]
                py_db.filename_to_lines_where_exceptions_are_ignored.clear()

            if text:
                for line in text.split('||'):  # Can be bulk-created (one in each line)
                    filename, line_number = line.split('|')
                    filename = self.api.filename_to_server(filename)

                    if os.path.exists(filename):
                        lines_ignored = py_db.filename_to_lines_where_exceptions_are_ignored.get(filename)
                        if lines_ignored is None:
                            lines_ignored = py_db.filename_to_lines_where_exceptions_are_ignored[filename] = {}
                        lines_ignored[int(line_number)] = 1
                    else:
                        sys.stderr.write('pydev debugger: warning: trying to ignore exception thrown'\
                            ' on file that does not exist: %s (will have no effect)\n' % (filename,))

    def cmd_enable_dont_trace(self, py_db, cmd_id, seq, text):
        if text:
            true_str = 'true'  # Not all 3.x versions support u'str', so, doing workaround.
            if not IS_PY3K:
                true_str = unicode(true_str)  # noqa

            mode = text.strip() == true_str
            pydevd_dont_trace.trace_filter(mode)

    def cmd_redirect_output(self, py_db, cmd_id, seq, text):
        if text:
            py_db.enable_output_redirection('STDOUT' in text, 'STDERR' in text)

    def cmd_get_next_statement_targets(self, py_db, cmd_id, seq, text):
        thread_id, frame_id = text.split('\t', 1)

        py_db.post_method_as_internal_command(
            thread_id, internal_get_next_statement_targets, seq, thread_id, frame_id)

    def cmd_set_project_roots(self, py_db, cmd_id, seq, text):
        self.api.set_project_roots(py_db, text.split(u'\t'))

    def cmd_thread_dump_to_stderr(self, py_db, cmd_id, seq, text):
        pydevd_utils.dump_threads()

    def cmd_stop_on_start(self, py_db, cmd_id, seq, text):
        if text.strip() in ('True', 'true', '1'):
            self.api.stop_on_entry()

    def cmd_pydevd_json_config(self, py_db, cmd_id, seq, text):
        # Expected to receive a json string as:
        # {
        #     'skip_suspend_on_breakpoint_exception': [<exception names where we should suspend>],
        #     'skip_print_breakpoint_exception': [<exception names where we should print>],
        #     'multi_threads_single_notification': bool,
        # }
        msg = json.loads(text.strip())
        if 'skip_suspend_on_breakpoint_exception' in msg:
            py_db.skip_suspend_on_breakpoint_exception = tuple(
                get_exception_class(x) for x in msg['skip_suspend_on_breakpoint_exception'])

        if 'skip_print_breakpoint_exception' in msg:
            py_db.skip_print_breakpoint_exception = tuple(
                get_exception_class(x) for x in msg['skip_print_breakpoint_exception'])

        if 'multi_threads_single_notification' in msg:
            py_db.multi_threads_single_notification = msg['multi_threads_single_notification']

    def cmd_get_exception_details(self, py_db, cmd_id, seq, text):
        thread_id = text
        t = pydevd_find_thread_by_id(thread_id)
        frame = None
        if t and not getattr(t, 'pydev_do_not_trace', None):
            additional_info = set_additional_thread_info(t)
            frame = additional_info.get_topmost_frame(t)
        try:
            return py_db.cmd_factory.make_get_exception_details_message(py_db, seq, thread_id, frame)
        finally:
            frame = None
            t = None


process_net_command = _PyDevCommandProcessor().process_net_command

