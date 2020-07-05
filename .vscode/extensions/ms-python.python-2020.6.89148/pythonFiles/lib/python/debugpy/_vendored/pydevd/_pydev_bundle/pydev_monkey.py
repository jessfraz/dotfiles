# License: EPL
import os
import re
import sys
from _pydev_imps._pydev_saved_modules import threading
from _pydevd_bundle.pydevd_constants import get_global_debugger, IS_WINDOWS, IS_JYTHON, get_current_thread_id, \
    sorted_dict_repr
from _pydev_bundle import pydev_log
from contextlib import contextmanager
from _pydevd_bundle import pydevd_constants

try:
    xrange
except:
    xrange = range

#===============================================================================
# Things that are dependent on having the pydevd debugger
#===============================================================================

pydev_src_dir = os.path.dirname(os.path.dirname(__file__))

_arg_patch = threading.local()


@contextmanager
def skip_subprocess_arg_patch():
    _arg_patch.apply_arg_patching = False
    try:
        yield
    finally:
        _arg_patch.apply_arg_patching = True


def _get_apply_arg_patching():
    return getattr(_arg_patch, 'apply_arg_patching', True)


def _get_setup_updated_with_protocol_and_ppid(setup, is_exec=False):
    if setup is None:
        setup = {}
    setup = setup.copy()
    # Discard anything related to the protocol (we'll set the the protocol based on the one
    # currently set).
    setup.pop(pydevd_constants.ARGUMENT_HTTP_JSON_PROTOCOL, None)
    setup.pop(pydevd_constants.ARGUMENT_JSON_PROTOCOL, None)
    setup.pop(pydevd_constants.ARGUMENT_QUOTED_LINE_PROTOCOL, None)

    if not is_exec:
        # i.e.: The ppid for the subprocess is the current pid.
        # If it's an exec, keep it what it was.
        setup[pydevd_constants.ARGUMENT_PPID] = os.getpid()

    protocol = pydevd_constants.get_protocol()
    if protocol == pydevd_constants.HTTP_JSON_PROTOCOL:
        setup[pydevd_constants.ARGUMENT_HTTP_JSON_PROTOCOL] = True

    elif protocol == pydevd_constants.JSON_PROTOCOL:
        setup[pydevd_constants.ARGUMENT_JSON_PROTOCOL] = True

    elif protocol == pydevd_constants.QUOTED_LINE_PROTOCOL:
        setup[pydevd_constants.ARGUMENT_QUOTED_LINE_PROTOCOL] = True

    elif protocol == pydevd_constants.HTTP_PROTOCOL:
        setup[pydevd_constants.ARGUMENT_HTTP_PROTOCOL] = True

    else:
        pydev_log.debug('Unexpected protocol: %s', protocol)
    return setup


def _get_python_c_args(host, port, indC, args, setup):
    setup = _get_setup_updated_with_protocol_and_ppid(setup)

    # i.e.: We want to make the repr sorted so that it works in tests.
    setup_repr = setup if setup is None else (sorted_dict_repr(setup))

    return ("import sys; sys.path.insert(0, r'%s'); import pydevd; pydevd.PydevdCustomization.DEFAULT_PROTOCOL=%r; "
            "pydevd.settrace(host=%r, port=%s, suspend=False, trace_only_current_thread=False, patch_multiprocessing=True, access_token=%r, client_access_token=%r, __setup_holder__=%s); "
            "%s"
            ) % (
               pydev_src_dir,
               pydevd_constants.get_protocol(),
               host,
               port,
               setup.get('access-token'),
               setup.get('client-access-token'),
               setup_repr,
               args[indC + 1])


def _get_host_port():
    import pydevd
    host, port = pydevd.dispatch()
    return host, port


def _is_managed_arg(arg):
    pydevd_py = _get_str_type_compatible(arg, 'pydevd.py')
    if arg.endswith(pydevd_py):
        return True
    return False


def _on_forked_process(setup_tracing=True):
    pydevd_constants.after_fork()
    pydev_log.initialize_debug_stream(reinitialize=True)

    if setup_tracing:
        pydev_log.debug('pydevd on forked process: %s', os.getpid())

    import pydevd
    pydevd.threadingCurrentThread().__pydevd_main_thread = True
    pydevd.settrace_forked(setup_tracing=setup_tracing)


