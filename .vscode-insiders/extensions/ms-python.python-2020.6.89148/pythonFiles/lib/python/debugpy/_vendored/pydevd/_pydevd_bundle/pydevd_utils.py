from __future__ import nested_scopes
import traceback
import warnings
from _pydev_bundle import pydev_log

try:
    from urllib import quote
except:
    from urllib.parse import quote  # @UnresolvedImport

import inspect
import sys
from _pydevd_bundle.pydevd_constants import IS_PY3K, USE_CUSTOM_SYS_CURRENT_FRAMES, IS_PYPY, SUPPORT_GEVENT, \
    GEVENT_SUPPORT_NOT_SET_MSG, GENERATED_LEN_ATTR_NAME
from _pydev_imps._pydev_saved_modules import threading


def save_main_module(file, module_name):
    # patch provided by: Scott Schlesier - when script is run, it does not
    # use globals from pydevd:
    # This will prevent the pydevd script from contaminating the namespace for the script to be debugged
    # pretend pydevd is not the main module, and
    # convince the file to be debugged that it was loaded as main
    sys.modules[module_name] = sys.modules['__main__']
    sys.modules[module_name].__name__ = module_name

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=DeprecationWarning)
        warnings.simplefilter("ignore", category=PendingDeprecationWarning)
        from imp import new_module

    m = new_module('__main__')
    sys.modules['__main__'] = m
    if hasattr(sys.modules[module_name], '__loader__'):
        m.__loader__ = getattr(sys.modules[module_name], '__loader__')
    m.__file__ = file

    return m


def is_current_thread_main_thread():
    if hasattr(threading, 'main_thread'):
        return threading.current_thread() is threading.main_thread()
    else:
        return isinstance(threading.current_thread(), threading._MainThread)


def get_main_thread():
    if hasattr(threading, 'main_thread'):
        return threading.main_thread()
    else:
        for t in threading.enumerate():
            if isinstance(t, threading._MainThread):
                return t
    return None


def to_number(x):
    if is_string(x):
        try:
            n = float(x)
            return n
        except ValueError:
            pass

        l = x.find('(')
        if l != -1:
            y = x[0:l - 1]
            # print y
            try:
                n = float(y)
                return n
            except ValueError:
                pass
    return None


def compare_object_attrs_key(x):
    if GENERATED_LEN_ATTR_NAME == x:
        as_number = to_number(x)
        if as_number is None:
            as_number = 99999999
        # len() should appear after other attributes in a list.
        return (1, as_number)
    else:
        return (-1, to_string(x))


if IS_PY3K:

    def is_string(x):
        return isinstance(x, str)

else:

    def is_string(x):
        return isinstance(x, basestring)


def to_string(x):
    if is_string(x):
        return x
    else:
        return str(x)


def print_exc():
    if traceback:
        traceback.print_exc()


if IS_PY3K:

    def quote_smart(s, safe='/'):
        return quote(s, safe)

else:

    def quote_smart(s, safe='/'):
        if isinstance(s, unicode):
            s = s.encode('utf-8')

        return quote(s, safe)


def get_clsname_for_code(code, frame):
    clsname = None
    if len(code.co_varnames) > 0:
        # We are checking the first argument of the function
        # (`self` or `cls` for methods).
        first_arg_name = code.co_varnames[0]
        if first_arg_name in frame.f_locals:
            first_arg_obj = frame.f_locals[first_arg_name]
            if inspect.isclass(first_arg_obj):  # class method
                first_arg_class = first_arg_obj
            else:  # instance method
                if hasattr(first_arg_obj, "__class__"):
                    first_arg_class = first_arg_obj.__class__
                else:  # old style class, fall back on type
                    first_arg_class = type(first_arg_obj)
            func_name = code.co_name
            if hasattr(first_arg_class, func_name):
                method = getattr(first_arg_class, func_name)
                func_code = None
                if hasattr(method, 'func_code'):  # Python2
                    func_code = method.func_code
                elif hasattr(method, '__code__'):  # Python3
                    func_code = method.__code__
                if func_code and func_code == code:
                    clsname = first_arg_class.__name__

    return clsname


def get_non_pydevd_threads():
    threads = threading.enumerate()
    return [t for t in threads if t and not getattr(t, 'is_pydev_daemon_thread', False)]


