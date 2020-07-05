# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

import sys
import warnings

import ptvsd.log
from ptvsd._remote import (
    attach as ptvsd_attach,
    enable_attach as ptvsd_enable_attach,
)
from ptvsd.wrapper import debugger_attached

import pydevd
from _pydevd_bundle.pydevd_constants import get_global_debugger

WAIT_TIMEOUT = 1.0

DEFAULT_HOST = '0.0.0.0'
DEFAULT_PORT = 5678

_pending_threads = set()

_redirect_output_deprecation_msg = (
    "'redirect_output' setting via enable_attach will be deprecated in the future versions of the debugger. "
    "This can be set using redirectOutput in Launch config in VS Code, using Tee output option in Visual Studio, "
    "or debugOptions configuration for any client.")


def wait_for_attach(timeout=None):
    """If a remote debugger is attached, returns immediately. Otherwise,
    blocks until a remote debugger attaches to this process, or until the
    optional timeout occurs.

    Parameters
    ----------
    timeout : float, optional
        The timeout for the operation in seconds (or fractions thereof).
    """
    ptvsd.log.info('wait_for_attach{0!r}', (timeout,))
    debugger_attached.wait(timeout)


def enable_attach(address=(DEFAULT_HOST, DEFAULT_PORT), redirect_output=None, log_dir=None):
    """Enables a client to attach to this process remotely to debug Python code.

    Parameters
    ----------
    address : (str, int), optional
        Specifies the interface and port on which the debugging server should
        listen for TCP connections. It is in the same format as used for
        regular sockets of the `socket.AF_INET` family, i.e. a tuple of
        ``(hostname, port)``. On client side, the server is identified by the
        Qualifier string in the usual ``'hostname:port'`` format, e.g.:
        ``'myhost.cloudapp.net:5678'``. Default is ``('0.0.0.0', 5678)``.
    redirect_output : bool, optional
        (Deprecated) Specifies whether any output (on both `stdout` and `stderr`) produced
        by this program should be sent to the debugger. Default is ``True``.
    log_dir : str, optional
        Name of the directory that debugger will create its log files in.
        If not specified, logging is disabled.

    Return
    ------
    Returns tuple (host, port) as used to by the debugging server. If `enable_attach` was
    called with port '0'. The return value will contain the actual ephemeral port number.

    Notes
    -----
    This function returns immediately after setting up the debugging server,
    and does not block program execution. If you need to block until debugger
    is attached, call `ptvsd.wait_for_attach`. The debugger can be detached
    and re-attached multiple times after `enable_attach` is called.

    Only the thread on which this function is called, and any threads that are
    created after it returns, will be visible in the debugger once it is
    attached. Any threads that are already running before this function is
    called will not be visible.
    """

    if log_dir:
        ptvsd.options.log_dir = log_dir
    ptvsd.log.to_file()
    ptvsd.log.info('enable_attach{0!r}', (address, redirect_output))

    if redirect_output is not None:
        ptvsd.log.info('redirect_output deprecation warning.')
        warnings.warn(_redirect_output_deprecation_msg, DeprecationWarning, stacklevel=2)

    if is_attached():
        ptvsd.log.info('enable_attach() ignored - already attached.')
        return

    debugger_attached.clear()

    # Ensure port is int
    port = address[1]
    address = (address[0], port if type(port) is int else int(port))

    ptvsd_enable_attach(address)
    return (address[0], ptvsd.options.port)


def attach(address, redirect_output=None, log_dir=None):
    """Attaches this process to the debugger listening on a given address.

    Parameters
    ----------
    address : (str, int), optional
        Specifies the interface and port on which the debugger is listening
        for TCP connections. It is in the same format as used for
        regular sockets of the `socket.AF_INET` family, i.e. a tuple of
        ``(hostname, port)``.
    redirect_output : bool, optional
        (Deprecated) Specifies whether any output (on both `stdout` and `stderr`) produced
        by this program should be sent to the debugger. Default is ``True``.
    log_dir : str, optional
        Name of the directory that debugger will create its log files in.
        If not specified, logging is disabled.
    """

    if log_dir:
        ptvsd.options.log_dir = log_dir
    ptvsd.log.to_file()
    ptvsd.log.info('attach{0!r}', (address, redirect_output))

    if redirect_output is not None:
        ptvsd.log.info('redirect_output deprecation warning.')
        warnings.warn(_redirect_output_deprecation_msg, DeprecationWarning)

    if is_attached():
        ptvsd.log.info('attach() ignored - already attached.')
        return

    debugger_attached.clear()

    # Ensure port is int
    port = address[1]
    address = (address[0], port if type(port) is int else int(port))

    ptvsd_attach(address)


def is_attached():
    """Returns ``True`` if debugger is attached, ``False`` otherwise."""
    return debugger_attached.isSet()


def break_into_debugger():
    """If a remote debugger is attached, pauses execution of all threads,
    and breaks into the debugger with current thread as active.
    """

    ptvsd.log.info('break_into_debugger()')

    if not is_attached():
        ptvsd.log.info('break_into_debugger() ignored - debugger not attached')
        return

    # Get the first frame in the stack that's not an internal frame.
    global_debugger = get_global_debugger()
    stop_at_frame = sys._getframe().f_back
    while stop_at_frame is not None and global_debugger.get_file_type(
            stop_at_frame) == global_debugger.PYDEV_FILE:
        stop_at_frame = stop_at_frame.f_back

    # pydevd.settrace() only enables debugging of the current
    # thread and all future threads.  PyDevd is not enabled for
    # existing threads (other than the current one).  Consequently,
    # pydevd.settrace() must be called ASAP in the current thread.
    # See issue #509.
    #
    # This is tricky, however, because settrace() will block until
    # it receives a CMD_RUN message.  You can't just call it in a
    # thread to avoid blocking; doing so would prevent the current
    # thread from being debugged.
    pydevd.settrace(
        suspend=True,
        trace_only_current_thread=True,
        patch_multiprocessing=False,
        stop_at_frame=stop_at_frame,
    )
    stop_at_frame = None


def debug_this_thread():
    pydevd.settrace(suspend=False)