def _on_set_trace_for_new_thread(global_debugger):
    if global_debugger is not None:
        global_debugger.enable_tracing()


def _get_str_type_compatible(s, args):
    '''
    This method converts `args` to byte/unicode based on the `s' type.
    '''
    if isinstance(args, (list, tuple)):
        ret = []
        for arg in args:
            if type(s) == type(arg):
                ret.append(arg)
            else:
                if isinstance(s, bytes):
                    ret.append(arg.encode('utf-8'))
                else:
                    ret.append(arg.decode('utf-8'))
        return ret
    else:
        if type(s) == type(args):
            return args
        else:
            if isinstance(s, bytes):
                return args.encode('utf-8')
            else:
                return args.decode('utf-8')


#===============================================================================
# Things related to monkey-patching
#===============================================================================
def is_python(path):
    single_quote, double_quote = _get_str_type_compatible(path, ["'", '"'])

    if path.endswith(single_quote) or path.endswith(double_quote):
        path = path[1:len(path) - 1]
    filename = os.path.basename(path).lower()
    for name in _get_str_type_compatible(filename, ['python', 'jython', 'pypy']):
        if filename.find(name) != -1:
            return True

    return False


def remove_quotes_from_args(args):
    if sys.platform == "win32":
        new_args = []

        for x in args:
            double_quote, two_double_quotes = _get_str_type_compatible(x, ['"', '""'])

            if x != two_double_quotes:
                if len(x) > 1 and x.startswith(double_quote) and x.endswith(double_quote):
                    x = x[1:-1]

            new_args.append(x)
        return new_args
    else:
        return args


def quote_arg_win32(arg):
    fix_type = lambda x: _get_str_type_compatible(arg, x)

    # See if we need to quote at all - empty strings need quoting, as do strings
    # with whitespace or quotes in them. Backslashes do not need quoting.
    if arg and not set(arg).intersection(fix_type(' "\t\n\v')):
        return arg

    # Per https://docs.microsoft.com/en-us/windows/desktop/api/shellapi/nf-shellapi-commandlinetoargvw,
    # the standard way to interpret arguments in double quotes is as follows:
    #
    #       2N backslashes followed by a quotation mark produce N backslashes followed by
    #       begin/end quote. This does not become part of the parsed argument, but toggles
    #       the "in quotes" mode.
    #
    #       2N+1 backslashes followed by a quotation mark again produce N backslashes followed
    #       by a quotation mark literal ("). This does not toggle the "in quotes" mode.
    #
    #       N backslashes not followed by a quotation mark simply produce N backslashes.
    #
    # This code needs to do the reverse transformation, thus:
    #
    #       N backslashes followed by " produce 2N+1 backslashes followed by "
    #
    #       N backslashes at the end (i.e. where the closing " goes) produce 2N backslashes.
    #
    #       N backslashes in any other position remain as is.

    arg = re.sub(fix_type(r'(\\*)\"'), fix_type(r'\1\1\\"'), arg)
    arg = re.sub(fix_type(r'(\\*)$'), fix_type(r'\1\1'), arg)
    return fix_type('"') + arg + fix_type('"')


def quote_args(args):
    if sys.platform == "win32":
        return list(map(quote_arg_win32, args))
    else:
        return args


def get_c_option_index(args):
    """
    Get index of "-c" argument and check if it's interpreter's option
    :param args: list of arguments
    :return: index of "-c" if it's an interpreter's option and -1 if it doesn't exist or program's option
    """
    for ind_c, arg in enumerate(args):
        if arg == _get_str_type_compatible(arg, '-c'):
            break
    else:
        return -1

    for i in range(1, ind_c):
        if not args[i].startswith(_get_str_type_compatible(args[i], '-')):
            # there is an arg without "-" before "-c", so it's not an interpreter's option
            return -1
    return ind_c


