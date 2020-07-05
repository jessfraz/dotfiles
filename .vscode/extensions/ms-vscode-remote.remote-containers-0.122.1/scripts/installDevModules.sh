#!/bin/bash
set -ex

mkdir -p "$HOME/bin"

# Install Node
export NODE_VERSION=12.4.0
if [ "$VSCODE_ARCH" = "x64" ]
then
	curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz"
	tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C "$HOME" --no-same-owner
	ln -s "$HOME/node-v$NODE_VERSION-linux-x64/bin/node" "$HOME/bin/node"
	rm "node-v$NODE_VERSION-linux-x64.tar.xz"
fi

# Install Yarn
export YARN_VERSION=1.16.0
curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz"
tar -xzf "yarn-v$YARN_VERSION.tar.gz" -C "$HOME"
ln -s "$HOME/yarn-v$YARN_VERSION/bin/yarn" "$HOME/bin/yarn"
ln -s "$HOME/yarn-v$YARN_VERSION/bin/yarnpkg" "$HOME/bin/yarnpkg"
rm "yarn-v$YARN_VERSION.tar.gz"

# Compile native /remote node_modules
export PATH="$HOME/bin:$PATH"
export PYTHON=/usr/bin/python2.7
if [ "$VSCODE_ARCH" = "alpine" ]
then
	yarn global add node-gyp
	yarn remove keytar
fi
yarn --ignore-optional
