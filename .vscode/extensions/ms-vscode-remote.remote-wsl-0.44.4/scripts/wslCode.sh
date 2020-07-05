#!/usr/bin/env sh
#
# Copyright (c) Microsoft Corporation. All rights reserved.
COMMIT=$1
QUALITY=$2
WIN_CODE_CMD=$3
APP_NAME=$4
DATAFOLDER=$5

shift 5

if [ "$VSCODE_WSL_DEBUG_INFO" = true ]; then
	set -x
fi

if [ -z "$DATAFOLDER" ]; then
	DATAFOLDER=".vscode-remote"
else
	DATAFOLDER="$(echo $DATAFOLDER | sed -e 's/.vscode/.vscode-server/g')"
fi

VSCODE_REMOTE_BIN="$HOME/$DATAFOLDER/bin"
AUTHORITY="wsl+default"

if [ "$WSL_DISTRO_NAME" ]; then
	AUTHORITY="wsl+$WSL_DISTRO_NAME"
else
	PROBE=$(mktemp /tmp/vscode-distro-probe.XXXXXX)
	if [ -x "$(command -v wsl.exe)" ]; then
		PROBE_RESULT=$(wsl.exe sh -c "[ -f $PROBE ] && echo 'Found'" | tr -d '\0')
		if [ "$PROBE_RESULT" != "Found" ]; then
			echo "For the current version of WSL, VS Code Remote - WSL can be opened from the command line only from the default distro. Use 'wslconfig.exe' to configure the default distro. Alternatively update your version of WSL by updating Windows 10 to the May 19 Update, version 1903.";
			exit $?
		fi
	else
		echo "wsl.exe not found on PATH, unable to probe whether this is the default distro."
	fi
fi

if [ ! -d "$HOME/$DATAFOLDER" ]; then
	if [  -d "$HOME/.vscode-remote" ]; then
		echo "Migrating .vscode-remote to $DATAFOLDER..."
		mv "$HOME/.vscode-remote" "$HOME/$DATAFOLDER"
	fi
fi

"$(dirname "$0")/wslDownload.sh" "$COMMIT" "$QUALITY" "$VSCODE_REMOTE_BIN"
RC=$?;
if [ $RC -ne 0 ]; then 
	exit $RC
fi

VSCODE_CLIENT_COMMAND=$WIN_CODE_CMD \
VSCODE_CLIENT_COMMAND_CWD="$(dirname "$0")" \
VSCODE_CLI_AUTHORITY=$AUTHORITY \
"$VSCODE_REMOTE_BIN/$COMMIT/bin/$APP_NAME" "$@"