def patch_args(args, is_exec=False):
    '''
    :param list args:
        Arguments to patch.

    :param bool is_exec:
        If it's an exec, the current process will be replaced (this means we have
        to keep the same ppid).
    '''
    try:
        pydev_log.debug("Patching args: %s", args)
        original_args = args
        args = remove_quotes_from_args(args)

        from pydevd import SetupHolder
        new_args = []
        if len(args) == 0:
            return original_args

        if is_python(args[0]):
            ind_c = get_c_option_index(args)

            if ind_c != -1:
                host, port = _get_host_port()

                if port is not None:
                    new_args.extend(args)
                    new_args[ind_c + 1] = _get_python_c_args(host, port, ind_c, args, SetupHolder.setup)
                    return quote_args(new_args)
            else:
                # Check for Python ZIP Applications and don't patch the args for them.
                # Assumes the first non `-<flag>` argument is what we need to check.
                # There's probably a better way to determine this but it works for most cases.
                continue_next = False
                for i in range(1, len(args)):
                    if continue_next:
                        continue_next = False
                        continue

                    arg = args[i]
                    if arg.startswith(_get_str_type_compatible(arg, '-')):
                        # Skip the next arg too if this flag expects a value.
                        continue_next = arg in _get_str_type_compatible(arg, ['-m', '-W', '-X'])
                        continue

                    dot = _get_str_type_compatible(arg, '.')
                    extensions = _get_str_type_compatible(arg, ['zip', 'pyz', 'pyzw'])
                    if arg.rsplit(dot)[-1] in extensions:
                        pydev_log.debug('Executing a PyZip, returning')
                        return original_args
                    break

                new_args.append(args[0])
        else:
            pydev_log.debug("Process is not python, returning.")
            return original_args

        i = 1
        # Original args should be something as:
        # ['X:\\pysrc\\pydevd.py', '--multiprocess', '--print-in-debugger-startup',
        #  '--vm_type', 'python', '--client', '127.0.0.1', '--port', '56352', '--file', 'x:\\snippet1.py']
        from _pydevd_bundle.pydevd_command_line_handling import setup_to_argv
        original = setup_to_argv(
            _get_setup_updated_with_protocol_and_ppid(SetupHolder.setup, is_exec=is_exec)
        ) + ['--file']

        module_name = None
        m_flag = _get_str_type_compatible(args[i], '-m')
        while i < len(args):
            if args[i] == m_flag:
                # Always insert at pos == 1 (i.e.: pydevd "--module" --multiprocess ...)
                original.insert(1, '--module')
            elif args[i].startswith(m_flag):
                # Case where the user does: python -mmodule_name (using a single parameter).
                original.insert(1, '--module')
                module_name = args[i][2:]
            else:
                if args[i].startswith(_get_str_type_compatible(args[i], '-')):
                    new_args.append(args[i])
                else:
                    break
            i += 1

        # Note: undoing https://github.com/Elizaveta239/PyDev.Debugger/commit/053c9d6b1b455530bca267e7419a9f63bf51cddf
        # (i >= len(args) instead of i < len(args))
        # in practice it'd raise an exception here and would return original args, which is not what we want... providing
        # a proper fix for https://youtrack.jetbrains.com/issue/PY-9767 elsewhere.
        if i < len(args) and _is_managed_arg(args[i]):  # no need to add pydevd twice
            return original_args

        for x in original:
            new_args.append(x)
            if x == _get_str_type_compatible(x, '--file'):
                break

        if module_name is not None:
            new_args.append(module_name)

        while i < len(args):
            new_args.append(args[i])
            i += 1

        return quote_args(new_args)
    except:
        pydev_log.exception('Error patching args')
        return original_args


