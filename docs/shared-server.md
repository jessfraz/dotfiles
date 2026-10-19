# Using these dotfiles on a shared server account

Some servers have one Linux account, such as `ubuntu`, that several people
log into. Everyone on it shares the same home directory, shell setup and git
configuration. This page covers installing the dotfiles there and working on
the account without stepping on each other.

## Installing, once per server

Log in as the shared account and run:

```console
git clone https://github.com/kuzeko/dotfiles.git
cd dotfiles
git checkout -b local
make dotfiles
```

On Linux, `make` defaults to `PROFILE=server`: shell and git configuration
only, without the X11 and i3 files or the `.dockerfunc` container wrappers.
It also writes `~/.gitconfig` as a file that includes the repository's
`.gitconfig`, refuses to commit without an identity, and turns commit signing
off.

Run `make dotfiles` only. Plain `make` also links the `bin/` scripts into
`/usr/local/bin` with sudo, and `make etc` replaces system files such as
`/etc/ssh/sshd_config`.

Leave `.extra` as the template it is in the repository: whatever goes in it
applies to everyone on the account.

To update the server after a change is merged on `main`:

```console
cd ~/dotfiles
git fetch origin
git merge --ff-only origin/main
```

## Connecting

```console
ssh ubuntu@<server>
```

To push or pull private repositories over SSH from the server, forward your
agent instead of copying a key to it:

```console
ssh -A ubuntu@<server>
```

While you are connected with `-A`, anyone else logged into the same account
can use your forwarded agent. Disconnect when you are done. Never copy a
private key to the server, and never run `make keygen` there: a key in the
shared home belongs to everyone who logs in.

## Your git identity

Set it once per session, before your first commit:

```console
iam "Your Name" you@example.com
```

It lasts until you log out and is visible to your session only. Without it,
git stops with "Author identity unknown".

Never run `git config --global user.name` or `user.email` on the server, nor
`git config user.*` inside a shared clone: both set the identity for everyone
who commits there afterwards.

Commits made on the server are unsigned.

## Sharing the account

- Bash history is shared. Never type a password or token on the command line.
- Name your tmux session after yourself, and reattach to it by name:

  ```console
  tmux new -s <your-name>
  tmux attach -t <your-name>
  ```

- Change the dotfiles through a pull request on the repository, not by editing
  `~/dotfiles` on the server. The update steps above then bring it in.
