# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import print_function, absolute_import, unicode_literals

import contextlib
import functools
import io
import json
import platform
import os
import string
import sys
import threading
import time
import traceback

import ptvsd
import ptvsd.options


class Formatter(string.Formatter):
    def convert_field(self, value, conversion):
        if conversion == 'j':
            return json.dumps(value, indent=4)
        return super(Formatter, self).convert_field(value, conversion)


lock = threading.Lock()
file = None
formatter = Formatter()
tls = threading.local()


if sys.version_info >= (3, 5):
    clock = time.monotonic
else:
    clock = time.clock


timestamp_zero = clock()

def timestamp():
    return clock() - timestamp_zero


def is_enabled():
    return bool(file)


def write(category, fmt, *args, **kwargs):
    assert category in 'DIWE'
    if not file and category not in 'WE':
        return

    t = timestamp()

    try:
        message = formatter.format(fmt, *args, **kwargs)
    except Exception:
        exception('ptvsd.log.write({0!r}): invalid format string', (category, fmt, args, kwargs))
        raise

    prefix = '{}{:09.3f}: '.format(category, t)
    indent = '\n' + (' ' * len(prefix))
    message = indent.join(message.split('\n'))

    if current_handler():
        prefix += '(while handling {}){}'.format(current_handler(), indent)

    message = prefix + message + '\n\n'
    with lock:
        if file:
            file.write(message)
            file.flush()
        if category in 'WE':
            try:
                sys.__stderr__.write(message)
            except:
                pass


debug = functools.partial(write, 'D')
info = functools.partial(write, 'I')
warn = functools.partial(write, 'W')
error = functools.partial(write, 'E')


def stack(title='Stack trace'):
    stack = '\n'.join(traceback.format_stack())
    debug('{0}:\n\n{1}', title, stack)


def exception(fmt='', *args, **kwargs):
    category = kwargs.pop('category', 'E')
    exc_info = kwargs.pop('exc_info', None)

    if fmt:
        fmt += '\n\n'
    fmt += '{exception}'

    exception = traceback.format_exception(*exc_info) if exc_info else traceback.format_exc()
    write(category, fmt, *args, exception=exception, **kwargs)


def escaped_exceptions(f):
    def g(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except:
            # Must not use try/except here to avoid overwriting the caught exception.
            name = f.__qualname__ if hasattr(f, '__qualname__') else f.__name__
            exception('Exception escaped from {0}', name)
            raise
    return g


def to_file():
    global file

    if ptvsd.options.log_dir and not file:
        filename = ptvsd.options.log_dir + '/ptvsd-{}.log'.format(os.getpid())
        file = io.open(filename, 'w', encoding='utf-8')

    info(
        '{0} {1}\n{2} {3} ({4}-bit)\nptvsd {5}',
        platform.platform(),
        platform.machine(),
        platform.python_implementation(),
        platform.python_version(),
        64 if sys.maxsize > 2**32 else 32,
        ptvsd.__version__,
    )


def current_handler():
    try:
        return tls.current_handler
    except AttributeError:
        tls.current_handler = None
        return None


@contextlib.contextmanager
def handling(what):
    assert current_handler() is None, "Can't handle {} - already handling {}".format(what, current_handler())
    tls.current_handler = what
    try:
        yield
    finally:
        tls.current_handler = None


@contextlib.contextmanager
def suspend_handling():
    what = current_handler()
    tls.current_handler = None
    try:
        yield
    finally:
        tls.current_handler = what