def str_to_args_windows(args):
    # See https://docs.microsoft.com/en-us/cpp/c-language/parsing-c-command-line-arguments.
    #
    # Implemetation ported from DebugPlugin.parseArgumentsWindows:
    # https://github.com/eclipse/eclipse.platform.debug/blob/master/org.eclipse.debug.core/core/org/eclipse/debug/core/DebugPlugin.java

    result = []

    DEFAULT = 0
    ARG = 1
    IN_DOUBLE_QUOTE = 2

    state = DEFAULT
    backslashes = 0
    buf = ''

    args_len = len(args)
    for i in xrange(args_len):
        ch = args[i]
        if (ch == '\\'):
            backslashes += 1
            continue
        elif (backslashes != 0):
            if ch == '"':
                while backslashes >= 2:
                    backslashes -= 2
                    buf += '\\'
                if (backslashes == 1):
                    if (state == DEFAULT):
                        state = ARG

                    buf += '"'
                    backslashes = 0
                    continue
                # else fall through to switch
            else:
                # false alarm, treat passed backslashes literally...
                if (state == DEFAULT):
                    state = ARG

                while backslashes > 0:
                    backslashes -= 1
                    buf += '\\'
                # fall through to switch
        if ch in (' ', '\t'):
            if (state == DEFAULT):
                # skip
                continue
            elif (state == ARG):
                state = DEFAULT
                result.append(buf)
                buf = ''
                continue

        if state in (DEFAULT, ARG):
            if ch == '"':
                state = IN_DOUBLE_QUOTE
            else:
                state = ARG
                buf += ch

        elif state == IN_DOUBLE_QUOTE:
            if ch == '"':
                if (i + 1 < args_len and args[i + 1] == '"'):
                    # Undocumented feature in Windows:
                    # Two consecutive double quotes inside a double-quoted argument are interpreted as
                    # a single double quote.
                    buf += '"'
                    i += 1
                else:
                    state = ARG
            else:
                buf += ch

        else:
            raise RuntimeError('Illegal condition')

    if len(buf) > 0 or state != DEFAULT:
        result.append(buf)

    return result


def patch_arg_str_win(arg_str):
    args = str_to_args_windows(arg_str)
    # Fix https://youtrack.jetbrains.com/issue/PY-9767 (args may be empty)
    if not args or not is_python(args[0]):
        return arg_str
    arg_str = ' '.join(patch_args(args))
    pydev_log.debug("New args: %s", arg_str)
    return arg_str


def monkey_patch_module(module, funcname, create_func):
    if hasattr(module, funcname):
        original_name = 'original_' + funcname
        if not hasattr(module, original_name):
            setattr(module, original_name, getattr(module, funcname))
            setattr(module, funcname, create_func(original_name))


def monkey_patch_os(funcname, create_func):
    monkey_patch_module(os, funcname, create_func)


def warn_multiproc():
    pass  # TODO: Provide logging as messages to the IDE.
    # pydev_log.error_once(
    #     "pydev debugger: New process is launching (breakpoints won't work in the new process).\n"
    #     "pydev debugger: To debug that process please enable 'Attach to subprocess automatically while debugging?' option in the debugger settings.\n")
    #


def create_warn_multiproc(original_name):

    def new_warn_multiproc(*args, **kwargs):
        import os

        warn_multiproc()

        return getattr(os, original_name)(*args, **kwargs)

    return new_warn_multiproc


def create_execl(original_name):

    def new_execl(path, *args):
        """
        os.execl(path, arg0, arg1, ...)
        os.execle(path, arg0, arg1, ..., env)
        os.execlp(file, arg0, arg1, ...)
        os.execlpe(file, arg0, arg1, ..., env)
        """
        if _get_apply_arg_patching():
            args = patch_args(args, is_exec=True)
            send_process_created_message()

        return getattr(os, original_name)(path, *args)

    return new_execl


def create_execv(original_name):

    def new_execv(path, args):
        """
        os.execv(path, args)
        os.execvp(file, args)
        """
        if _get_apply_arg_patching():
            args = patch_args(args, is_exec=True)
            send_process_created_message()

        return getattr(os, original_name)(path, args)

    return new_execv


def create_execve(original_name):
    """
    os.execve(path, args, env)
    os.execvpe(file, args, env)
    """

    def new_execve(path, args, env):
        if _get_apply_arg_patching():
            args = patch_args(args, is_exec=True)
            send_process_created_message()

        return getattr(os, original_name)(path, args, env)

    return new_execve


def create_spawnl(original_name):

    def new_spawnl(mode, path, *args):
        """
        os.spawnl(mode, path, arg0, arg1, ...)
        os.spawnlp(mode, file, arg0, arg1, ...)
        """
        if _get_apply_arg_patching():
            args = patch_args(args)
            send_process_created_message()

        return getattr(os, original_name)(mode, path, *args)

    return new_spawnl


