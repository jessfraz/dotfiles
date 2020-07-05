import os
import sys

from _pydev_bundle import pydev_log

IS_PY36_OR_GREATER = sys.version_info >= (3, 6)

frame_eval_func = None
stop_frame_eval = None
dummy_trace_dispatch = None
clear_thread_local_info = None

# "NO" means we should not use frame evaluation, 'YES' we should use it (and fail if not there) and unspecified uses if possible.
use_frame_eval = os.environ.get('PYDEVD_USE_FRAME_EVAL', None)

if use_frame_eval == 'NO':
    pass

elif use_frame_eval == 'YES':
    # Fail if unable to use
    from _pydevd_frame_eval.pydevd_frame_eval_cython_wrapper import frame_eval_func, stop_frame_eval, dummy_trace_dispatch, clear_thread_local_info

elif use_frame_eval is None:
    # Try to use if possible
    if IS_PY36_OR_GREATER:
        try:
            from _pydevd_frame_eval.pydevd_frame_eval_cython_wrapper import frame_eval_func, stop_frame_eval, dummy_trace_dispatch, clear_thread_local_info
        except ImportError:
            pydev_log.show_compile_cython_command_line()

else:
    raise RuntimeError('Unexpected value for PYDEVD_USE_FRAME_EVAL: %s (accepted: YES, NO)' % (use_frame_eval,))
