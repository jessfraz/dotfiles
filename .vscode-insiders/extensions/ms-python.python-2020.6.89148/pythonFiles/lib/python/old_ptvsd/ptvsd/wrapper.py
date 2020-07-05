# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import print_function, absolute_import, unicode_literals

import copy
import errno
import json
import os
import re
import platform
import socket
import sys
import threading

try:
    import urllib
    urllib.unquote
except Exception:
    import urllib.parse as urllib

try:
    import queue
except ImportError:
    import Queue as queue

import warnings
import pydevd  # noqa
import _pydevd_bundle.pydevd_comm as pydevd_comm  # noqa
import _pydevd_bundle.pydevd_comm_constants as pydevd_comm_constants  # noqa
import _pydevd_bundle.pydevd_extension_api as pydevd_extapi  # noqa
import _pydevd_bundle.pydevd_extension_utils as pydevd_extutil  # noqa
import _pydevd_bundle.pydevd_frame as pydevd_frame  # noqa
from pydevd_file_utils import get_abs_path_real_path_and_base_from_file  # noqa
from _pydevd_bundle.pydevd_dont_trace_files import PYDEV_FILE  # noqa

import ptvsd
import ptvsd.log
from ptvsd import _util
from ptvsd import multiproc
from ptvsd import options
from ptvsd.compat import unicode
import ptvsd.ipcjson as ipcjson  # noqa
import ptvsd.futures as futures  # noqa
from ptvsd.version import __version__  # noqa
from ptvsd.socket import TimeoutError  # noqa

WAIT_FOR_THREAD_FINISH_TIMEOUT = 1  # seconds

debugger_attached = threading.Event()


def NOOP(*args, **kwargs):
    pass


def path_to_unicode(s):
    return s if isinstance(s, unicode) else s.decode(sys.getfilesystemencoding())


PTVSD_DIR_PATH = os.path.dirname(os.path.abspath(get_abs_path_real_path_and_base_from_file(__file__)[0])) + os.path.sep
NORM_PTVSD_DIR_PATH = os.path.normcase(PTVSD_DIR_PATH)


class UnsupportedPyDevdCommandError(Exception):

    def __init__(self, cmdid):
        msg = 'unsupported pydevd command ' + str(cmdid)
        super(UnsupportedPyDevdCommandError, self).__init__(msg)
        self.cmdid = cmdid


if sys.version_info >= (3,):

    def unquote(s):
        return None if s is None else urllib.unquote(s)

else:

    # In Python 2, urllib.unquote doesn't handle Unicode strings correctly,
    # so we need to convert to ASCII first, unquote, and then decode.
    def unquote(s):
        if s is None:
            return None
        if not isinstance(s, bytes):
            s = bytes(s)
        s = urllib.unquote(s)
        if isinstance(s, bytes):
            s = s.decode('utf-8')
        return s


