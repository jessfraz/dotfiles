#!/bin/bash
# Installs the dotfiles into a throwaway home, then checks that a login shell
# starts without errors and that PATH holds no duplicates, in a nested shell
# too. Extra arguments go to make, e.g. ./test-install.sh PROFILE=desktop
set -e
set -o pipefail

home=$(mktemp -d)
mkdir -p "${home}/.gnupg"
make dotfiles HOME="${home}" "$@"

login_shell() {
	env -i HOME="${home}" TERM=xterm-256color PATH=/usr/bin:/bin USER="$(id -un)" \
		bash -l -i -c "$1" 2> "${home}/stderr"
	if grep -E 'command not found|syntax error|unbound variable|bad substitution|No such file or directory' "${home}/stderr"; then
		echo "the login shell printed errors" >&2
		exit 1
	fi
}

# Written to a file because the shell may also print warnings on stdout.
duplicates="tr ':' '\\n' <<< \"\$PATH\" | sort | uniq -d >> ${home}/dups"
login_shell "${duplicates}"
login_shell "bash -l -i -c \"${duplicates}\" 2>/dev/null"
if [[ -s "${home}/dups" ]]; then
	echo "PATH has duplicate entries:" >&2
	cat "${home}/dups" >&2
	exit 1
fi
echo "login shell OK"