def create_spawnv(original_name):

    def new_spawnv(mode, path, args):
        """
        os.spawnv(mode, path, args)
        os.spawnvp(mode, file, args)
        """
        if _get_apply_arg_patching():
            args = patch_args(args)
            send_process_created_message()

        return getattr(os, original_name)(mode, path, args)

    return new_spawnv


def create_spawnve(original_name):
    """
    os.spawnve(mode, path, args, env)
    os.spawnvpe(mode, file, args, env)
    """

    def new_spawnve(mode, path, args, env):
        if _get_apply_arg_patching():
            args = patch_args(args)
            send_process_created_message()

        return getattr(os, original_name)(mode, path, args, env)

    return new_spawnve


def create_posix_spawn(original_name):
    """
    os.posix_spawn(executable, args, env, **kwargs)
    """

    def new_posix_spawn(executable, args, env, **kwargs):
        if _get_apply_arg_patching():
            args = patch_args(args)
            send_process_created_message()

        return getattr(os, original_name)(executable, args, env, **kwargs)

    return new_posix_spawn


def create_fork_exec(original_name):
    """
    _posixsubprocess.fork_exec(args, executable_list, close_fds, ... (13 more))
    """

    def new_fork_exec(args, *other_args):
        import _posixsubprocess  # @UnresolvedImport
        if _get_apply_arg_patching():
            args = patch_args(args)
            send_process_created_message()

        return getattr(_posixsubprocess, original_name)(args, *other_args)

    return new_fork_exec


def create_warn_fork_exec(original_name):
    """
    _posixsubprocess.fork_exec(args, executable_list, close_fds, ... (13 more))
    """

    def new_warn_fork_exec(*args):
        try:
            import _posixsubprocess
            warn_multiproc()
            return getattr(_posixsubprocess, original_name)(*args)
        except:
            pass

    return new_warn_fork_exec


def create_CreateProcess(original_name):
    """
    CreateProcess(*args, **kwargs)
    """

    def new_CreateProcess(app_name, cmd_line, *args):
        try:
            import _subprocess
        except ImportError:
            import _winapi as _subprocess

        if _get_apply_arg_patching():
            cmd_line = patch_arg_str_win(cmd_line)
            send_process_created_message()

        return getattr(_subprocess, original_name)(app_name, cmd_line, *args)

    return new_CreateProcess


def create_CreateProcessWarnMultiproc(original_name):
    """
    CreateProcess(*args, **kwargs)
    """

    def new_CreateProcess(*args):
        try:
            import _subprocess
        except ImportError:
            import _winapi as _subprocess
        warn_multiproc()
        return getattr(_subprocess, original_name)(*args)

    return new_CreateProcess


def create_fork(original_name):

    def new_fork():
        # A simple fork will result in a new python process
        is_new_python_process = True
        frame = sys._getframe()

        apply_arg_patch = _get_apply_arg_patching()

        is_subprocess_fork = False
        while frame is not None:
            if frame.f_code.co_name == '_execute_child' and 'subprocess' in frame.f_code.co_filename:
                is_subprocess_fork = True
                # If we're actually in subprocess.Popen creating a child, it may
                # result in something which is not a Python process, (so, we
                # don't want to connect with it in the forked version).
                executable = frame.f_locals.get('executable')
                if executable is not None:
                    is_new_python_process = False
                    if is_python(executable):
                        is_new_python_process = True
                break

            frame = frame.f_back
        frame = None  # Just make sure we don't hold on to it.

        child_process = getattr(os, original_name)()  # fork
        if not child_process:
            if is_new_python_process:
                _on_forked_process(setup_tracing=apply_arg_patch and not is_subprocess_fork)
        else:
            if is_new_python_process:
                send_process_created_message()
        return child_process

    return new_fork


def send_process_created_message():
    py_db = get_global_debugger()
    if py_db is not None:
        py_db.send_process_created_message()


