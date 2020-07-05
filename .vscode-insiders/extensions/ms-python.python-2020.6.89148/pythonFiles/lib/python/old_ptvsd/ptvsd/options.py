# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

from __future__ import print_function, with_statement, absolute_import

import os


"""ptvsd command-line options that need to be globally available.
"""

log_dir = os.getenv('PTVSD_LOG_DIR')
"""If not None, debugger logs its activity to a file named ptvsd-<pid>.log in
the specified directory, where <pid> is the return value of os.getpid().
"""

target_kind = None
"""One of: None, 'file', 'module', 'code', or 'pid'.
"""

target = None
"""Specifies what to debug.

If target_kind is None, then target is None, indicating that the current process
is the one that is initiating debugger attach to itself.

If target_kind is 'file', then target is a path to the file to run.

If target_kind is 'module', then target is the qualified name of the module to run.

If target_kind is 'code', then target is the code to run.

If target_kind is 'pid', then target is the process ID to attach to.
"""

host = 'localhost'
"""Name or IP address of the network interface used by ptvsd. If runing in server
mode, this is the interface on which it listens for incoming connections. If running
in client mode, this is the interface to which it connects.
"""

port = 5678
"""Port number used by ptvsd. If running in server mode, this is the port on which it
listens for incoming connections. If running in client mode, this is port to which it
connects.
"""

client = False
"""If True, this instance of ptvsd is operating in client mode - i.e. it connects
to the IDE, instead of waiting for an incoming connection from the IDE.
"""

no_debug = False
"""If true, execute the target without debugging.
"""

wait = False
"""If True, wait until the debugger is connected before running any code."
"""

multiprocess = False
"""Whether this ptvsd instance is running in multiprocess mode, detouring creation
of new processes and enabling debugging for them.
"""

subprocess_of = None
"""If not None, the process ID of the parent process (running in multiprocess mode)
that spawned this subprocess.
"""

subprocess_notify = None
"""The port number of the subprocess listener. If specified, a 'ptvsd_subprocess'
notification must be sent to that port once this ptvsd is initialized and ready to
accept a connection from the client.
"""
