# dotfiles

[![make test](https://github.com/jessfraz/dotfiles/workflows/make%20test/badge.svg)](https://github.com/jessfraz/dotfiles/actions?query=workflow%3A%22make+test%22+branch%3Amaster)

**Table of Contents**

<!-- toc -->

- [About](#about)
  * [Installing](#installing)
  * [Customizing](#customizing)
- [Resources](#resources)
  * [`.vim`](#vim)
- [Contributing](#contributing)
  * [Running the tests](#running-the-tests)

<!-- tocstop -->

## About

### Installing

For Nix, import `homeManagerModules.default` from this flake through Home
Manager. The host configuration supplies the username, home directory, and
state version. [global-nix](https://github.com/jessfraz/global-nix) also enables
Bash completion and installs the Zoo and rustup completion files used by the
`.nixbash` startup fragment.

For the legacy Linux installation:

```console
$ make
```

This will create symlinks from this repo to your home folder.

### Customizing

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

## Resources

### `.vim`

For my `.vimrc` and `.vim` dotfiles see
[github.com/jessfraz/.vim](https://github.com/jessfraz/.vim).

## Contributing

### Running the tests

Run the native Nix checks, including a complete Home Manager fixture and an
editor smoke test:

```console
$ nix flake check --no-update-lock-file
```

CI builds these checks on x86-64 Linux, ARM Linux, and ARM macOS. The
`homeConfigurations` outputs are test fixtures, not host profiles; do not
activate them.

The shell scripts are also checked with
[shellcheck](https://github.com/koalaman/shellcheck) in a container:

```console
$ make test
```