class PydevdSocket(object):
    """A dummy socket-like object for communicating with pydevd.

    It parses pydevd messages and redirects them to the provided handler
    callback.  It also provides an interface to send notifications and
    requests to pydevd; for requests, the reply can be asynchronously
    awaited.
    """

    def __init__(self, handle_msg, handle_close, getpeername, getsockname):
        self._handle_msg = handle_msg
        self._handle_close = handle_close
        self._getpeername = getpeername
        self._getsockname = getsockname

        self.lock = threading.Lock()
        self.seq = 1000000000
        self.pipe_r, self.pipe_w = os.pipe()
        self.requests = {}

        self._closed = False
        self._closing = False

    def close(self):
        """Mark the socket as closed and release any resources."""
        if self._closing:
            return

        with self.lock:
            if self._closed:
                return
            self._closing = True

            if self.pipe_w is not None:
                pipe_w = self.pipe_w
                self.pipe_w = None
                try:
                    os.close(pipe_w)
                except OSError as exc:
                    if exc.errno != errno.EBADF:
                        raise
            if self.pipe_r is not None:
                pipe_r = self.pipe_r
                self.pipe_r = None
                try:
                    os.close(pipe_r)
                except OSError as exc:
                    if exc.errno != errno.EBADF:
                        raise
            self._handle_close()
            self._closed = True
            self._closing = False

    def shutdown(self, mode):
        """Called when pydevd has stopped."""
        # noop

    def getpeername(self):
        """Return the remote address to which the socket is connected."""
        return self._getpeername()

    def getsockname(self):
        """Return the socket's own address."""
        return self._getsockname()

    def recv(self, count):
        """Return the requested number of bytes.

        This is where the "socket" sends requests to pydevd.  The data
        must follow the pydevd line protocol.
        """
        pipe_r = self.pipe_r
        if pipe_r is None:
            return b''
        data = os.read(pipe_r, count)
        return data

    def recv_into(self, buf):
        pipe_r = self.pipe_r
        if pipe_r is None:
            return 0
        return os.readv(pipe_r, [buf])

    # In Python 2, we must unquote before we decode, because UTF-8 codepoints
    # are encoded first and then quoted as individual bytes. In Python 3,
    # however, we just get a properly UTF-8-encoded string.
    if sys.version_info < (3,):

        @staticmethod
        def _decode_and_unquote(data):
            return unquote(data).decode('utf8')

    else:

        @staticmethod
        def _decode_and_unquote(data):
            return unquote(data.decode('utf8'))

    def send(self, data):
        """Handle the given bytes.

        This is where pydevd sends responses and events.  The data will
        follow the pydevd line protocol.

        Note that the data is always a full message received from pydevd
        (sent from _pydevd_bundle.pydevd_comm.WriterThread), so, there's
        no need to actually treat received bytes as a stream of bytes.
        """
        result = len(data)

        # Defer logging until we have as much information about the message
        # as possible - after decoding it, parsing it, determining whether
        # it's a response etc. This way it can be logged in the most readable
        # representation and with the most context.
        #
        # However, if something fails at any of those stages, we want to log
        # as much as we have by then. Thus, the format string for for trace()
        # is also constructed dynamically, reflecting the available info.

        trace_prefix = 'PYD --> '
        trace_fmt = '{data}'

        try:
            if data.startswith(b'{'):  # JSON
                data = data.decode('utf-8')
                data = json.loads(data)
                trace_fmt = '{data!j}'
                cmd_id = data['pydevd_cmd_id']
                if 'request_seq' in data:
                    seq = data['request_seq']
                else:
                    seq = data['seq']
                args = data
            else:
                assert data.endswith(b'\n')
                data = self._decode_and_unquote(data[:-1])
                cmd_id, seq, args = data.split('\t', 2)
                if ptvsd.log.is_enabled():
                    trace_fmt = '{cmd_name} {seq}\n{args}'
        except:
            ptvsd.log.exception(trace_prefix + trace_fmt, data=data)
            raise

        seq = int(seq)
        cmd_id = int(cmd_id)
        try:
            cmd_name = pydevd_comm.ID_TO_MEANING[str(cmd_id)]
        except KeyError:
            cmd_name = cmd_id

        with self.lock:
            loop, fut, requesting_handler = self.requests.pop(seq, (None, None, None))

        if requesting_handler is not None:
            trace_prefix = '(requested while handling {requesting_handler})\n' + trace_prefix
        ptvsd.log.debug(
            trace_prefix + trace_fmt,
            data=data,
            cmd_id=cmd_id,
            cmd_name=cmd_name,
            seq=seq,
            args=args,
            requesting_handler=requesting_handler,
        )

        if fut is None:
            with ptvsd.log.handling((cmd_name, seq)):
                self._handle_msg(cmd_id, seq, args)
        else:
            loop.call_soon_threadsafe(fut.set_result, (cmd_id, seq, args))

        return result

    sendall = send

    def makefile(self, *args, **kwargs):
        """Return a file-like wrapper around the socket."""
        return os.fdopen(self.pipe_r)

    def make_packet(self, cmd_id, args):
        assert not isinstance(args, bytes)
        with self.lock:
            seq = self.seq
            self.seq += 1

        if ptvsd.log.is_enabled():
            try:
                cmd_name = pydevd_comm.ID_TO_MEANING[str(cmd_id)]
            except KeyError:
                cmd_name = cmd_id
            ptvsd.log.debug('PYD <-- {0} {1} {2}', cmd_name, seq, args)

        s = '{}\t{}\t{}\n'.format(cmd_id, seq, args)
        return seq, s

    def make_json_packet(self, cmd_id, args):
        assert isinstance(args, dict)
        with self.lock:
            seq = self.seq
            self.seq += 1
            args['seq'] = seq

        ptvsd.log.debug('PYD <-- {0!j}', args)

        s = json.dumps(args)
        return seq, s

    def pydevd_notify(self, cmd_id, args, is_json=False):
        if self.pipe_w is None:
            raise EOFError
        if is_json:
            seq, s = self.make_json_packet(cmd_id, args)
        else:
            seq, s = self.make_packet(cmd_id, args)
        with self.lock:
            as_bytes = s
            if not isinstance(as_bytes, bytes):
                as_bytes = as_bytes.encode('utf-8')
            if is_json:
                os.write(self.pipe_w, ('Content-Length:%s\r\n\r\n' % (len(as_bytes),)).encode('ascii'))
            os.write(self.pipe_w, as_bytes)

    def pydevd_request(self, loop, cmd_id, args, is_json=False):
        '''
        If is_json == True the args are expected to be a dict to be
        json-serialized with the request, otherwise it's expected
        to be the text (to be concatenated with the command id and
        seq in the pydevd line-based protocol).
        '''
        if self.pipe_w is None:
            raise EOFError
        if is_json:
            seq, s = self.make_json_packet(cmd_id, args)
        else:
            seq, s = self.make_packet(cmd_id, args)
        fut = loop.create_future()

        with self.lock:
            self.requests[seq] = loop, fut, ptvsd.log.current_handler()
            as_bytes = s
            if not isinstance(as_bytes, bytes):
                as_bytes = as_bytes.encode('utf-8')
            if is_json:
                os.write(self.pipe_w, ('Content-Length:%s\r\n\r\n' % (len(as_bytes),)).encode('ascii'))
            os.write(self.pipe_w, as_bytes)

        return fut

