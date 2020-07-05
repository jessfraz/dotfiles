# zsh support for Terminal.


# Working Directory
#
# Tell the terminal about the current working directory at each prompt.

if [ -z "$INSIDE_EMACS" ]; then

    update_terminal_cwd() {
	# Identify the directory using a "file:" scheme URL, including
	# the host name to disambiguate local vs. remote paths.

	# Percent-encode the pathname.
	local url_path=''
	{
	    # Use LC_CTYPE=C to process text byte-by-byte. Ensure that
	    # LC_ALL isn't set, so it doesn't interfere.
	    local i ch hexch LC_CTYPE=C LC_ALL=
	    for ((i = 1; i <= ${#PWD}; ++i)); do
		ch="$PWD[i]"
		if [[ "$ch" =~ [/._~A-Za-z0-9-] ]]; then
		    url_path+="$ch"
		else
		    printf -v hexch "%02X" "'$ch"
		    url_path+="%$hexch"
		fi
	    done
	}

	printf '\e]7;%s\a' "file://$HOST$url_path"
    }

    # Register the function so it is called at each prompt.
    autoload add-zsh-hook
    add-zsh-hook precmd update_terminal_cwd
fi
