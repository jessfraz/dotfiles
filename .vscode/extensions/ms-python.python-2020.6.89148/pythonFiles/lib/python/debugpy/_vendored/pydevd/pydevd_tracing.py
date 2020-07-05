from _pydevd_bundle.pydevd_constants import get_frame, IS_CPYTHON, IS_64BIT_PROCESS, IS_WINDOWS, \
    IS_LINUX, IS_MAC, IS_PY2, DebugInfoHolder, ForkSafeLock, LOAD_NATIVE_LIB_FLAG, \
    ENV_FALSE_LOWER_VALUES
from _pydev_imps._pydev_saved_modules import thread, threading
from _pydev_bundle import pydev_log, pydev_monkey
from os.path import os
try:
    import ctypes
except ImportError:
    ctypes = None

try:
    import cStringIO as StringIO  # may not always be available @UnusedImport
except:
    try:
        import StringIO  # @Reimport
    except:
        import io as StringIO

import sys  # @Reimport
import traceback

_original_settrace = sys.settrace


class TracingFunctionHolder:
    '''This class exists just to keep some variables (so that we don't keep them in the global namespace).
    '''
    _original_tracing = None
    _warn = True
    _lock = ForkSafeLock()
    _traceback_limit = 1
    _warnings_shown = {}


def get_exception_traceback_str():
    exc_info = sys.exc_info()
    s = StringIO.StringIO()
    traceback.print_exception(exc_info[0], exc_info[1], exc_info[2], file=s)
    return s.getvalue()


def _get_stack_str(frame):

    msg = '\nIf this is needed, please check: ' + \
          '\nhttp://pydev.blogspot.com/2007/06/why-cant-pydev-debugger-work-with.html' + \
          '\nto see how to restore the debug tracing back correctly.\n'

    if TracingFunctionHolder._traceback_limit:
        s = StringIO.StringIO()
        s.write('Call Location:\n')
        traceback.print_stack(f=frame, limit=TracingFunctionHolder._traceback_limit, file=s)
        msg = msg + s.getvalue()

    return msg


def _internal_set_trace(tracing_func):
    if TracingFunctionHolder._warn:
        frame = get_frame()
        if frame is not None and frame.f_back is not None:
            filename = frame.f_back.f_code.co_filename.lower()
            if not filename.endswith('threading.py') and not filename.endswith('pydevd_tracing.py'):

                message = \
                '\nPYDEV DEBUGGER WARNING:' + \
                '\nsys.settrace() should not be used when the debugger is being used.' + \
                '\nThis may cause the debugger to stop working correctly.' + \
                '%s' % _get_stack_str(frame.f_back)

                if message not in TracingFunctionHolder._warnings_shown:
                    # only warn about each message once...
                    TracingFunctionHolder._warnings_shown[message] = 1
                    sys.stderr.write('%s\n' % (message,))
                    sys.stderr.flush()

    if TracingFunctionHolder._original_tracing:
        TracingFunctionHolder._original_tracing(tracing_func)


def SetTrace(tracing_func):
    if TracingFunctionHolder._original_tracing is None:
        # This may happen before replace_sys_set_trace_func is called.
        sys.settrace(tracing_func)
        return

    try:
        # Note: don't use context-manager here (must use acquire()/release()
        # due to having an additional trace call on `ForkSafeLock`
        # -- see: ForkSafeLock for more details).
        TracingFunctionHolder._lock.acquire()
        TracingFunctionHolder._warn = False
        _internal_set_trace(tracing_func)
        TracingFunctionHolder._warn = True
    finally:
        TracingFunctionHolder._lock.release()


def replace_sys_set_trace_func():
    if TracingFunctionHolder._original_tracing is None:
        TracingFunctionHolder._original_tracing = sys.settrace
        sys.settrace = _internal_set_trace


def restore_sys_set_trace_func():
    if TracingFunctionHolder._original_tracing is not None:
        sys.settrace = TracingFunctionHolder._original_tracing
        TracingFunctionHolder._original_tracing = None


