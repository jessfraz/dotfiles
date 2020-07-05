# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root
# for license information.

import ptvsd.log
import ptvsd.options
from ptvsd.__main__ import run_file, run_module, run_code


RUNNERS = {
    'module': run_module,
    'script': run_file,
    'code': run_code,
}

# Not actually used, but VS will try to add entries to it.
DONT_DEBUG = []


# A legacy entrypoint for Visual Studio, to allow older versions to work with new ptvsd.
# All new code should use the entrypoints in __main__ directly.
def debug(filename, port_num, debug_id, debug_options, run_as):
    ptvsd.log.to_file()
    ptvsd.log.info('debug{0!r}', (filename, port_num, debug_id, debug_options, run_as))

    try:
        run = RUNNERS[run_as]
    except KeyError:
        raise ValueError('run_as must be one of: {0!r}'.format(tuple(RUNNERS.keys())))

    ptvsd.options.target_kind = 'file' if run_as == 'script' else run_as
    ptvsd.options.target = filename
    ptvsd.options.port = port_num
    ptvsd.options.client = True

    # debug_id is ignored because it has no meaning in DAP.
    # debug_options are ignored, because they will be passed later via DAP "launch" request.

    run()
