# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import print_function, with_statement, absolute_import

import atexit
import itertools
import os
import re
import signal
import socket
import sys
import threading
import time

try:
    import queue
except ImportError:
    import Queue as queue

import ptvsd.log
from ptvsd import options
from ptvsd.socket import create_server, create_client
from ptvsd.messaging import JsonIOStream, JsonMessageChannel
from ptvsd._util import new_hidden_thread

from _pydev_bundle import pydev_monkey
from _pydevd_bundle.pydevd_comm import get_global_debugger

subprocess_lock = threading.Lock()

subprocess_listener_socket = None

subprocesses = {}
"""List of known subprocesses. Keys are process IDs, values are JsonMessageChannel
instances; subprocess_lock must be used to synchronize access.
"""

subprocess_queue = queue.Queue()
"""A queue of incoming 'ptvsd_subprocess' notifications. Whenenever a new request
is received, a tuple of (subprocess_request, subprocess_response) is placed in the
queue.

subprocess_request is the body of the 'ptvsd_subprocess' notification request that
was received, with additional information about the root process added.

subprocess_response is the body of the response that will be sent to respond to the
request. It contains a single item 'incomingConnection', which is initially set to
False. If, as a result of processing the entry, the subprocess shall receive an
incoming DAP connection on the port it specified in the request, its value should be
set to True, indicating that the subprocess should wait for that connection before
proceeding. If no incoming connection is expected, it is set to False, indicating
that the subprocess shall proceed executing user code immediately.

subprocess_queue.task_done() must be invoked for every subprocess_queue.get(), for
the corresponding subprocess_response to be delivered back to the subprocess.
"""

root_start_request = None
"""The 'launch' or 'attach' request that started debugging in this process, in its
entirety (i.e. dict representation of JSON request). This information is added to
'ptvsd_subprocess' notifications before they're placed in subprocess_queue.
"""


def listen_for_subprocesses():
    """Starts a listener for incoming 'ptvsd_subprocess' notifications that
    enqueues them in subprocess_queue.
    """

    global subprocess_listener_socket
    assert subprocess_listener_socket is None

    subprocess_listener_socket = create_server('localhost', 0)
    ptvsd.log.debug(
        'Listening for subprocess notifications on port {0}.',
        subprocess_listener_port())

    atexit.register(stop_listening_for_subprocesses)
    atexit.register(kill_subprocesses)
    new_hidden_thread('SubprocessListener', _subprocess_listener).start()


def stop_listening_for_subprocesses():
    ptvsd.log.debug('Stopping listening for subprocess notifications.')

    global subprocess_listener_socket
    if subprocess_listener_socket is None:
        return
    try:
        subprocess_listener_socket.shutdown(socket.SHUT_RDWR)
    except Exception:
        pass
    subprocess_listener_socket = None


def kill_subprocesses():
    with subprocess_lock:
        pids = list(subprocesses.keys())

    ptvsd.log.debug('Killing remaining subprocesses: PID={0}', pids)

    for pid in pids:
        ptvsd.log.debug('Killing subprocess with PID={0}.', pid)
        with subprocess_lock:
            subprocesses.pop(pid, None)
        try:
            os.kill(pid, signal.SIGTERM)
        except Exception:
            ptvsd.log.exception('Failed to kill process with PID={0}.', pid, category='D')


def subprocess_listener_port():
    if subprocess_listener_socket is None:
        return None
    _, port = subprocess_listener_socket.getsockname()
    return port


def _subprocess_listener():
    counter = itertools.count(1)
    while subprocess_listener_socket:
        try:
            (sock, _) = subprocess_listener_socket.accept()
        except Exception:
            break

        n = next(counter)
        name = 'subprocess-{}'.format(n)
        ptvsd.log.debug('Accepted incoming connection from {0}', name)

        stream = JsonIOStream.from_socket(sock, name=name)
        _handle_subprocess(n, stream)


def _handle_subprocess(n, stream):

    class Handlers(object):
        _pid = None

        def ptvsd_subprocess_request(self, request):
            # When child process is spawned, the notification it sends only
            # contains information about itself and its immediate parent.
            # Add information about the root process before passing it on.
            arguments = dict(request.arguments)
            arguments.update({
                'rootProcessId': os.getpid(),
                'rootStartRequest': root_start_request,
            })

            self._pid = arguments['processId']
            with subprocess_lock:
                subprocesses[self._pid] = channel

            ptvsd.log.debug(
                'Subprocess {0} (PID={1}) registered, notifying IDE.',
                stream.name,
                self._pid)

            response = {'incomingConnection': False}
            subprocess_queue.put((arguments, response))
            subprocess_queue.join()
            return response

        def disconnect(self):
            ptvsd.log.debug('Subprocess {0} disconnected, presumed to have terminated.', self._pid)
            if self._pid is not None:
                with subprocess_lock:
                    subprocesses.pop(self._pid, None)

    name = 'subprocess-%d' % n
    channel = JsonMessageChannel(stream, Handlers(), name)
    channel.start()


