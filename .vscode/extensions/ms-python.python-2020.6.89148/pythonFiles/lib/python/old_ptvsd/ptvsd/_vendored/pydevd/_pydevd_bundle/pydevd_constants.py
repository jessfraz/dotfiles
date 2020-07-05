'''
This module holds the constants used for specifying the states of the debugger.
'''
from __future__ import nested_scopes
import platform

STATE_RUN = 1
STATE_SUSPEND = 2

PYTHON_SUSPEND = 1
DJANGO_SUSPEND = 2
JINJA2_SUSPEND = 3

try:
    int_types = (int, long)
except NameError:
    int_types = (int,)

import sys  # Note: the sys import must be here anyways (others depend on it)


class DebugInfoHolder:
    # we have to put it here because it can be set through the command line (so, the
    # already imported references would not have it).

    # General information
    DEBUG_TRACE_LEVEL = 0  # 0 = critical, 1 = info, 2 = debug, 3 = verbose
    DEBUG_STREAM = sys.stderr

    # Flags to debug specific points of the code.
    DEBUG_RECORD_SOCKET_READS = False
    DEBUG_TRACE_BREAKPOINTS = -1


IS_CPYTHON = platform.python_implementation() == 'CPython'

# Hold a reference to the original _getframe (because psyco will change that as soon as it's imported)
IS_IRONPYTHON = sys.platform == 'cli'
try:
    get_frame = sys._getframe
    if IS_IRONPYTHON:

        def get_frame():
            try:
                return sys._getframe()
            except ValueError:
                pass

except AttributeError:

    def get_frame():
        raise AssertionError('sys._getframe not available (possible causes: enable -X:Frames on IronPython?)')

# Used to determine the maximum size of each variable passed to eclipse -- having a big value here may make
# the communication slower -- as the variables are being gathered lazily in the latest version of eclipse,
# this value was raised from 200 to 1000.
MAXIMUM_VARIABLE_REPRESENTATION_SIZE = 1000
# Prefix for saving functions return values in locals
RETURN_VALUES_DICT = '__pydevd_ret_val_dict'

import os

from _pydevd_bundle import pydevd_vm_type

# Constant detects when running on Jython/windows properly later on.
IS_WINDOWS = sys.platform == 'win32'
IS_LINUX = sys.platform in ('linux', 'linux2')
IS_MAC = sys.platform == 'darwin'

IS_64BIT_PROCESS = sys.maxsize > (2 ** 32)

IS_JYTHON = pydevd_vm_type.get_vm_type() == pydevd_vm_type.PydevdVmType.JYTHON
IS_JYTH_LESS25 = False

if IS_JYTHON:
    import java.lang.System  # @UnresolvedImport
    IS_WINDOWS = java.lang.System.getProperty("os.name").lower().startswith("windows")
    if sys.version_info[0] == 2 and sys.version_info[1] < 5:
        IS_JYTH_LESS25 = True

IS_PYTHON_STACKLESS = "stackless" in sys.version.lower()
CYTHON_SUPPORTED = False

try:
    import platform
    python_implementation = platform.python_implementation()
except:
    pass
else:
    if python_implementation == 'CPython' and not IS_PYTHON_STACKLESS:
        # Only available for CPython!
        if (
            (sys.version_info[0] == 2 and sys.version_info[1] >= 6)
            or (sys.version_info[0] == 3 and sys.version_info[1] >= 3)
            or (sys.version_info[0] > 3)
            ):
            # Supported in 2.6,2.7 or 3.3 onwards (32 or 64)
            CYTHON_SUPPORTED = True

#=======================================================================================================================
# Python 3?
#=======================================================================================================================
IS_PY3K = False
IS_PY34_OR_GREATER = False
IS_PY36_OR_GREATER = False
IS_PY37_OR_GREATER = False
IS_PY2 = True
IS_PY27 = False
IS_PY24 = False
try:
    if sys.version_info[0] >= 3:
        IS_PY3K = True
        IS_PY2 = False
        IS_PY34_OR_GREATER = sys.version_info >= (3, 4)
        IS_PY36_OR_GREATER = sys.version_info >= (3, 6)
        IS_PY37_OR_GREATER = sys.version_info >= (3, 7)
    elif sys.version_info[0] == 2 and sys.version_info[1] == 7:
        IS_PY27 = True
    elif sys.version_info[0] == 2 and sys.version_info[1] == 4:
        IS_PY24 = True
