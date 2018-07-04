#!/bin/bash

# Load .bashrc
file=~/.bashrc
if [[ -r "$file" ]] && [[ -f "$file" ]]; then
	# shellcheck source=/dev/null
	source "$file"
fi
unset file
