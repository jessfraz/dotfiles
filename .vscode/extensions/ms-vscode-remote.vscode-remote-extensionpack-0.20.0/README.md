# Visual Studio Code Remote Development Extension Pack

The **Remote Development** extension pack allows you to open any folder in a container, on a remote machine, or in the [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl) and take advantage of VS Code's full feature set. Since this lets you set up a full-time development environment anywhere, you can:

- Develop on the same operating system you deploy to or use larger, faster, or more specialized hardware than your local machine.
- Quickly swap between different, isolated development environments and safely make updates without worrying about impacting your local machine.
- Help new team members / contributors get productive quickly with easily spun up, consistent development containers.
- Take advantage of a Linux based tool-chain right from the comfort of Windows from a full-featured development tool.

No source code needs to be on your local machine to gain these benefits since Remote Development runs commands and extensions directly on the remote machine.

This **Remote Development extension pack** includes three extensions:

- **[Remote - SSH](https://aka.ms/vscode-remote/download/ssh)** - Work with source code in any location by opening folders on a remote machine/VM using SSH. Supports x86_64, ARMv7l (AArch32), and ARMv8l (AArch64) glibc-based Linux, Windows 10/Server (1803+), and macOS 10.14+ (Mojave) SSH hosts.
- **[Remote - Containers](https://aka.ms/vscode-remote/download/containers)** - Work with a sandboxed toolchain or container based application by opening any folder mounted into or inside a container.
- **[Remote - WSL](https://aka.ms/vscode-remote/download/wsl)** - Get a Linux-powered development experience from the comfort of Windows by opening any folder in the Windows Subsystem for Linux.

The Remote SSH extension at work:

![Remote SSH](https://microsoft.github.io/vscode-remote-release/images/ssh-readme.gif)

## System Requirements

**Local:** See the minimum requirements for [VS Code](https://code.visualstudio.com/docs/supporting/requirements). Windows support in Remote - Containers requires Windows 10 Professional or Enterprise is due to the requirements of [Docker Desktop](https://www.docker.com/products/docker-desktop). See [installation](#installation) steps for additional details.

**Remote host / container / WSL support:**

- x86_64 / ARMv8l (AArch64) / ARM7l (AArch32) Debian/Raspbian 9+, Ubuntu 16.04+, Ubuntu IoT 18.04+, CentOS / RHEL 7+ SSH hosts, containers, or WSL distributions.
- x86_64 Alpine Linux 3.7+ containers or WSL distributions (no SSH support yet).

**Additional SSH support:**

- Windows 10 / Server 2016/2019 (1803+) using the [official OpenSSH Server](https://docs.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse).
- macOS 10.14+ (Mojave) SSH hosts with [Remote Login enabled](https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac).

Other `glibc` based Linux SSH Hosts, containers, or WSL distributions may work if they have [needed prerequisites](https://aka.ms/vscode-remote/linux).

Some extensions installed on ARMv7l (AArch32) and ARMv8l (AArch64) devices may not work due to the use of `x86` native code in the extension. Similarly, extensions installed in Alpine Linux containers or the Alpine WSL distribution may not work due to `glibc` dependencies in native code inside the extension. See the [Remote Development and Linux](https://aka.ms/vscode-remote/linux) article for details.

## Installation

1. Install [VS Code](https://code.visualstudio.com) or [VS Code Insiders](https://code.visualstudio.com/insiders) and this extension pack.  On Windows, be sure to check  **Add to PATH** when asked to **Select Additional Tasks** during installation.

2. **Remote - SSH:** Install [an OpenSSH compatible SSH client](https://aka.ms/vscode-remote/ssh/supported-clients).

3. **Remote - WSL:** Install the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) along with your preferred Linux distribution. (Note that WSL2 support is **experimental**.)

4. **Remote - Containers:** Install and configure [Docker](https://www.docker.com/get-started) for your operating system.

   **Windows / macOS:**
    1. Install [Docker Desktop 2.0+ for Mac/Windows](https://www.docker.com/products/docker-desktop). (Docker Toolbox is not supported, but Docker does not need to be running if you [use a remote host](https://aka.ms/vscode-remote/containers/remote-host).)
    2. Right-click on the Docker task bar item and update **Settings / Preferences > Shared Drives / File Sharing** with any source code locations you want to open in a container. See [tips and tricks](https://aka.ms/vscode-remote/containers/troubleshooting) for details.

    **Linux:**
    1. Follow the [official install instructions for Docker CE/EE 18.06+](https://docs.docker.com/install/#supported-platforms). If you use Docker Compose, follow the [Docker Compose 1.21+ install directions](https://docs.docker.com/compose/install/).
    2. Add your user to the `docker` group by using a terminal to run: `sudo usermod -aG docker $USER` Sign out and back in again so this setting takes effect.

**Working with Git?** Here are three tips to consider:

- If you are working with the same repository folder in Windows and WSL or a container, be sure to set up consistent line endings. See [tips and tricks](https://aka.ms/vscode-remote/containers/troubleshooting/crlf) to learn how.
- In WSL, you can also avoid passwords by configuring WSL to use the Windows Git credential manager. See [tips and tricks](https://aka.ms/vscode-remote/wsl/troubleshooting/cred-manager) to for details.
- For containers, if you clone using a Git credential manager, your container should already have access to your credentials! If you use SSH keys, you can also opt-in to sharing them. See [Sharing Git credentials with your container](https://aka.ms/vscode-remote/containers/git) for details.

## Getting started

Check out one of the following quick starts to get going.

- [WSL: Tutorial](https://aka.ms/vscode-remote/wsl/tutorial)
- [SSH: Tutorial](https://aka.ms/vscode-remote/ssh/tutorial)
- [SSH: Getting started](https://aka.ms/vscode-remote/ssh/getting-started)
- [Containers: Tutorial](https://aka.ms/vscode-remote/containers/tutorial)
- [Containers: Use a container as your full-time environment](https://aka.ms/vscode-remote/containers/getting-started/open)
- [Containers: Attach to a running container](https://aka.ms/vscode-remote/containers/getting-started/attach)
- [Containers (Advanced): Use a remote Docker host](https://aka.ms/vscode-remote/containers/remote-host)

### Available commands

Another way to learn what you can do with the Remote Development extensions is to browse the commands each of them provide. Press `F1` to bring up the Command Palette and type in `Remote-` for a full list of commands.

![Command palette](https://microsoft.github.io/vscode-remote-release/images/remote-command-palette.png)

You can also click on the Remote "Quick Access" status bar item in the lower left corner to get a list of the most common commands.

![Quick actions status bar item](https://microsoft.github.io/vscode-remote-release/images/remote-dev-status-bar.png)

For more information, please see the [extension pack documentation](https://aka.ms/vscode-remote).

## Questions, Feedback, Contributing

Have a question or feedback?

- See the [documentation](https://aka.ms/vscode-remote) or the [troubleshooting guide](https://aka.ms/vscode-remote/troubleshooting).
- [Up-vote a feature or request a new one](https://aka.ms/vscode-remote/feature-requests), search [existing issues](https://aka.ms/vscode-remote/issues), or [report a problem](https://aka.ms/vscode-remote/issues/new).
- Contribute a [development container definition](https://aka.ms/vscode-dev-containers) for others to use
- Contribute to [our documentation](https://github.com/Microsoft/vscode-docs)
- ...and more. See our [CONTRIBUTING](https://aka.ms/vscode-remote/contributing) guide for details.

Or connect with the community...

[![Twitter](https://microsoft.github.io/vscode-remote-release/images/Twitter_Social_Icon_24x24.png)](https://aka.ms/vscode-remote/twitter) [![Stack Overflow](https://microsoft.github.io/vscode-remote-release/images/so-image-24x24.png)](https://stackoverflow.com/questions/tagged/vscode) [![VS Code Dev Community Slack](https://microsoft.github.io/vscode-remote-release/images/Slack_Mark-24x24.png)](https://aka.ms/vscode-dev-community) [![VS CodeGitter](https://microsoft.github.io/vscode-remote-release/images/gitter-icon-24x24.png)](https://gitter.im/Microsoft/vscode)

## Telemetry

The Visual Studio Code Remote Development extension pack and its related extensions collect telemetry data to help us build a better experience working remotely from VS Code. We only collect data on which commands are executed. We do not collect any information about image names, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in the [Visual Studio Code FAQ](https://aka.ms/vscode-remote/telemetry).

## License

By downloading and using the Visual Studio Remote Development extension pack and its related components, you agree to the product [license terms](https://go.microsoft.com/fwlink/?linkid=2077057) and [privacy statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx).
