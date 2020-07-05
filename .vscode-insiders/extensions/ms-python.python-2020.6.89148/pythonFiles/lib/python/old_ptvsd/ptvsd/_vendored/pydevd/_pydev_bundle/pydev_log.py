from _pydevd_bundle.pydevd_constants import DebugInfoHolder, SHOW_COMPILE_CYTHON_COMMAND_LINE
from _pydev_imps._pydev_saved_modules import threading
from contextlib import contextmanager
import traceback
import os
import sys
currentThread = threading.currentThread

WARN_ONCE_MAP = {}


@contextmanager
def log_context(trace_level, stream):
    '''
    To be used to temporarily change the logging settings.
    '''
    original_trace_level = DebugInfoHolder.DEBUG_TRACE_LEVEL
    original_stream = DebugInfoHolder.DEBUG_STREAM

    DebugInfoHolder.DEBUG_TRACE_LEVEL = trace_level
    DebugInfoHolder.DEBUG_STREAM = stream
    try:
        yield
    finally:
        DebugInfoHolder.DEBUG_TRACE_LEVEL = original_trace_level
        DebugInfoHolder.DEBUG_STREAM = original_stream


def _pydevd_log(level, msg, *args):
    '''
    Levels are:

    0 most serious warnings/errors (always printed)
    1 warnings/significant events
    2 informational trace
    3 verbose mode
    '''
    if level <= DebugInfoHolder.DEBUG_TRACE_LEVEL:
        # yes, we can have errors printing if the console of the program has been finished (and we're still trying to print something)
        try:
            try:
                if args:
                    msg = msg % args
            except:
                msg = '%s - %s' % (msg, args)
            DebugInfoHolder.DEBUG_STREAM.write('%s\n' % (msg,))
            DebugInfoHolder.DEBUG_STREAM.flush()
        except:
            pass
        return True


def _pydevd_log_exception(msg='', *args):
    if msg or args:
        _pydevd_log(0, msg, *args)
    try:
        traceback.print_exc(file=DebugInfoHolder.DEBUG_STREAM)
        DebugInfoHolder.DEBUG_STREAM.flush()
    except:
        raise


def verbose(msg, *args):
    if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 3:
        _pydevd_log(3, msg, *args)


def debug(msg, *args):
    if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 2:
        _pydevd_log(2, msg, *args)


def info(msg, *args):
    if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 1:
        _pydevd_log(1, msg, *args)


warn = info


def critical(msg, *args):
    _pydevd_log(0, msg, *args)


def exception(msg='', *args):
    try:
        _pydevd_log_exception(msg, *args)
    except:
        pass  # Should never fail (even at interpreter shutdown).


error = exception


def error_once(msg, *args):
    try:
        if args:
            message = msg % args
        else:
            message = str(msg)
    except:
        message = '%s - %s' % (msg, args)

    if message not in WARN_ONCE_MAP:
        WARN_ONCE_MAP[message] = True
        critical(message)


def debug_once(msg, *args):
    if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 3:
        error_once(msg, *args)


def show_compile_cython_command_line():
    if SHOW_COMPILE_CYTHON_COMMAND_LINE:
        dirname = os.path.dirname(os.path.dirname(__file__))
        error_once("warning: Debugger speedups using cython not found. Run '\"%s\" \"%s\" build_ext --inplace' to build.",
            sys.executable, os.path.join(dirname, 'setup_cython.py'))