def load_python_helper_lib():
    if not IS_CPYTHON or ctypes is None or sys.version_info[:2] > (3, 8) or hasattr(sys, 'gettotalrefcount') or LOAD_NATIVE_LIB_FLAG in ENV_FALSE_LOWER_VALUES:
        return None

    if IS_WINDOWS:
        if IS_64BIT_PROCESS:
            suffix = 'amd64'
        else:
            suffix = 'x86'

        filename = os.path.join(os.path.dirname(__file__), 'pydevd_attach_to_process', 'attach_%s.dll' % (suffix,))

    elif IS_LINUX:
        if IS_64BIT_PROCESS:
            suffix = 'amd64'
        else:
            suffix = 'x86'

        filename = os.path.join(os.path.dirname(__file__), 'pydevd_attach_to_process', 'attach_linux_%s.so' % (suffix,))

    elif IS_MAC:
        if IS_64BIT_PROCESS:
            suffix = 'x86_64.dylib'
        else:
            suffix = 'x86.dylib'

        filename = os.path.join(os.path.dirname(__file__), 'pydevd_attach_to_process', 'attach_%s' % (suffix,))

    else:
        pydev_log.info('Unable to set trace to all threads in platform: %s', sys.platform)
        return None

    if not os.path.exists(filename):
        pydev_log.critical('Expected: %s to exist.', filename)
        return None

    try:
        # Load as pydll so that we don't release the gil.
        lib = ctypes.pydll.LoadLibrary(filename)
        return lib
    except:
        if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 1:
            # Only show message if tracing is on (we don't have pre-compiled
            # binaries for all architectures -- i.e.: ARM).
            pydev_log.exception('Error loading: %s', filename)
        return None


def set_trace_to_threads(tracing_func):
    lib = load_python_helper_lib()
    if lib is None:  # This is the case if it's not CPython.
        pydev_log.info('Unable to load helper lib to set tracing to all threads (unsupported python vm).')
        return -1

    pydev_log.info('Successfully Loaded helper lib to set tracing to all threads.')

    ret = 0
    set_trace_func = TracingFunctionHolder._original_tracing or sys.settrace

    # Note: use sys._current_frames() keys to get the thread ids because it'll return
    # thread ids created in C/C++ where there's user code running, unlike the APIs
    # from the threading module which see only threads created through it (unless
    # a call for threading.current_thread() was previously done in that thread,
    # in which case a dummy thread would've been created for it).
    thread_idents = set(sys._current_frames().keys())
    thread_idents = thread_idents.difference(
        # Ignore pydevd threads.
        set(t.ident for t in threading.enumerate() if getattr(t, 'pydev_do_not_trace', False))
    )

    curr_ident = thread.get_ident()
    curr_thread = threading._active.get(curr_ident)

    for thread_ident in thread_idents:
        # If that thread is not available in the threading module we also need to create a
        # dummy thread for it (otherwise it'll be invisible to the debugger).
        if thread_ident not in threading._active:

            class _DummyThread(threading._DummyThread):

                def _set_ident(self):
                    # Note: Hack to set the thread ident that we want.
                    if IS_PY2:
                        self._Thread__ident = thread_ident
                    else:
                        self._ident = thread_ident

            t = _DummyThread()
            # Reset to the base class (don't expose our own version of the class).
            t.__class__ = threading._DummyThread

            with threading._active_limbo_lock:
                # On Py2 it'll put in active getting the current indent, not using the
                # ident that was set, so, we have to update it (should be harmless on Py3
                # so, do it always).
                threading._active[thread_ident] = t
                threading._active[curr_ident] = curr_thread

                if t.ident != thread_ident:
                    # Check if it actually worked.
                    pydev_log.critical('pydevd: creation of _DummyThread with fixed thread ident did not succeed.')

        # Some (ptvsd) tests failed because of this, so, leave it always disabled for now.
        # show_debug_info = 1 if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 1 else 0
        show_debug_info = 0

        # Hack to increase _Py_TracingPossible.
        # See comments on py_custom_pyeval_settrace.hpp
        proceed = thread.allocate_lock()
        proceed.acquire()

        def dummy_trace(frame, event, arg):
            return dummy_trace

        def increase_tracing_count():
            SetTrace(dummy_trace)
            proceed.release()

        start_new_thread = pydev_monkey.get_original_start_new_thread(thread)
        start_new_thread(increase_tracing_count, ())
        proceed.acquire()  # Only proceed after the release() is done.
        proceed = None

        result = lib.AttachDebuggerTracing(
            ctypes.c_int(show_debug_info),
            ctypes.py_object(set_trace_func),
            ctypes.py_object(tracing_func),
            ctypes.c_uint(thread_ident),
            ctypes.py_object(None),
        )
        if result != 0:
            pydev_log.info('Unable to set tracing for existing thread. Result: %s', result)
            ret = result

    return ret