########################
# the debug config


def bool_parser(str):
    return str in ("True", "true", "1")


DEBUG_OPTIONS_PARSER = {
    'WAIT_ON_ABNORMAL_EXIT': bool_parser,
    'WAIT_ON_NORMAL_EXIT': bool_parser,
    'BREAK_SYSTEMEXIT_ZERO': bool_parser,
    'REDIRECT_OUTPUT': bool_parser,
    'VERSION': unquote,
    'INTERPRETER_OPTIONS': unquote,
    'WEB_BROWSER_URL': unquote,
    'DJANGO_DEBUG': bool_parser,
    'FLASK_DEBUG': bool_parser,
    'FIX_FILE_PATH_CASE': bool_parser,
    'CLIENT_OS_TYPE': unquote,
    'DEBUG_STDLIB': bool_parser,
    'STOP_ON_ENTRY': bool_parser,
    'SHOW_RETURN_VALUE': bool_parser,
    'MULTIPROCESS': bool_parser,
}

DEBUG_OPTIONS_BY_FLAG = {
    'RedirectOutput': 'REDIRECT_OUTPUT=True',
    'WaitOnNormalExit': 'WAIT_ON_NORMAL_EXIT=True',
    'WaitOnAbnormalExit': 'WAIT_ON_ABNORMAL_EXIT=True',
    'BreakOnSystemExitZero': 'BREAK_SYSTEMEXIT_ZERO=True',
    'Django': 'DJANGO_DEBUG=True',
    'Flask': 'FLASK_DEBUG=True',
    'Jinja': 'FLASK_DEBUG=True',
    'FixFilePathCase': 'FIX_FILE_PATH_CASE=True',
    'DebugStdLib': 'DEBUG_STDLIB=True',
    'WindowsClient': 'CLIENT_OS_TYPE=WINDOWS',
    'UnixClient': 'CLIENT_OS_TYPE=UNIX',
    'StopOnEntry': 'STOP_ON_ENTRY=True',
    'ShowReturnValue': 'SHOW_RETURN_VALUE=True',
    'Multiprocess': 'MULTIPROCESS=True',
}


def _extract_debug_options(opts, flags=None):
    """Return the debug options encoded in the given value.

    "opts" is a semicolon-separated string of "key=value" pairs.
    "flags" is a list of strings.

    If flags is provided then it is used as a fallback.

    The values come from the launch config:

     {
         type:'python',
         request:'launch'|'attach',
         name:'friendly name for debug config',
         debugOptions:[
             'RedirectOutput', 'Django'
         ],
         options:'REDIRECT_OUTPUT=True;DJANGO_DEBUG=True'
     }

    Further information can be found here:

     https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes
    """
    if not opts:
        opts = _build_debug_options(flags)
    return _parse_debug_options(opts)


def _build_debug_options(flags):
    """Build string representation of debug options from the launch config."""
    return ';'.join(DEBUG_OPTIONS_BY_FLAG[flag]
                    for flag in flags or []
                    if flag in DEBUG_OPTIONS_BY_FLAG)


def _parse_debug_options(opts):
    """Debug options are semicolon separated key=value pairs
        WAIT_ON_ABNORMAL_EXIT=True|False
        WAIT_ON_NORMAL_EXIT=True|False
        BREAK_SYSTEMEXIT_ZERO=True|False
        REDIRECT_OUTPUT=True|False
        VERSION=string
        INTERPRETER_OPTIONS=string
        WEB_BROWSER_URL=string url
        DJANGO_DEBUG=True|False
        CLIENT_OS_TYPE=WINDOWS|UNIX
        DEBUG_STDLIB=True|False
    """
    options = {}
    if not opts:
        return options

    for opt in opts.split(';'):
        try:
            key, value = opt.split('=')
        except ValueError:
            continue
        try:
            options[key] = DEBUG_OPTIONS_PARSER[key](value)
        except KeyError:
            continue

    return options

########################
# the message processor

# TODO: Embed instead of extend (inheritance -> composition).