def patch_new_process_functions():
    # os.execl(path, arg0, arg1, ...)
    # os.execle(path, arg0, arg1, ..., env)
    # os.execlp(file, arg0, arg1, ...)
    # os.execlpe(file, arg0, arg1, ..., env)
    # os.execv(path, args)
    # os.execve(path, args, env)
    # os.execvp(file, args)
    # os.execvpe(file, args, env)
    monkey_patch_os('execl', create_execl)
    monkey_patch_os('execle', create_execl)
    monkey_patch_os('execlp', create_execl)
    monkey_patch_os('execlpe', create_execl)
    monkey_patch_os('execv', create_execv)
    monkey_patch_os('execve', create_execve)
    monkey_patch_os('execvp', create_execv)
    monkey_patch_os('execvpe', create_execve)

    # os.spawnl(mode, path, ...)
    # os.spawnle(mode, path, ..., env)
    # os.spawnlp(mode, file, ...)
    # os.spawnlpe(mode, file, ..., env)
    # os.spawnv(mode, path, args)
    # os.spawnve(mode, path, args, env)
    # os.spawnvp(mode, file, args)
    # os.spawnvpe(mode, file, args, env)

    monkey_patch_os('spawnl', create_spawnl)
    monkey_patch_os('spawnle', create_spawnl)
    monkey_patch_os('spawnlp', create_spawnl)
    monkey_patch_os('spawnlpe', create_spawnl)
    monkey_patch_os('spawnv', create_spawnv)
    monkey_patch_os('spawnve', create_spawnve)
    monkey_patch_os('spawnvp', create_spawnv)
    monkey_patch_os('spawnvpe', create_spawnve)
    monkey_patch_os('posix_spawn', create_posix_spawn)

    if not IS_JYTHON:
        if not IS_WINDOWS:
            monkey_patch_os('fork', create_fork)
            try:
                import _posixsubprocess
                monkey_patch_module(_posixsubprocess, 'fork_exec', create_fork_exec)
            except ImportError:
                pass
        else:
            # Windows
            try:
                import _subprocess
            except ImportError:
                import _winapi as _subprocess
            monkey_patch_module(_subprocess, 'CreateProcess', create_CreateProcess)


def patch_new_process_functions_with_warning():
    monkey_patch_os('execl', create_warn_multiproc)
    monkey_patch_os('execle', create_warn_multiproc)
    monkey_patch_os('execlp', create_warn_multiproc)
    monkey_patch_os('execlpe', create_warn_multiproc)
    monkey_patch_os('execv', create_warn_multiproc)
    monkey_patch_os('execve', create_warn_multiproc)
    monkey_patch_os('execvp', create_warn_multiproc)
    monkey_patch_os('execvpe', create_warn_multiproc)
    monkey_patch_os('spawnl', create_warn_multiproc)
    monkey_patch_os('spawnle', create_warn_multiproc)
    monkey_patch_os('spawnlp', create_warn_multiproc)
    monkey_patch_os('spawnlpe', create_warn_multiproc)
    monkey_patch_os('spawnv', create_warn_multiproc)
    monkey_patch_os('spawnve', create_warn_multiproc)
    monkey_patch_os('spawnvp', create_warn_multiproc)
    monkey_patch_os('spawnvpe', create_warn_multiproc)
    monkey_patch_os('posix_spawn', create_warn_multiproc)

    if not IS_JYTHON:
        if not IS_WINDOWS:
            monkey_patch_os('fork', create_warn_multiproc)
            try:
                import _posixsubprocess
                monkey_patch_module(_posixsubprocess, 'fork_exec', create_warn_fork_exec)
            except ImportError:
                pass
        else:
            # Windows
            try:
                import _subprocess
            except ImportError:
                import _winapi as _subprocess
            monkey_patch_module(_subprocess, 'CreateProcess', create_CreateProcessWarnMultiproc)


class _NewThreadStartupWithTrace:

    def __init__(self, original_func, args, kwargs):
        self.original_func = original_func
        self.args = args
        self.kwargs = kwargs

    def __call__(self):
        # We monkey-patch the thread creation so that this function is called in the new thread. At this point
        # we notify of its creation and start tracing it.
        py_db = get_global_debugger()

        thread_id = None
        if py_db is not None:
            # Note: if this is a thread from threading.py, we're too early in the boostrap process (because we mocked
            # the start_new_thread internal machinery and thread._bootstrap has not finished), so, the code below needs
            # to make sure that we use the current thread bound to the original function and not use
            # threading.currentThread() unless we're sure it's a dummy thread.
            t = getattr(self.original_func, '__self__', getattr(self.original_func, 'im_self', None))
            if not isinstance(t, threading.Thread):
                # This is not a threading.Thread but a Dummy thread (so, get it as a dummy thread using
                # currentThread).
                t = threading.currentThread()

            if not getattr(t, 'is_pydev_daemon_thread', False):
                thread_id = get_current_thread_id(t)
                py_db.notify_thread_created(thread_id, t)
                _on_set_trace_for_new_thread(py_db)

            if getattr(py_db, 'thread_analyser', None) is not None:
                try:
                    from pydevd_concurrency_analyser.pydevd_concurrency_logger import log_new_thread
                    log_new_thread(py_db, t)
                except:
                    sys.stderr.write("Failed to detect new thread for visualization")
        try:
            ret = self.original_func(*self.args, **self.kwargs)
        finally:
            if thread_id is not None:
                py_db.notify_thread_not_alive(thread_id)

        return ret