def notify_root(port):
    assert options.subprocess_of

    ptvsd.log.debug('Subprocess (PID={0}) notifying root process at port {1}', os.getpid(), options.subprocess_notify)
    conn = create_client()
    conn.connect(('localhost', options.subprocess_notify))
    stream = JsonIOStream.from_socket(conn, 'root-process')
    channel = JsonMessageChannel(stream)
    channel.start()

    # Send the notification about ourselves to root, and wait for it to tell us
    # whether an incoming connection is anticipated. This will be true if root
    # had successfully propagated the notification to the IDE, and false if it
    # couldn't do so (e.g. because the IDE is not attached). There's also the
    # possibility that connection to root will just drop, e.g. if it crashes -
    # in that case, just exit immediately.

    request = channel.send_request('ptvsd_subprocess', {
        'parentProcessId': options.subprocess_of,
        'processId': os.getpid(),
        'port': port,
    })

    try:
        response = request.wait_for_response()
    except Exception:
        ptvsd.log.exception('Failed to send subprocess notification; exiting')
        sys.exit(0)

    # Keep the channel open until we exit - root process uses open channels to keep
    # track of which subprocesses are alive and which are not.
    atexit.register(lambda: channel.close())

    if not response['incomingConnection']:
        ptvsd.log.debug('No IDE connection is expected for this subprocess; unpausing.')
        debugger = get_global_debugger()
        while debugger is None:
            time.sleep(0.1)
            debugger = get_global_debugger()
        debugger.ready_to_run = True


def patch_args(args):
    """
    Patches a command line invoking Python such that it has the same meaning, but
    the process runs under ptvsd. In general, this means that given something like:

        python -R -Q warn -m app

    the result should be:

        python -R -Q warn .../ptvsd/__main__.py --host localhost --port 0 ... -m app
    """

    if not options.multiprocess:
        return args

    args = list(args)
    ptvsd.log.debug('Patching subprocess command line: {0!r}', args)

    # First, let's find the target of the invocation. This is one of:
    #
    #   filename.py
    #   -m module_name
    #   -c "code"
    #   -
    #
    # This needs to take into account other switches that have values:
    #
    #   -Q -W -X --check-hash-based-pycs
    #
    # because in something like "-X -c", -c is a value, not a switch.
    expect_value = False
    for i, arg in enumerate(args):
        # Skip Python binary.
        if i == 0:
            if not pydev_monkey.is_python(arg):
                return args  # We're not dealing with Python, so, don't do anything.
            continue

        if arg == '-':
            # We do not support debugging while reading from stdin, so just let this
            # process run without debugging.
            return args

        if expect_value:
            # Consume the value and move on.
            expect_value = False
            continue

        if not arg.startswith('-') or arg in ('-c', '-m'):
            # This is the target.
            break

        if arg.startswith('--'):
            expect_value = (arg == '--check-hash-based-pycs')
            continue

        # All short switches other than -c and -m can be combined together, including
        # those with values. So, instead of -R -B -v -Q old, we might see -RBvQ old.
        # Furthermore, the value itself can be concatenated with the switch, so rather
        # than -Q old, we might have -Qold. When switches are combined, any switch that
        # has a value "eats" the rest of the argument; for example, -RBQv is treated as
        # -R -B -Qv, and not as -R -B -Q -v. So, we need to check whether one of 'Q',
        # 'W' or 'X' was present somewhere in the arg, and whether there was anything
        # following it in the arg. If it was there but nothing followed after it, then
        # the switch is expecting a value.
        split = re.split(r'[QWX]', arg, maxsplit=1)
        expect_value = (len(split) > 1 and split[-1] != '')

    else:
        # Didn't find the target, so we don't know how to patch this command line; let
        # it run without debugging.
        return args

    if not args[i].startswith('-'):
        # If it was a filename, it can be a Python file, a directory, or a zip archive
        # that is treated as if it were a directory. However, ptvsd only supports the
        # first scenario. Distinguishing between these can be tricky, and getting it
        # wrong means that process fails to launch, so be conservative.
        if not args[i].endswith('.py'):
            return args

    # Now we need to inject the ptvsd invocation right before the target. The target
    # itself can remain as is, because ptvsd is compatible with Python in that respect.
    from ptvsd import __main__
    ptvsd_args = [
        __main__.__file__,
        '--host', options.host,
        '--port', '0',
        '--wait',
        '--multiprocess',
        '--subprocess-of', str(os.getpid()),
        '--subprocess-notify', str(options.subprocess_notify or subprocess_listener_port()),
    ]
    if options.log_dir:
        ptvsd_args += ['--log-dir', options.log_dir]
    args[i:i] = ptvsd_args

    ptvsd.log.debug('Patched subprocess command line: {0!r}', args)
    return args


def patch_and_quote_args(args):
    # On Windows, pydevd expects arguments to be quoted and escaped as necessary, such
    # that simply concatenating them via ' ' produces a valid command line. This wraps
    # patch_args and applies quoting (quote_args contains platform check), so that the
    # implementation of patch_args can be kept simple.
    return pydev_monkey.quote_args(patch_args(args))