class VSCodeMessageProcessorBase(ipcjson.SocketIO, ipcjson.IpcChannel):
    """The base class for VSC message processors."""

    def __init__(self, socket, notify_closing, timeout=None, own_socket=False):
        super(VSCodeMessageProcessorBase, self).__init__(
            socket=socket,
            own_socket=False,
            timeout=timeout,
        )
        self.socket = socket
        self._own_socket = own_socket
        self._notify_closing = notify_closing

        self.server_thread = None
        self._closing = False
        self._closed = False
        self.readylock = threading.Lock()
        self.readylock.acquire()  # Unlock at the end of start().

        self._connected = threading.Lock()
        self._listening = None
        self._connlock = threading.Lock()

    @property
    def connected(self):  # may send responses/events
        with self._connlock:
            return _util.is_locked(self._connected)

    @property
    def closed(self):
        return self._closed or self._closing

    @property
    def listening(self):
        # TODO: must be disconnected?
        with self._connlock:
            if self._listening is None:
                return False
            return _util.is_locked(self._listening)

    def wait_while_connected(self, timeout=None):
        """Wait until the client socket is disconnected."""
        with self._connlock:
            lock = self._listening
        _util.lock_wait(lock, timeout)  # Wait until no longer connected.

    def wait_while_listening(self, timeout=None):
        """Wait until no longer listening for incoming messages."""
        with self._connlock:
            lock = self._listening
            if lock is None:
                raise RuntimeError('not listening yet')
        _util.lock_wait(lock, timeout)  # Wait until no longer listening.

    def start(self, threadname):
        # event loop
        self._start_event_loop()

        # VSC msg processing loop
        def process_messages():
            self.readylock.acquire()
            with self._connlock:
                self._listening = threading.Lock()
            try:
                self.process_messages()
            except (EOFError, TimeoutError):
                ptvsd.log.exception('Client socket closed', category='I')
                with self._connlock:
                    _util.lock_release(self._listening)
                    _util.lock_release(self._connected)
                self.close()
            except socket.error as exc:
                if exc.errno == errno.ECONNRESET:
                    ptvsd.log.exception('Client socket forcibly closed', category='I')
                    with self._connlock:
                        _util.lock_release(self._listening)
                        _util.lock_release(self._connected)
                    self.close()
                else:
                    raise exc

        self.server_thread = _util.new_hidden_thread(
            target=process_messages,
            name=threadname,
        )
        self.server_thread.start()

        # special initialization
        self.send_event(
            'output',
            category='telemetry',
            output='ptvsd',
            data={'version': __version__},
        )
        self.readylock.release()

    def close(self):
        """Stop the message processor and release its resources."""
        if self.closed:
            return
        self._closing = True
        ptvsd.log.debug('Raw closing')

        self._notify_closing()
        # Close the editor-side socket.
        self._stop_vsc_message_loop()

        # Ensure that the connection is marked as closed.
        with self._connlock:
            _util.lock_release(self._listening)
            _util.lock_release(self._connected)
        self._closed = True

    # VSC protocol handlers

    def send_error_response(self, request, message=None):
        self.send_response(
            request,
            success=False,
            message=message
        )

    # internal methods

    def _set_disconnected(self):
        with self._connlock:
            _util.lock_release(self._connected)

    def _wait_for_server_thread(self):
        if self.server_thread is None:
            return
        if not self.server_thread.is_alive():
            return
        self.server_thread.join(WAIT_FOR_THREAD_FINISH_TIMEOUT)

    def _stop_vsc_message_loop(self):
        self.set_exit()
        self._stop_event_loop()
        if self.socket is not None and self._own_socket:
            try:
                self.socket.shutdown(socket.SHUT_RDWR)
                self.socket.close()
                self._set_disconnected()
            except Exception:
                ptvsd.log.exception('Error on socket shutdown')

    # methods for subclasses to override

    def _start_event_loop(self):
        pass

    def _stop_event_loop(self):
        pass


INITIALIZE_RESPONSE = dict(
    supportsCompletionsRequest=True,
    supportsConditionalBreakpoints=True,
    supportsConfigurationDoneRequest=True,
    supportsDebuggerProperties=True,
    supportsDelayedStackTraceLoading=True,
    supportsEvaluateForHovers=True,
    supportsExceptionInfoRequest=True,
    supportsExceptionOptions=True,
    supportsHitConditionalBreakpoints=True,
    supportsLogPoints=True,
    supportsModulesRequest=True,
    supportsSetExpression=True,
    supportsSetVariable=True,
    supportsValueFormattingOptions=True,
    supportTerminateDebuggee=True,
    supportsGotoTargetsRequest=True,
    exceptionBreakpointFilters=[
        {
            'filter': 'raised',
            'label': 'Raised Exceptions',
            'default': False
        },
        {
            'filter': 'uncaught',
            'label': 'Uncaught Exceptions',
            'default': True
        },
    ],
)


