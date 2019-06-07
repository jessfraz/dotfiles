#!/bin/bash

# Load .bashrc, which loads: ~/.{bash_prompt,aliases,functions,path,dockerfunc,extra,exports}
if [[ -r "~/.bashrc" ]]; then
	# shellcheck source=/dev/null
	source "~/.bashrc"
fi