except AttributeError:
    pass  # Not all versions have sys.version_info


def version_str(v):
    return '.'.join((str(x) for x in v[:3])) + ''.join((str(x) for x in v[3:]))


PY_VERSION_STR = version_str(sys.version_info)
try:
    PY_IMPL_VERSION_STR = version_str(sys.implementation.version)
except AttributeError:
    PY_IMPL_VERSION_STR = ''

try:
    PY_IMPL_NAME = sys.implementation.name
except AttributeError:
    PY_IMPL_NAME = ''

try:
    SUPPORT_GEVENT = os.getenv('GEVENT_SUPPORT', 'False') == 'True'
except:
    # Jython 2.1 doesn't accept that construct
    SUPPORT_GEVENT = False

# At the moment gevent supports Python >= 2.6 and Python >= 3.3
USE_LIB_COPY = SUPPORT_GEVENT and \
               ((not IS_PY3K and sys.version_info[1] >= 6) or
                (IS_PY3K and sys.version_info[1] >= 3))

INTERACTIVE_MODE_AVAILABLE = sys.platform in ('darwin', 'win32') or os.getenv('DISPLAY') is not None

SHOW_COMPILE_CYTHON_COMMAND_LINE = os.getenv('PYDEVD_SHOW_COMPILE_CYTHON_COMMAND_LINE', 'False') == 'True'

LOAD_VALUES_ASYNC = os.getenv('PYDEVD_LOAD_VALUES_ASYNC', 'False') == 'True'
DEFAULT_VALUE = "__pydevd_value_async"
ASYNC_EVAL_TIMEOUT_SEC = 60
NEXT_VALUE_SEPARATOR = "__pydev_val__"
BUILTINS_MODULE_NAME = '__builtin__' if IS_PY2 else 'builtins'
SHOW_DEBUG_INFO_ENV = os.getenv('PYCHARM_DEBUG') == 'True' or os.getenv('PYDEV_DEBUG') == 'True' or os.getenv('PYDEVD_DEBUG') == 'True'
PYDEVD_DEBUG_FILE = os.getenv('PYDEVD_DEBUG_FILE')

if SHOW_DEBUG_INFO_ENV:
    # show debug info before the debugger start
    DebugInfoHolder.DEBUG_RECORD_SOCKET_READS = True
    DebugInfoHolder.DEBUG_TRACE_LEVEL = 3
    DebugInfoHolder.DEBUG_TRACE_BREAKPOINTS = 1

    if PYDEVD_DEBUG_FILE:
        DebugInfoHolder.DEBUG_STREAM = open(PYDEVD_DEBUG_FILE, 'w')


def protect_libraries_from_patching():
    """
    In this function we delete some modules from `sys.modules` dictionary and import them again inside
      `_pydev_saved_modules` in order to save their original copies there. After that we can use these
      saved modules within the debugger to protect them from patching by external libraries (e.g. gevent).
    """
    patched = ['threading', 'thread', '_thread', 'time', 'socket', 'Queue', 'queue', 'select',
               'xmlrpclib', 'SimpleXMLRPCServer', 'BaseHTTPServer', 'SocketServer',
               'xmlrpc.client', 'xmlrpc.server', 'http.server', 'socketserver']

    for name in patched:
        try:
            __import__(name)
        except:
            pass

    patched_modules = dict([(k, v) for k, v in sys.modules.items()
                            if k in patched])

    for name in patched_modules:
        del sys.modules[name]

    # import for side effects
    import _pydev_imps._pydev_saved_modules

    for name in patched_modules:
        sys.modules[name] = patched_modules[name]


if USE_LIB_COPY:
    protect_libraries_from_patching()

from _pydev_imps._pydev_saved_modules import thread
_thread_id_lock = thread.allocate_lock()
thread_get_ident = thread.get_ident

