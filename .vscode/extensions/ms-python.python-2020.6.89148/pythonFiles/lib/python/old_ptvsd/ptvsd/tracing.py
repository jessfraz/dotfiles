# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import absolute_import, print_function, unicode_literals

import contextlib
import threading

from _pydevd_bundle import pydevd_constants
from ptvsd import log


_tls = threading.local()


def tracing(should_trace=None):
    """Enables or disables tracing on this thread. When called without an
    argument, returns the current tracing state.

    When tracing is disabled, breakpoints will not be hit, but code executes
    significantly faster.

    If debugger is not attached, this function has no effect.

    This function can also be used in a with-statement to automatically save
    and then restore the previous tracing setting::

        with ptvsd.tracing(False):
            # Tracing disabled
            ...
            # Tracing restored

    Parameters
    ----------
    should_trace : bool, optional
        Whether to enable or disable tracing.
    """

    pydb = pydevd_constants.get_global_debugger()

    try:
        was_tracing = _tls.is_tracing
    except AttributeError:
        was_tracing = pydb is not None

    if should_trace is None:
        return was_tracing

    # It is possible that IDE attaches after tracing is changed, but before it is
    # restored. In this case, we don't really want to restore the original value,
    # because it will effectively disable tracing for the just-attached IDE. Doing
    # the check outside the function below makes it so that if the original change
    # was a no-op because IDE wasn't attached, restore will be no-op as well, even
    # if IDE has attached by then.

    tid = threading.current_thread().ident
    if pydb is None:
        log.info("ptvsd.tracing() ignored on thread {0} - debugger not attached", tid)
        def enable_or_disable(_):
            # Always fetch the fresh value, in case it changes before we restore.
            _tls.is_tracing = pydevd_constants.get_global_debugger() is not None
    else:
        def enable_or_disable(enable):
            if enable:
                log.info("Enabling tracing on thread {0}", tid)
                pydb.enable_tracing()
            else:
                log.info("Disabling tracing on thread {0}", tid)
                pydb.disable_tracing()
            _tls.is_tracing = enable

    # Context managers don't do anything unless used in a with-statement - that is,
    # even the code up to yield won't run. But we want callers to be able to omit
    # with-statement for this function, if they don't want to restore. So, we apply
    # the change directly out here in the non-generator context, so that it happens
    # immediately - and then return a context manager that is solely for the purpose
    # of restoring the original value, which the caller can use or discard.

    @contextlib.contextmanager
    def restore_tracing():
        try:
            yield
        finally:
            enable_or_disable(was_tracing)

    enable_or_disable(should_trace)
    return restore_tracing()
