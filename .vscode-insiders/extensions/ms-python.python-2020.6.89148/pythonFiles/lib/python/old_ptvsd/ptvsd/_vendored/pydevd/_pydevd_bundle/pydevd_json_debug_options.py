import sys
import platform
try:
    import urllib
    urllib.unquote  # noqa
except Exception:
    import urllib.parse as urllib


def bool_parser(s):
    return s in ("True", "true", "1")


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


def _build_debug_options(flags):
    """Build string representation of debug options from the launch config."""
    return ';'.join(DEBUG_OPTIONS_BY_FLAG[flag]
                    for flag in flags or []
                    if flag in DEBUG_OPTIONS_BY_FLAG)


def _parse_debug_options(opts):
    """Debug options are semicolon separated key=value pairs
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