if IS_PY3K:

    def dict_keys(d):
        return list(d.keys())

    def dict_values(d):
        return list(d.values())

    dict_iter_values = dict.values

    def dict_iter_items(d):
        return d.items()

    def dict_items(d):
        return list(d.items())

else:
    dict_keys = None
    try:
        dict_keys = dict.keys
    except:
        pass

    if IS_JYTHON or not dict_keys:

        def dict_keys(d):
            return d.keys()

    try:
        dict_iter_values = dict.itervalues
    except:
        try:
            dict_iter_values = dict.values  # Older versions don't have the itervalues
        except:

            def dict_iter_values(d):
                return d.values()

    try:
        dict_values = dict.values
    except:

        def dict_values(d):
            return d.values()

    def dict_iter_items(d):
        try:
            return d.iteritems()
        except:
            return d.items()

    def dict_items(d):
        return d.items()

try:
    xrange = xrange
except:
    # Python 3k does not have it
    xrange = range

try:
    import itertools
    izip = itertools.izip
except:
    izip = zip

try:
    from StringIO import StringIO
except:
    from io import StringIO

if IS_JYTHON:

    def NO_FTRACE(frame, event, arg):
        return None

else:
    _curr_trace = sys.gettrace()

    # Set a temporary trace which does nothing for us to test (otherwise setting frame.f_trace has no
    # effect).
    def _temp_trace(frame, event, arg):
        return None

    sys.settrace(_temp_trace)

    def _check_ftrace_set_none():
        '''
        Will throw an error when executing a line event
        '''
        sys._getframe().f_trace = None
        _line_event = 1
        _line_event = 2

    try:
        _check_ftrace_set_none()

        def NO_FTRACE(frame, event, arg):
            frame.f_trace = None
            return None

    except TypeError:

        def NO_FTRACE(frame, event, arg):
            # In Python <= 2.6 and <= 3.4, if we're tracing a method, frame.f_trace may not be set
            # to None, it must always be set to a tracing function.
            # See: tests_python.test_tracing_gotchas.test_tracing_gotchas
            #
            # Note: Python 2.7 sometimes works and sometimes it doesn't depending on the minor
            # version because of https://bugs.python.org/issue20041 (although bug reports didn't
            # include the minor version, so, mark for any Python 2.7 as I'm not completely sure
            # the fix in later 2.7 versions is the same one we're dealing with).
            return None

    sys.settrace(None)


#=======================================================================================================================
# get_pid
#=======================================================================================================================
def get_pid():
    try:
        return os.getpid()
    except AttributeError:
        try:
            # Jython does not have it!
            import java.lang.management.ManagementFactory  # @UnresolvedImport -- just for jython
            pid = java.lang.management.ManagementFactory.getRuntimeMXBean().getName()
            return pid.replace('@', '_')
        except:
            # ok, no pid available (will be unable to debug multiple processes)
            return '000001'


def clear_cached_thread_id(thread):
    with _thread_id_lock:
        try:
            if thread.__pydevd_id__ != 'console_main':
                # The console_main is a special thread id used in the console and its id should never be reset
                # (otherwise we may no longer be able to get its variables -- see: https://www.brainwy.com/tracker/PyDev/776).
                del thread.__pydevd_id__
        except AttributeError:
            pass


# Don't let threads be collected (so that id(thread) is guaranteed to be unique).
_thread_id_to_thread_found = {}


def _get_or_compute_thread_id_with_lock(thread, is_current_thread):
    with _thread_id_lock:
        # We do a new check with the lock in place just to be sure that nothing changed
        tid = getattr(thread, '__pydevd_id__', None)
        if tid is not None:
            return tid

        _thread_id_to_thread_found[id(thread)] = thread

        # Note: don't use thread.ident because a new thread may have the
        # same id from an old thread.
        pid = get_pid()
        tid = 'pid_%s_id_%s' % (pid, id(thread))

        thread.__pydevd_id__ = tid

    return tid


