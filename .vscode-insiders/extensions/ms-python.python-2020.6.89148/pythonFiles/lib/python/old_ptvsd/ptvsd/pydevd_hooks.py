# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

import os
import sys

import pydevd
from _pydev_bundle import pydev_monkey
from _pydevd_bundle import pydevd_comm

import ptvsd
import ptvsd.log
from ptvsd import multiproc
from ptvsd.socket import Address
from ptvsd.daemon import Daemon, DaemonStoppedError, DaemonClosedError
from ptvsd._util import new_hidden_thread
from ptvsd import options


@ptvsd.log.escaped_exceptions
def start_server(daemon, host, port, **kwargs):
    """Return a socket to a (new) local pydevd-handling daemon.

    The daemon supports the pydevd client wire protocol, sending
    requests and handling responses (and events).

    This is a replacement for _pydevd_bundle.pydevd_comm.start_server.
    """
    sock, next_session = daemon.start_server((host, port))

    def handle_next():
        try:
            ptvsd.log.debug('Waiting for session...')
            session = next_session(**kwargs)
            ptvsd.log.debug('Got session')
            return session
        except (DaemonClosedError, DaemonStoppedError):
            # Typically won't happen.
            ptvsd.log.exception('Daemon stopped while waiting for session', category='D')
            raise
        except Exception:
            ptvsd.log.exception()
            return None

    def serve_forever():
        ptvsd.log.debug('Waiting for initial connection...')
        handle_next()
        while True:
            ptvsd.log.debug('Waiting for next connection...')
            try:
                handle_next()
            except (DaemonClosedError, DaemonStoppedError):
                break
        ptvsd.log.debug('Done serving')

    t = new_hidden_thread(
        target=serve_forever,
        name='sessions',
    )
    t.start()
    return sock


@ptvsd.log.escaped_exceptions
def start_client(daemon, host, port, **kwargs):
    """Return a socket to an existing "remote" pydevd-handling daemon.

    The daemon supports the pydevd client wire protocol, sending
    requests and handling responses (and events).

    This is a replacement for _pydevd_bundle.pydevd_comm.start_client.
    """
    sock, start_session = daemon.start_client((host, port))
    start_session(**kwargs)
    return sock


# See pydevd/_vendored/pydevd/_pydev_bundle/pydev_monkey.py
@ptvsd.log.escaped_exceptions
def get_python_c_args(host, port, indC, args, setup):
    runner = '''
import sys
sys.path.append(r'{ptvsd_syspath}')
from ptvsd import multiproc
multiproc.init_subprocess(
    {initial_pid},
    {initial_request},
    {parent_pid},
    {parent_port},
    {first_port},
    {last_port},
    {pydevd_setup})
{rest}
'''

    first_port, last_port = multiproc.subprocess_port_range

    # __file__ will be .../ptvsd/__init__.py, and we want the ...
    ptvsd_syspath = os.path.join(ptvsd.__file__, '../..')

    return runner.format(
        initial_pid=multiproc.initial_pid,
        initial_request=multiproc.initial_request,
        parent_pid=os.getpid(),
        parent_port=multiproc.listener_port,
        first_port=first_port,
        last_port=last_port,
        ptvsd_syspath=ptvsd_syspath,
        pydevd_setup=setup,
        rest=args[indC + 1])


def install(pydevd_module, address,
            start_server=start_server, start_client=start_client,
            **kwargs):
    """Configure pydevd to use our wrapper.

    This is a bit of a hack to allow us to run our VSC debug adapter
    in the same process as pydevd.  Note that, as with most hacks,
    this is somewhat fragile (since the monkeypatching sites may
    change).
    """

    ptvsd.log.debug('Installing pydevd hooks.')

    addr = Address.from_raw(address)
    daemon = Daemon(**kwargs)

    def _start_server(p):
        ptvsd.log.debug('ptvsd: install._start_server.')
        return start_server(daemon, addr.host, p)

    def _start_client(h, p):
        ptvsd.log.debug('ptvsd: install._start_client.')
        return start_client(daemon, h, p)

    _start_server.orig = start_server
    _start_client.orig = start_client

    # These are the functions pydevd invokes to get a socket to the client.
    pydevd_comm.start_server = _start_server
    pydevd_comm.start_client = _start_client

    # This is invoked when a child process is spawned with multiproc debugging enabled.
    pydev_monkey.patch_args = multiproc.patch_and_quote_args
    if not options.multiprocess and not options.no_debug:
        # This means '--multiprocess' flag was not passed via command line args. Patch the
        # new process functions here to handle multiprocess being enabled via debug options.
        ptvsd.log.debug('Monkey-patching multiprocess functions.')
        pydev_monkey.patch_new_process_functions()

    # Ensure that pydevd is using our functions.
    pydevd_module.start_server = _start_server
    pydevd_module.start_client = _start_client
    __main__ = sys.modules['__main__']
    if __main__ is not pydevd:
        if getattr(__main__, '__file__', None) == pydevd.__file__:
            __main__.start_server = _start_server
            __main__.start_client = _start_client

    return daemon