class _NewThreadStartupWithoutTrace:

    def __init__(self, original_func, args, kwargs):
        self.original_func = original_func
        self.args = args
        self.kwargs = kwargs

    def __call__(self):
        return self.original_func(*self.args, **self.kwargs)


_UseNewThreadStartup = _NewThreadStartupWithTrace


def _get_threading_modules_to_patch():
    threading_modules_to_patch = []

    try:
        import thread as _thread
    except:
        import _thread
    threading_modules_to_patch.append(_thread)
    threading_modules_to_patch.append(threading)

    return threading_modules_to_patch


threading_modules_to_patch = _get_threading_modules_to_patch()


def patch_thread_module(thread_module):

    if getattr(thread_module, '_original_start_new_thread', None) is None:
        if thread_module is threading:
            if not hasattr(thread_module, '_start_new_thread'):
                return  # Jython doesn't have it.
            _original_start_new_thread = thread_module._original_start_new_thread = thread_module._start_new_thread
        else:
            _original_start_new_thread = thread_module._original_start_new_thread = thread_module.start_new_thread
    else:
        _original_start_new_thread = thread_module._original_start_new_thread

    class ClassWithPydevStartNewThread:

        def pydev_start_new_thread(self, function, args=(), kwargs={}):
            '''
            We need to replace the original thread_module.start_new_thread with this function so that threads started
            through it and not through the threading module are properly traced.
            '''
            return _original_start_new_thread(_UseNewThreadStartup(function, args, kwargs), ())

    # This is a hack for the situation where the thread_module.start_new_thread is declared inside a class, such as the one below
    # class F(object):
    #    start_new_thread = thread_module.start_new_thread
    #
    #    def start_it(self):
    #        self.start_new_thread(self.function, args, kwargs)
    # So, if it's an already bound method, calling self.start_new_thread won't really receive a different 'self' -- it
    # does work in the default case because in builtins self isn't passed either.
    pydev_start_new_thread = ClassWithPydevStartNewThread().pydev_start_new_thread

    try:
        # We need to replace the original thread_module.start_new_thread with this function so that threads started through
        # it and not through the threading module are properly traced.
        if thread_module is threading:
            thread_module._start_new_thread = pydev_start_new_thread
        else:
            thread_module.start_new_thread = pydev_start_new_thread
            thread_module.start_new = pydev_start_new_thread
    except:
        pass


def patch_thread_modules():
    for t in threading_modules_to_patch:
        patch_thread_module(t)


def undo_patch_thread_modules():
    for t in threading_modules_to_patch:
        try:
            t.start_new_thread = t._original_start_new_thread
        except:
            pass

        try:
            t.start_new = t._original_start_new_thread
        except:
            pass

        try:
            t._start_new_thread = t._original_start_new_thread
        except:
            pass


def disable_trace_thread_modules():
    '''
    Can be used to temporarily stop tracing threads created with thread.start_new_thread.
    '''
    global _UseNewThreadStartup
    _UseNewThreadStartup = _NewThreadStartupWithoutTrace


def enable_trace_thread_modules():
    '''
    Can be used to start tracing threads created with thread.start_new_thread again.
    '''
    global _UseNewThreadStartup
    _UseNewThreadStartup = _NewThreadStartupWithTrace


def get_original_start_new_thread(threading_module):
    try:
        return threading_module._original_start_new_thread
    except:
        return threading_module.start_new_thread