def get_current_thread_id(thread):
    '''
    Note: the difference from get_current_thread_id to get_thread_id is that
    for the current thread we can get the thread id while the thread.ident
    is still not set in the Thread instance.
    '''
    try:
        # Fast path without getting lock.
        tid = thread.__pydevd_id__
        if tid is None:
            # Fix for https://www.brainwy.com/tracker/PyDev/645
            # if __pydevd_id__ is None, recalculate it... also, use an heuristic
            # that gives us always the same id for the thread (using thread.ident or id(thread)).
            raise AttributeError()
    except AttributeError:
        tid = _get_or_compute_thread_id_with_lock(thread, is_current_thread=True)

    return tid


def get_thread_id(thread):
    try:
        # Fast path without getting lock.
        tid = thread.__pydevd_id__
        if tid is None:
            # Fix for https://www.brainwy.com/tracker/PyDev/645
            # if __pydevd_id__ is None, recalculate it... also, use an heuristic
            # that gives us always the same id for the thread (using thread.ident or id(thread)).
            raise AttributeError()
    except AttributeError:
        tid = _get_or_compute_thread_id_with_lock(thread, is_current_thread=False)

    return tid


def set_thread_id(thread, thread_id):
    with _thread_id_lock:
        thread.__pydevd_id__ = thread_id


#=======================================================================================================================
# Null
#=======================================================================================================================
class Null:
    """
    Gotten from: http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/68205
    """

    def __init__(self, *args, **kwargs):
        return None

    def __call__(self, *args, **kwargs):
        return self

    def __enter__(self, *args, **kwargs):
        return self

    def __exit__(self, *args, **kwargs):
        return self

    def __getattr__(self, mname):
        if len(mname) > 4 and mname[:2] == '__' and mname[-2:] == '__':
            # Don't pretend to implement special method names.
            raise AttributeError(mname)
        return self

    def __setattr__(self, name, value):
        return self

    def __delattr__(self, name):
        return self

    def __repr__(self):
        return "<Null>"

    def __str__(self):
        return "Null"

    def __len__(self):
        return 0

    def __getitem__(self):
        return self

    def __setitem__(self, *args, **kwargs):
        pass

    def write(self, *args, **kwargs):
        pass

    def __nonzero__(self):
        return 0

    def __iter__(self):
        return iter(())


# Default instance
NULL = Null()


def call_only_once(func):
    '''
    To be used as a decorator

    @call_only_once
    def func():
        print 'Calling func only this time'

    Actually, in PyDev it must be called as:

    func = call_only_once(func) to support older versions of Python.
    '''

    def new_func(*args, **kwargs):
        if not new_func._called:
            new_func._called = True
            return func(*args, **kwargs)

    new_func._called = False
    return new_func


# Protocol where each line is a new message (text is quoted to prevent new lines).
# payload is xml
QUOTED_LINE_PROTOCOL = 'quoted-line'

# Uses http protocol to provide a new message.
# i.e.: Content-Length:xxx\r\n\r\npayload
# payload is xml
HTTP_PROTOCOL = 'http'

# Message is sent without any header.
# payload is json
JSON_PROTOCOL = 'json'

# Same header as the HTTP_PROTOCOL
# payload is json
HTTP_JSON_PROTOCOL = 'http_json'


class _GlobalSettings:
    protocol = QUOTED_LINE_PROTOCOL


def set_protocol(protocol):
    expected = (HTTP_PROTOCOL, QUOTED_LINE_PROTOCOL, JSON_PROTOCOL, HTTP_JSON_PROTOCOL)
    assert protocol in expected, 'Protocol (%s) should be one of: %s' % (
        protocol, expected)

    _GlobalSettings.protocol = protocol


def get_protocol():
    return _GlobalSettings.protocol


def is_json_protocol():
    return _GlobalSettings.protocol in (JSON_PROTOCOL, HTTP_JSON_PROTOCOL)


class GlobalDebuggerHolder:
    '''
        Holder for the global debugger.
    '''
    global_dbg = None  # Note: don't rename (the name is used in our attach to process)


def get_global_debugger():
    return GlobalDebuggerHolder.global_dbg


GetGlobalDebugger = get_global_debugger  # Backward-compatibility


def set_global_debugger(dbg):
    GlobalDebuggerHolder.global_dbg = dbg


if __name__ == '__main__':
    if Null():
        sys.stdout.write('here\n')

