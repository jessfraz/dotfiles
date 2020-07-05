from _pydevd_bundle.pydevd_constants import IS_PY3K
from _pydev_bundle import pydev_log
import sys


class Frame(object):

    def __init__(
            self,
            f_back,
            f_fileno,
            f_code,
            f_locals,
            f_globals=None,
            f_trace=None):
        self.f_back = f_back
        self.f_lineno = f_fileno
        self.f_code = f_code
        self.f_locals = f_locals
        self.f_globals = f_globals
        self.f_trace = f_trace

        if self.f_globals is None:
            self.f_globals = {}


class FCode(object):

    def __init__(self, name, filename):
        self.co_name = name
        self.co_filename = filename
        self.co_firstlineno = 1


def add_exception_to_frame(frame, exception_info):
    frame.f_locals['__exception__'] = exception_info


def remove_exception_from_frame(frame):
    frame.f_locals.pop('__exception__', None)


FILES_WITH_IMPORT_HOOKS = ['pydev_monkey_qt.py', 'pydev_import_hook.py']


def just_raised(trace):
    if trace is None:
        return False
    return trace.tb_next is None


def ignore_exception_trace(trace):
    while trace is not None:
        filename = trace.tb_frame.f_code.co_filename
        if filename in (
            '<frozen importlib._bootstrap>', '<frozen importlib._bootstrap_external>'):
            # Do not stop on inner exceptions in py3 while importing
            return True

        # ImportError should appear in a user's code, not inside debugger
        for file in FILES_WITH_IMPORT_HOOKS:
            if filename.endswith(file):
                return True

        trace = trace.tb_next

    return False


def cached_call(obj, func, *args):
    cached_name = '_cached_' + func.__name__
    if not hasattr(obj, cached_name):
        setattr(obj, cached_name, func(*args))

    return getattr(obj, cached_name)


class FramesList(object):

    def __init__(self):
        self._frames = []

        # If available, the line number for the frame will be gotten from this dict,
        # otherwise frame.f_lineno will be used (needed for unhandled exceptions as
        # the place where we report may be different from the place where it's raised).
        self.frame_id_to_lineno = {}

        self.exc_type = None
        self.exc_desc = None
        self.trace_obj = None

    def append(self, frame):
        self._frames.append(frame)

    def __iter__(self):
        return iter(self._frames)

    def __repr__(self):
        lst = ['FramesList(']

        lst.append('\n    exc_type: ')
        lst.append(str(self.exc_type))

        lst.append('\n    exc_desc: ')
        lst.append(str(self.exc_desc))

        lst.append('\n    trace_obj: ')
        lst.append(str(self.trace_obj))

        for frame in self._frames:
            lst.append('\n    ')
            lst.append(repr(frame))
            lst.append(',')
        lst.append('\n)')
        return ''.join(lst)

    __str__ = __repr__


def create_frames_list_from_traceback(trace_obj, frame, exc_type, exc_desc):
    '''
    :param trace_obj:
        This is the traceback from which the list should be created.

    :param frame:
        This is the first frame to be considered (i.e.: topmost frame).
    '''
    lst = []

    tb = trace_obj
    if tb is not None and tb.tb_frame is not None:
        f = tb.tb_frame.f_back
        while f is not None:
            lst.insert(0, (f, f.f_lineno))
            f = f.f_back

    while tb is not None:
        lst.append((tb.tb_frame, tb.tb_lineno))
        tb = tb.tb_next

    frames_list = None

    for tb_frame, tb_lineno in reversed(lst):
        if frames_list is None and (frame is tb_frame or frame is None):
            frames_list = FramesList()

        if frames_list is not None:
            frames_list.append(tb_frame)
            frames_list.frame_id_to_lineno[id(tb_frame)] = tb_lineno

    if frames_list is None and frame is not None:
        # Fallback (shouldn't happen in practice).
        pydev_log.info('create_frames_list_from_traceback did not find topmost frame in list.')
        frames_list = create_frames_list_from_frame(frame)

    frames_list.exc_type = exc_type
    frames_list.exc_desc = exc_desc
    frames_list.trace_obj = trace_obj

    return frames_list


def create_frames_list_from_frame(frame):
    lst = FramesList()
    while frame is not None:
        lst.append(frame)
        frame = frame.f_back

    return lst