class VSCLifecycleMsgProcessor(VSCodeMessageProcessorBase):
    """Handles adapter lifecycle messages of the VSC debugger protocol."""

    EXITWAIT = 1

    def __init__(
        self, socket, notify_disconnecting, notify_closing,
        notify_launch=None, notify_ready=None, timeout=None, debugging=True,
    ):
        super(VSCLifecycleMsgProcessor, self).__init__(
            socket=socket,
            notify_closing=notify_closing,
            timeout=timeout,
        )
        self._notify_launch = notify_launch or NOOP
        self._notify_ready = notify_ready or NOOP
        self._notify_disconnecting = notify_disconnecting

        self._stopped = False

        # These are needed to handle behavioral differences between VS and VSC
        # https://github.com/Microsoft/VSDebugAdapterHost/wiki/Differences-between-Visual-Studio-Code-and-the-Visual-Studio-Debug-Adapter-Host # noqa
        # VS expects a single stopped event in a multi-threaded scenario.
        self._client_id = None
        self._initialize_received = False

        # adapter state
        self.start_reason = None
        self.debug_options = {}
        self._statelock = threading.Lock()
        self._debugging = debugging
        self._debuggerstopped = False
        self._restart_debugger = False
        self._exitlock = threading.Lock()
        self._exitlock.acquire()  # released in handle_exiting()
        self._exiting = False

    def handle_debugger_stopped(self, wait=None):
        """Deal with the debugger exiting."""
        # Notify the editor that the debugger has stopped.
        if not self._debugging:
            # TODO: Fail?  If this gets called then we must be debugging.
            return

        # We run this in a thread to allow handle_exiting() to be called
        # at the same time.
        def stop():
            if wait is not None:
                wait()
            # Since pydevd is embedded in the debuggee process, always
            # make sure the exited event is sent first.
            self._wait_until_exiting(self.EXITWAIT)
            self._ensure_debugger_stopped()

        t = _util.new_hidden_thread(
            target=stop,
            name='stopping',
            daemon=False,
        )
        t.start()

    def handle_exiting(self, exitcode=None, wait=None):
        """Deal with the debuggee exiting."""
        with self._statelock:
            if self._exiting:
                return
            self._exiting = True

        # Notify the editor that the "debuggee" (e.g. script, app) exited.
        self.send_event('exited', exitCode=exitcode or 0)

        self._waiting = True
        if wait is not None and self.start_reason == 'launch':
            normal, abnormal = self._wait_options()
            cfg = (normal and not exitcode) or (abnormal and exitcode)
            # This must be done before we send a disconnect response
            # (which implies before we close the client socket).
            wait(cfg)

        # If we are exiting then pydevd must have stopped.
        self._ensure_debugger_stopped()

        if self._exitlock is not None:
            _util.lock_release(self._exitlock)

    # VSC protocol handlers

    def on_initialize(self, request, args):
        self._client_id = args.get('clientID', None)
        self._restart_debugger = False
        self._initialize_received = True
        self.send_response(request, **INITIALIZE_RESPONSE)
        self.send_event('initialized')

    def on_attach(self, request, args):
        multiproc.root_start_request = request
        self.start_reason = 'attach'
        self._set_debug_options(args)
        self._handle_launch_or_attach(request, args)
        self.send_response(request)

    def on_launch(self, request, args):
        multiproc.root_start_request = request
        self.start_reason = 'launch'
        self._set_debug_options(args)
        self._notify_launch()
        self._handle_launch_or_attach(request, args)
        self.send_response(request)

    def on_disconnect(self, request, args):
        multiproc.kill_subprocesses()

        debugger_attached.clear()
        self._restart_debugger = args.get('restart', False)

        # TODO: docstring
        if self._debuggerstopped:  # A "terminated" event must have been sent.
            self._wait_until_exiting(self.EXITWAIT)

        status = {'sent': False}

        def disconnect_response():
            if status['sent']:
                return
            self.send_response(request)
            status['sent'] = True

        self._notify_disconnecting(
            pre_socket_close=disconnect_response,
        )
        disconnect_response()

        self._set_disconnected()

        if self.start_reason == 'attach':
            if not self._debuggerstopped:
                self._handle_detach()
        # TODO: We should be able drop the "launch" branch.
        elif self.start_reason == 'launch':
            if not self.closed:
                # Closing the socket causes pydevd to resume all threads,
                # so just terminate the process altogether.
                sys.exit(0)

    # internal methods

    def _set_debug_options(self, args):
        self.debug_options = _extract_debug_options(
            args.get('options'),
            args.get('debugOptions'),
        )

    def _ensure_debugger_stopped(self):
        if not self._debugging:
            return
        with self._statelock:
            if self._debuggerstopped:
                return
            self._debuggerstopped = True
        if not self._restart_debugger:
            # multiproc.initial_request = None
            self.send_event('terminated')

    def _wait_until_exiting(self, timeout):
        lock = self._exitlock
        if lock is None:
            return
        try:
            _util.lock_wait(lock, timeout, 'waiting for process exit')
        except _util.TimeoutError as exc:
            warnings.warn(str(exc))

    # methods related to shutdown

    def _wait_options(self):
        normal = self.debug_options.get('WAIT_ON_NORMAL_EXIT', False)
        abnormal = self.debug_options.get('WAIT_ON_ABNORMAL_EXIT', False)
        return normal, abnormal

    # methods for subclasses to override

    def _process_debug_options(self, opts):
        pass

    def _handle_configurationDone(self, request, args):
        pass

    def _handle_launch_or_attach(self, request, args):
        pass

    def _handle_detach(self):
        pass


