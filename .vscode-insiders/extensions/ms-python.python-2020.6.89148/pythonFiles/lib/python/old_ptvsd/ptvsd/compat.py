# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.


# Python 2.x/3.x compatibility helpers

try:
    import builtins
except ImportError:
    import __builtin__ as builtins # noqa

try:
    import queue
except ImportError:
    import Queue as queue # noqa

try:
    unicode = builtins.unicode
    bytes = builtins.str
except AttributeError:
    unicode = builtins.str
    bytes = builtins.bytes

try:
    xrange = builtins.xrange
except AttributeError:
    xrange = builtins.range
