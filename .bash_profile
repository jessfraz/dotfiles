#!/bin/bash

# An interactive shell gets everything through .bashrc. A non-interactive
# login shell, where .bashrc returns early, still needs the files themselves.
if [[ $- == *i* ]]; then
	# shellcheck source=/dev/null
	[[ -r ~/.bashrc ]] && source ~/.bashrc
else
	for file in ~/.{functions,bash_prompt,aliases,path,dockerfunc,extra,exports}; do
		if [[ -r "$file" ]] && [[ -f "$file" ]]; then
			# shellcheck source=/dev/null
			source "$file"
		fi
	done
	unset file
fi
