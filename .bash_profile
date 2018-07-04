#!/bin/bash

# Load the shell dotfiles, and then some:
for file in ~/.{bashrc}; do
	if [[ -r "$file" ]] && [[ -f "$file" ]]; then
		# shellcheck source=/dev/null
		source "$file"
	fi
done
unset file