class VSCodeMessageProcessor(VSCLifecycleMsgProcessor):
    """IPC JSON message processor for VSC debugger protocol.

    This translates between the VSC debugger protocol and the pydevd
    protocol.
    """

    def __init__(
        self, socket, pydevd_notify, pydevd_request,
        notify_debugger_ready,
        notify_disconnecting, notify_closing,
        timeout=None,
    ):
        super(VSCodeMessageProcessor, self).__init__(
            socket=socket,
            notify_disconnecting=notify_disconnecting,
            notify_closing=notify_closing,
            timeout=timeout,
        )
        self._pydevd_notify = pydevd_notify
        self._pydevd_request = pydevd_request
        self._notify_debugger_ready = notify_debugger_ready

        self._client_os_type = 'WINDOWS' if platform.system() == 'Windows' else 'UNIX'

        self.loop = None
        self.event_loop_thread = None

        # adapter state
        self._detached = False
        self._path_mappings_received = False
        self._path_mappings_applied = False

    def _start_event_loop(self):
        self.loop = futures.EventLoop()
        self.event_loop_thread = _util.new_hidden_thread(
            target=self.loop.run_forever,
            name='EventLoop',
        )
        self.event_loop_thread.start()

    def _stop_event_loop(self):
        self.loop.stop()
        self.event_loop_thread.join(WAIT_FOR_THREAD_FINISH_TIMEOUT)

    def start(self, threadname):
        super(VSCodeMessageProcessor, self).start(threadname)
        if options.multiprocess:
            self.start_subprocess_notifier()

    def start_subprocess_notifier(self):
        self._subprocess_notifier_thread = _util.new_hidden_thread('SubprocessNotifier', self._subprocess_notifier)
        self._subprocess_notifier_thread.start()

    def close(self):
        super(VSCodeMessageProcessor, self).close()
        if options.multiprocess:
            self._subprocess_notifier_thread.join()

    def _subprocess_notifier(self):
        while not self.closed:
            try:
                subprocess_request, subprocess_response = multiproc.subprocess_queue.get(timeout=0.1)
            except queue.Empty:
                continue

            try:
                self.send_event('ptvsd_subprocess', **subprocess_request)
            except Exception:
                pass
            else:
                subprocess_response['incomingConnection'] = True

            multiproc.subprocess_queue.task_done()

    # async helpers

    def async_method(m):
        """Converts a generator method into an async one."""
        m = futures.wrap_async(m)

        def f(self, *args, **kwargs):
            return m(self, self.loop, *args, **kwargs)

        return f

    def async_handler(m):
        """Converts a generator method into a fire-and-forget async one."""
        m = futures.wrap_async(m)

        def f(self, *args, **kwargs):
            return m(self, self.loop, *args, **kwargs)

        return f

    def sleep(self):
        fut = futures.Future(self.loop)
        self.loop.call_soon(lambda: fut.set_result(None))
        return fut

    # PyDevd "socket" entry points (and related helpers)

    def pydevd_notify(self, cmd_id, args, is_json=False):
        return self._pydevd_notify(cmd_id, args, is_json=is_json)

    def pydevd_request(self, cmd_id, args, is_json=False):
        return self._pydevd_request(self.loop, cmd_id, args, is_json=is_json)

    # Instances of this class provide decorators to mark methods as
    # handlers for various # pydevd messages - a decorated method is
    # added to the map with the corresponding message ID, and is
    # looked up there by pydevd event handler below.
    class EventHandlers(dict):

        def handler(self, cmd_id):

            def decorate(f):
                self[cmd_id] = f
                return f

            return decorate

    pydevd_events = EventHandlers()

    def on_pydevd_event(self, cmd_id, seq, args):
        if not self._detached:
            try:
                try:
                    f = self.pydevd_events[cmd_id]
                except KeyError:
                    raise UnsupportedPyDevdCommandError(cmd_id)
                return f(self, seq, args)
            except:
                ptvsd.log.exception('Error handling pydevd event: {0}', args)
                raise
        else:
            return None

    def _wait_for_pydevd_ready(self):
        pass

    def _ensure_pydevd_requests_handled(self):
        pass

    # VSC protocol handlers

    @async_handler
    def on_configurationDone(self, request, args):
        self._process_debug_options(self.debug_options)

        self._forward_request_to_pydevd(request, args, send_response=False)
        debugger_attached.set()

        self._notify_debugger_ready()

        self._notify_ready()
        self.send_response(request)

    def _process_debug_options(self, opts):
        """Process the launch arguments to configure the debugger."""
        if opts.get('MULTIPROCESS', False):
            if not options.multiprocess:
                options.multiprocess = True
                multiproc.listen_for_subprocesses()
                self.start_subprocess_notifier()

    def _get_new_setDebuggerProperty_request(self, **kwargs):
        return {
            "command": "setDebuggerProperty",
            "arguments": kwargs,
            "type": "request",
            # "seq": seq_id, # A new seq should be created for pydevd.
        }

    @async_handler
    def _handle_launch_or_attach(self, request, args):
        self._path_mappings_received = True

        client_os_type = self.debug_options.get('CLIENT_OS_TYPE', '').upper().strip()
        if client_os_type and client_os_type not in ('WINDOWS', 'UNIX'):
            ptvsd.log.warn('Invalid CLIENT_OS_TYPE passed: %s (must be either "WINDOWS" or "UNIX").' % (client_os_type,))
            client_os_type = ''

        if not client_os_type:
            for pathMapping in args.get('pathMappings', []):
                localRoot = pathMapping.get('localRoot', '')
                if localRoot:
                    if localRoot.startswith('/'):
                        client_os_type = 'UNIX'
                        break

                    if re.match('^([a-zA-Z]):', localRoot):  # Match drive letter
                        client_os_type = 'WINDOWS'
                        break

        if not client_os_type:
            client_os_type = 'WINDOWS' if platform.system() == 'Windows' else 'UNIX'

        self._client_os_type = client_os_type

        dont_trace_request = self._get_new_setDebuggerProperty_request(
            dontTraceStartPatterns=[PTVSD_DIR_PATH],
            dontTraceEndPatterns=['ptvsd_launcher.py'],
            skipSuspendOnBreakpointException=('BaseException',),
            skipPrintBreakpointException=('NameError',),
            multiThreadsSingleNotification=True,
            ideOS=self._client_os_type,
        )
        yield self.pydevd_request(-1, dont_trace_request, is_json=True)

        pydevd_request = copy.deepcopy(request)
        del pydevd_request['seq']  # A new seq should be created for pydevd.
        yield self.pydevd_request(-1, pydevd_request, is_json=True)

        self._path_mappings_applied = True

    def _handle_detach(self):
        ptvsd.log.info('Detaching ...')
        # TODO: Skip if already detached?
        self._detached = True

        # No related pydevd command id (removes all breaks and resumes threads).
        self.pydevd_request(
            -1,
            {"command": "disconnect", "arguments": {}, "type": "request"},
            is_json=True
        )

    @async_handler
    def _resume_all_threads(self):
        request = {
            "command": "continue",
            "arguments": {"threadId": "*"},
            "type": "request"
        }
        yield self.pydevd_request(-1, request, is_json=True)

    @async_handler
    def _forward_request_to_pydevd(self, request, args, send_response=True):
        pydevd_request = copy.deepcopy(request)
        del pydevd_request['seq']  # A new seq should be created for pydevd.
        cmd_id = -1  # It's actually unused on json requests.
        _, _, resp_args = yield self.pydevd_request(cmd_id, pydevd_request, is_json=True)

        if send_response:
            if not resp_args.get('success'):
                self.send_error_response(request, message=resp_args.get('message', ''))
            else:
                body = resp_args.get('body')
                if body is None:
                    body = {}
                self.send_response(request, **body)

    def on_threads(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_source(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_stackTrace(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_scopes(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_variables(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_setVariable(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_evaluate(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_setExpression(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_modules(self, request, args):
        self._forward_request_to_pydevd(request, args)

    @async_handler
    def on_pause(self, request, args):
        # Pause requests cannot be serviced until pydevd is fully initialized.
        if not debugger_attached.isSet():
            self.send_response(
                request,
                success=False,
                message='Cannot pause while debugger is initializing',
            )
            return

        pydevd_request = copy.deepcopy(request)
        del pydevd_request['seq']  # A new seq should be created for pydevd.
        try:
            pydevd_request['arguments']['threadId'] = '*'
        except KeyError:
            pydevd_request['arguments'] = {'threadId': '*'}

        # Always suspend all threads.
        self.pydevd_request(pydevd_comm.CMD_THREAD_SUSPEND,
                            pydevd_request, is_json=True)
        self.send_response(request)

    @async_handler
    def on_continue(self, request, args):

        pydevd_request = copy.deepcopy(request)
        del pydevd_request['seq']  # A new seq should be created for pydevd.
        try:
            pydevd_request['arguments']['threadId'] = '*'
        except KeyError:
            pydevd_request['arguments'] = {'threadId': '*'}

        # Always continue all threads.
        self.pydevd_request(pydevd_comm.CMD_THREAD_RUN,
                            pydevd_request, is_json=True)
        self.send_response(request, allThreadsContinued=True)

    def on_next(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_stepIn(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_stepOut(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_gotoTargets(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_goto(self, request, args):
        self._forward_request_to_pydevd(request, args)

    @async_handler
    def on_setBreakpoints(self, request, args):
        if not self._path_mappings_received:
            self.send_error_response(request, "'setBreakpoints' request must be issued after 'launch' or 'attach' request.")
            return

        # There might be a concurrent 'launch' or 'attach' request in flight that hasn't
        # gotten to processing path mappings yet. If so, spin until it finishes that.
        while not self._path_mappings_applied:
            yield self.sleep()

        self._forward_request_to_pydevd(request, args)

    def on_setExceptionBreakpoints(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_exceptionInfo(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_completions(self, request, args):
        self._forward_request_to_pydevd(request, args)

    def on_setPydevdSourceMap(self, request, args):
        self._forward_request_to_pydevd(request, args)

    # Custom ptvsd message
    @async_handler
    def on_ptvsd_systemInfo(self, request, args):
        sys_info = {
            'ptvsd': {
                'version': __version__,
            },
        }
        pydevd_request = copy.deepcopy(request)
        pydevd_request['command'] = 'pydevdSystemInfo'
        del pydevd_request['seq']  # A new seq should be created for pydevd.
        cmd_id = -1  # It's actually unused on json requests.
        _, _, resp_args = yield self.pydevd_request(cmd_id, pydevd_request, is_json=True)

        if not resp_args.get('success'):
            self.send_error_response(request, message=resp_args.get('message', ''))
        else:
            body = resp_args.get('body')
            if body is None:
                body = {}
            sys_info.update(body)
            self.send_response(request, **sys_info)

    # VS specific custom message handlers

    def on_setDebuggerProperty(self, request, args):
        if 'JustMyCodeStepping' in args:
            jmc = int(args.get('JustMyCodeStepping', 0)) > 0
            self.debug_options['DEBUG_STDLIB'] = not jmc

        # TODO: Replace the line below with _forward_request_to_pydevd
        # after fixing https://github.com/Microsoft/ptvsd/issues/1355
        self.send_response(request)

    # PyDevd protocol event handlers

    @pydevd_events.handler(pydevd_comm.CMD_MODULE_EVENT)
    def on_pydevd_module_event(self, seq, args):
        body = args.get('body', {})
        self.send_event('module', **body)

    @pydevd_events.handler(pydevd_comm.CMD_INPUT_REQUESTED)
    def on_pydevd_input_requested(self, seq, args):
        '''
        no-op: if stdin is requested, right now the user is expected to enter
        text in the terminal and the debug adapter doesn't really do anything
        (although in the future it could see that stdin is being requested and
        redirect any evaluation request to stdin).
        '''

    @pydevd_events.handler(pydevd_comm.CMD_THREAD_CREATE)
    def on_pydevd_thread_create(self, seq, args):
        '''
        :param args: dict.
            i.e.:
            {
                'type': 'event',
                'event': 'thread',
                'seq': 4,
                'pydevd_cmd_id': 103
                'body': {'reason': 'started', 'threadId': 'pid_9236_id_2714288164368'},
            }
        '''
        # When we receive the thread on tests (due to a threads request), it's possible
        # that the `debugger_attached` is still unset (but we should report about the
        # thread creation anyways).
        tid = args['body']['threadId']
        self.send_event('thread', reason='started', threadId=tid)

    @pydevd_events.handler(pydevd_comm.CMD_THREAD_KILL)
    def on_pydevd_thread_kill(self, seq, args):
        tid = args['body']['threadId']
        self.send_event('thread', reason='exited', threadId=tid)

    @pydevd_events.handler(pydevd_comm.CMD_PROCESS_EVENT)
    def on_pydevd_process_event(self, seq, args):
        body = args['body']
        self.send_event('process', **body)

    @pydevd_events.handler(pydevd_comm_constants.CMD_THREAD_SUSPEND_SINGLE_NOTIFICATION)
    def on_pydevd_thread_suspend_single_notification(self, seq, args):
        body = args['body']
        self.send_event('stopped', **body)

    @pydevd_events.handler(pydevd_comm_constants.CMD_THREAD_RESUME_SINGLE_NOTIFICATION)
    def on_pydevd_thread_resume_single_notification(self, seq, args):
        if not self._initialize_received:
            return  # This may happen when we disconnect and later reconnect too fast.
        body = args['body']
        if self._client_id not in ('visualstudio', 'vsformac'):
            # In visual studio any step/continue action already marks all the
            # threads as running until a suspend, so, the continued is not
            # needed (and can in fact break the UI in some cases -- see:
            # https://github.com/microsoft/ptvsd/issues/1358).
            # It is however needed in vscode -- see:
            # https://github.com/microsoft/ptvsd/issues/1530.
            self.send_event('continued', **body)

    @pydevd_events.handler(pydevd_comm.CMD_WRITE_TO_CONSOLE)
    def on_pydevd_cmd_write_to_console2(self, seq, args):
        """Handle console output"""
        body = args.get('body', {})
        self.send_event('output', **body)