def dump_threads(stream=None):
    '''
    Helper to dump thread info.
    '''
    if stream is None:
        stream = sys.stderr
    thread_id_to_name = {}
    try:
        for t in threading.enumerate():
            thread_id_to_name[t.ident] = '%s  (daemon: %s, pydevd thread: %s)' % (
                t.name, t.daemon, getattr(t, 'is_pydev_daemon_thread', False))
    except:
        pass

    if USE_CUSTOM_SYS_CURRENT_FRAMES and IS_PYPY:
        # On PyPy we can use its fake_frames to get the traceback
        # (instead of the actual real frames that need the tracing to be correct).
        _current_frames = sys._current_frames
    else:
        from _pydevd_bundle.pydevd_additional_thread_info_regular import _current_frames

    stream.write('===============================================================================\n')
    stream.write('Threads running\n')
    stream.write('================================= Thread Dump =================================\n')
    stream.flush()

    for thread_id, stack in _current_frames().items():
        stream.write('\n-------------------------------------------------------------------------------\n')
        stream.write(" Thread %s" % thread_id_to_name.get(thread_id, thread_id))
        stream.write('\n\n')

        for i, (filename, lineno, name, line) in enumerate(traceback.extract_stack(stack)):

            stream.write(' File "%s", line %d, in %s\n' % (filename, lineno, name))
            if line:
                stream.write("   %s\n" % (line.strip()))

            if i == 0 and 'self' in stack.f_locals:
                stream.write('   self: ')
                try:
                    stream.write(str(stack.f_locals['self']))
                except:
                    stream.write('Unable to get str of: %s' % (type(stack.f_locals['self']),))
                stream.write('\n')
        stream.flush()

    stream.write('\n=============================== END Thread Dump ===============================')
    stream.flush()


def _extract_variable_nested_braces(char_iter):
    expression = []
    level = 0
    for c in char_iter:
        if c == '{':
            level += 1
        if c == '}':
            level -= 1
        if level == -1:
            return ''.join(expression).strip()
        expression.append(c)
    raise SyntaxError('Unbalanced braces in expression.')


def _extract_expression_list(log_message):
    # Note: not using re because of nested braces.
    expression = []
    expression_vars = []
    char_iter = iter(log_message)
    for c in char_iter:
        if c == '{':
            expression_var = _extract_variable_nested_braces(char_iter)
            if expression_var:
                expression.append('%s')
                expression_vars.append(expression_var)
        else:
            expression.append(c)

    expression = ''.join(expression)
    return expression, expression_vars


def convert_dap_log_message_to_expression(log_message):
    try:
        expression, expression_vars = _extract_expression_list(log_message)
    except SyntaxError:
        return repr('Unbalanced braces in: %s' % (log_message))
    if not expression_vars:
        return repr(expression)
    # Note: use '%' to be compatible with Python 2.6.
    return repr(expression) + ' % (' + ', '.join(str(x) for x in expression_vars) + ',)'


def notify_about_gevent_if_needed(stream=None):
    '''
    When debugging with gevent check that the gevent flag is used if the user uses the gevent
    monkey-patching.

    :return bool:
        Returns True if a message had to be shown to the user and False otherwise.
    '''
    stream = stream if stream is not None else sys.stderr
    if not SUPPORT_GEVENT:
        gevent_monkey = sys.modules.get('gevent.monkey')
        if gevent_monkey is not None:
            try:
                saved = gevent_monkey.saved
            except AttributeError:
                pydev_log.exception_once('Error checking for gevent monkey-patching.')
                return False

            if saved:
                # Note: print to stderr as it may deadlock the debugger.
                sys.stderr.write('%s\n' % (GEVENT_SUPPORT_NOT_SET_MSG,))
                return True

    return False


def hasattr_checked(obj, name):
    try:
        getattr(obj, name)
    except:
        # i.e.: Handle any exception, not only AttributeError.
        return False
    else:
        return True


def dir_checked(obj):
    try:
        return dir(obj)
    except:
        return []


def isinstance_checked(obj, cls):
    try:
        return isinstance(obj, cls)
    except:
        return False


class ScopeRequest(object):

    __slots__ = ['variable_reference', 'scope']

    def __init__(self, variable_reference, scope):
        assert scope in ('globals', 'locals')
        self.variable_reference = variable_reference
        self.scope = scope

    def __eq__(self, o):
        if isinstance(o, ScopeRequest):
            return self.variable_reference == o.variable_reference and self.scope == o.scope

        return False

    def __ne__(self, o):
        return not self == o

    def __hash__(self):
        return hash((self.variable_reference, self.scope))


class DAPGrouper(object):
    '''
    Note: this is a helper class to group variables on the debug adapter protocol (DAP). For
    the xml protocol the type is just added to each variable and the UI can group/hide it as needed.
    '''

    SCOPE_SPECIAL_VARS = 'special variables'
    SCOPE_PROTECTED_VARS = 'protected variables'
    SCOPE_FUNCTION_VARS = 'function variables'
    SCOPE_CLASS_VARS = 'class variables'

    SCOPES_SORTED = [
        SCOPE_SPECIAL_VARS,
        SCOPE_PROTECTED_VARS,
        SCOPE_FUNCTION_VARS,
        SCOPE_CLASS_VARS,
    ]

    __slots__ = ['variable_reference', 'scope', 'contents_debug_adapter_protocol']

    def __init__(self, scope):
        self.variable_reference = id(self)
        self.scope = scope
        self.contents_debug_adapter_protocol = []

    def get_contents_debug_adapter_protocol(self):
        return self.contents_debug_adapter_protocol[:]

    def __eq__(self, o):
        if isinstance(o, ScopeRequest):
            return self.variable_reference == o.variable_reference and self.scope == o.scope

        return False

    def __ne__(self, o):
        return not self == o

    def __hash__(self):
        return hash((self.variable_reference, self.scope))

    def __repr__(self):
        return ''

    def __str__(self):
        return ''
