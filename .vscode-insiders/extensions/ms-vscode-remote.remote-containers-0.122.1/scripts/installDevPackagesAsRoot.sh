#!/bin/sh
set -ex

# Install libraries and tools
if [ "$VSCODE_ARCH" = "x64" ]
then
	apt-get update
	apt-get install -y \
		curl \
		make \
		gcc \
		g++ \
		python2.7 \
		libx11-dev \
		libxkbfile-dev \
		libsecret-1-dev \
		xz-utils
	rm -rf /var/lib/apt/lists/*
elif [ "$VSCODE_ARCH" = "alpine" ]
then
	apk update
	apk add \
		g++ \
		python \
		make \
		git \
		bash \
		curl
fi
