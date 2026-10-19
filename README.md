## dotfiles

[![make test](https://github.com/kuzeko/dotfiles/actions/workflows/make-test.yml/badge.svg)](https://github.com/kuzeko/dotfiles/actions/workflows/make-test.yml)

### To install:

Clone the repo, switch to a local branch where you can do local edits, and run `make`

```console
$ git clone https://github.com/kuzeko/dotfiles.git
$ cd dotfiles
$ git checkout -b local
$ make
```

This will create symlinks from this repo to your home folder.

On Linux, `make` installs the server profile: shell and git configuration
only. For a Linux desktop with X11 and i3, run:

```console
make PROFILE=desktop
```

For a server account that several people log into, follow
[docs/shared-server.md](docs/shared-server.md) instead.

This repo contains also files/configurations to be deployed globally in the `etc` directory.
They may be dangerous for your system, please review the contents in the `etc/`folder before proceeding (e.g., check `etc/ssh/`).

If you want to proceed go with:

```console
$ make etc
```


### To customize:

Save env vars, etc in a `.extra` file, that looks something like
this:

```bash
###
### Git credentials
###

GIT_AUTHOR_NAME="Your Name"
GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
git config --global user.name "$GIT_AUTHOR_NAME"
GIT_AUTHOR_EMAIL="email@you.com"
GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
git config --global user.email "$GIT_AUTHOR_EMAIL"
GH_USER="nickname"
git config --global github.user "$GH_USER"

###
### Gmail credentials for mutt
###
export GMAIL=email@you.com
export GMAIL_NAME="Your Name"
export GMAIL_FROM=from-email@you.com
```

### Missing applications

During installation the `requirements` entrypoint is also performed, this will check if commons utilities are installed.
If missing, you should install them.

For Docker on ubuntu you can check [this handy little guide](install_docker.md).


### SSH Keygen

You can run `make keygen` entrypoint to have a SSH key generated based on the infos in the `.extra` file.
The key will be a of type `ed25519`

### Here be Dragons

This repo is full of features, opinionated confings, scripts, and functions.
I've broken a couple of them after forking (see the `/etc` case).
Each file is fairly documented, if you can understand what the comment is saying.

Things may break unexpectedly because some file somewhere in this repo is overriding some default, you are warned.
Yet, a lot of useful things are introduced, you should really look around (maybe on the original repo).
Every time I do it, I learn something new!


### Other Configuratations

#### `.vim`

For `jessfraz` `.vimrc` and `.vim` dotfiles see
[github.com/jessfraz/.vim](https://github.com/jessfraz/.vim).


#### `.nanorc`

This repo embeds conf files for `nano`.
Yes, I'm not taking any part in the ``Editor War'': when I code, I don't do it in a terminal.


### Tests

The tests use [shellcheck](https://github.com/koalaman/shellcheck). You don't
need to install anything. They run in a container.

```console
$ make test
```
