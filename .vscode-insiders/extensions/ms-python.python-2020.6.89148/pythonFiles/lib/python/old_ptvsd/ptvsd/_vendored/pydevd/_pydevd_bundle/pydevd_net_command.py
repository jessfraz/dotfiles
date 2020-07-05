from _pydev_imps._pydev_saved_modules import threading
from _pydevd_bundle.pydevd_constants import DebugInfoHolder, IS_PY2, \
    get_global_debugger, GetGlobalDebugger, set_global_debugger  # Keep for backward compatibility @UnusedImport
from _pydevd_bundle.pydevd_utils import quote_smart as quote, to_string
from _pydevd_bundle.pydevd_comm_constants import ID_TO_MEANING
from _pydevd_bundle.pydevd_constants import HTTP_PROTOCOL, HTTP_JSON_PROTOCOL, \
    get_protocol, IS_JYTHON
import json
from _pydev_bundle import pydev_log


class _NullNetCommand(object):

    id = -1

    def send(self, *args, **kwargs):
        pass


# Constant meant to be passed to the writer when the command is meant to be ignored.
NULL_NET_COMMAND = _NullNetCommand()


class NetCommand:
    """
    Commands received/sent over the network.

    Command can represent command received from the debugger,
    or one to be sent by daemon.
    """
    next_seq = 0  # sequence numbers

    _showing_debug_info = 0
    _show_debug_info_lock = threading.RLock()

    def __init__(self, cmd_id, seq, text, is_json=False):
        """
        If sequence is 0, new sequence will be generated (otherwise, this was the response
        to a command from the client).
        """
        protocol = get_protocol()
        self.id = cmd_id
        if seq == 0:
            NetCommand.next_seq += 2
            seq = NetCommand.next_seq

        self.seq = seq

        if is_json:
            if hasattr(text, 'to_dict'):
                as_dict = text.to_dict(update_ids_to_dap=True)
            else:
                assert isinstance(text, dict)
                as_dict = text
            as_dict['pydevd_cmd_id'] = cmd_id
            as_dict['seq'] = seq
            text = json.dumps(as_dict)

        if IS_PY2:
            if isinstance(text, unicode):
                text = text.encode('utf-8')
            else:
                assert isinstance(text, str)
        else:
            assert isinstance(text, str)

        if DebugInfoHolder.DEBUG_TRACE_LEVEL >= 1:
            self._show_debug_info(cmd_id, seq, text)

        if is_json:
            msg = text
        else:
            if protocol not in (HTTP_PROTOCOL, HTTP_JSON_PROTOCOL):
                encoded = quote(to_string(text), '/<>_=" \t')
                msg = '%s\t%s\t%s\n' % (cmd_id, seq, encoded)

            else:
                msg = '%s\t%s\t%s' % (cmd_id, seq, text)

        if IS_PY2:
            assert isinstance(msg, str)  # i.e.: bytes
            as_bytes = msg
        else:
            if isinstance(msg, str):
                msg = msg.encode('utf-8')

            assert isinstance(msg, bytes)
            as_bytes = msg
        self._as_bytes = as_bytes

    def send(self, sock):
        as_bytes = self._as_bytes
        try:
            if get_protocol() in (HTTP_PROTOCOL, HTTP_JSON_PROTOCOL):
                sock.sendall(('Content-Length: %s\r\n\r\n' % len(as_bytes)).encode('ascii'))
            sock.sendall(as_bytes)
        except:
            if IS_JYTHON:
                # Ignore errors in sock.sendall in Jython (seems to be common for Jython to
                # give spurious exceptions at interpreter shutdown here).
                pass
            else:
                raise

    @classmethod
    def _show_debug_info(cls, cmd_id, seq, text):
        with cls._show_debug_info_lock:
            # Only one thread each time (rlock).
            if cls._showing_debug_info:
                # avoid recursing in the same thread (just printing could create
                # a new command when redirecting output).
                return

            cls._showing_debug_info += 1
            try:
                out_message = 'sending cmd --> '
                out_message += "%20s" % ID_TO_MEANING.get(str(cmd_id), 'UNKNOWN')
                out_message += ' '
                out_message += text.replace('\n', ' ')
                try:
                    pydev_log.critical('%s\n', out_message)
                except:
                    pass
            finally:
                cls._showing_debug_info -= 1

