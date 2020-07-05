# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import print_function, with_statement, absolute_import

import sys
import threading
import traceback

import ptvsd.log
from ptvsd.reraise import reraise


class Future(object):
    # TODO: docstring

    def __init__(self, loop):
        self._lock = threading.Lock()
        self._loop = loop
        self._done = None
        self._observed = False
        self._done_callbacks = []
        self._exc_info = None
        self._handling = ptvsd.log.current_handler()

        # It's expensive, so only capture the origin if logging is enabled.
        if ptvsd.log.is_enabled():
            self._origin = traceback.extract_stack()
        else:
            self._origin = None

    def __del__(self):
        # Do not run any checks if Python is shutting down.
        if not sys or not self._lock:
            return

        with self._lock:
            assert self._done or self._done is None
            exc_info = self._exc_info
            if exc_info and not self._observed:
                msg = 'Unobserved failed future'
                origin = self._origin
                if origin:
                    origin = '\n'.join(traceback.format_list(origin))
                    msg += ' originating from:\n\n{origin}\n\n'
                ptvsd.log.exception(msg, origin=origin, exc_info=exc_info)
                traceback.print_exception(*exc_info, file=sys.__stderr__)

    def result(self):
        # TODO: docstring
        with self._lock:
            self._observed = True
            if self._exc_info:
                reraise(self._exc_info)
            return self._result

    def exc_info(self):
        # TODO: docstring
        with self._lock:
            self._observed = True
            return self._exc_info

    def set_result(self, result):
        # TODO: docstring
        with self._lock:
            self._result = result
            self._exc_info = None
            self._done = True
            callbacks = list(self._done_callbacks)

        def invoke_callbacks():
            for cb in callbacks:
                cb(self)

        self._loop.call_soon(invoke_callbacks)

    def set_exc_info(self, exc_info):
        # TODO: docstring
        with self._lock:
            self._exc_info = exc_info
            self._done = True
            callbacks = list(self._done_callbacks)

        def invoke_callbacks():
            for cb in callbacks:
                cb(self)

        self._loop.call_soon(invoke_callbacks)

    def add_done_callback(self, callback):
        # TODO: docstring
        with self._lock:
            done = self._done
            self._done_callbacks.append(callback)
        if done:
            self._loop.call_soon(lambda: callback(self))

    def remove_done_callback(self, callback):
        # TODO: docstring
        with self._lock:
            self._done_callbacks.remove(callback)


class EventLoop(object):
    # TODO: docstring

    def __init__(self):
        self._queue = []
        self._lock = threading.Lock()
        self._event = threading.Event()
        self._event.set()

        self._stop = False

    def create_future(self):
        return Future(self)

    def run_forever(self):
        try:
            while not self._stop:
                if not self._event.wait(timeout=0.1):
                    continue
                with self._lock:
                    queue = self._queue
                    self._queue = []
                    self._event.clear()
                for (f, args) in queue:
                    f(*args)
        except:
            if sys is None or traceback is None:
                # Errors during shutdown are expected as this is a daemon thread,
                # so just silence it. We can't even log it at this point.
                pass
            else:
                # Try to log it, but guard against the possibility of shutdown
                # in the middle of it.
                try:
                    ptvsd.log.exception('Exception escaped to event loop')
                except:
                    pass

    def stop(self):
        self._stop = True

    def call_soon(self, f, *args):
        with self._lock:
            self._queue.append((f, args))
            self._event.set()

    def call_soon_threadsafe(self, f, *args):
        return self.call_soon(f, *args)


class Result(object):
    # TODO: docstring

    __slots__ = ['value']

    def __init__(self, value):
        self.value = value


def wrap_async(f):
    def g(self, loop, *args, **kwargs):
        it = f(self, *args, **kwargs)
        result = Future(loop)
        if it is None:
            result.set_result(None)
            return result

        async_handler = ptvsd.log.current_handler()

        def resume(fut):
            try:
                if fut is None:
                    x = next(it)
                else:
                    exc_info = fut.exc_info()
                    if exc_info:
                        x = it.throw(*exc_info)
                    else:
                        x = it.send(fut.result())
            except AssertionError:
                raise
            except StopIteration:
                result.set_result(None)
            except:
                result.set_exc_info(sys.exc_info())
            else:
                if isinstance(x, Result):
                    result.set_result(x.value)
                else:
                    def callback(fut):
                        with ptvsd.log.handling(async_handler):
                            resume(fut)
                    x.add_done_callback(callback)

        resume(None)
        return result

    return g
