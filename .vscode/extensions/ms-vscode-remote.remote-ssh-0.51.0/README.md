# Visual Studio Code Remote - SSH

The **Remote - SSH** extension lets you use any remote machine with a SSH server as your development environment. This can greatly simplify development and troubleshooting in a wide variety of situations. You can:

- Develop on the same operating system you deploy to or use larger, faster, or more specialized hardware than your local machine.
- Quickly swap between different, remote development environments and safely make updates without worrying about impacting your local machine.
- Access an existing development environment from multiple machines or locations.
- Debug an application running somewhere else such as a customer site or in the cloud.

No source code needs to be on your local machine to gain these benefits since the extension runs commands and other extensions directly on the remote machine. You can open any folder on the remote machine and work with it just as you would if the folder were on your own machine.

![Remote SSH](https://microsoft.github.io/vscode-remote-release/images/ssh-readme.gif)

## SSH Host Requirements

You can connect to a running SSH server on the following platforms.

**Supported**:

- x86_64 Debian 8+, Ubuntu 16.04+, CentOS / RHEL 7+ Linux.
- ARMv7l (AArch32) Raspbian Stretch/9+ (32-bit).
- ARMv8l (AArch64) Ubuntu 18.04+ (64-bit).
- Windows 10 / Server 2016/2019 (1803+) using the [official OpenSSH Server](https://docs.microsoft.com/windows-server/administration/openssh/openssh_install_firstuse).
- macOS 10.14+ (Mojave) SSH hosts with [Remote Login enabled](https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac).

Other `glibc` based Linux distributions for x86_64, ARMv7l (AArch32), and ARMv8l (AArch64) should work if they have the needed prerequisites. See the [Remote Development with Linux](https://aka.ms/vscode-remote/linux) article for information prerequisites and tips for getting community supported distributions up and running.

While ARMv7l (AArch32) and ARMv8l (AArch64) support is available, some extensions installed on these devices may not work due to the use of x86 native code in the extension.

## Installation

1. Install [VS Code](https://code.visualstudio.com/) or [VS Code - Insiders](https://code.visualstudio.com/insiders) and this extension.

2. Install [an OpenSSH compatible SSH client](https://aka.ms/vscode-remote/ssh/supported-clients).

3. If you do not have a SSH host set up, follow the directions for [Linux](https://aka.ms/vscode-remote/ssh/ssh-server), [Windows 10 / Server (1803+)](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse), or [macOS](https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac) or create a [VM on Azure](https://docs.microsoft.com/azure/virtual-machines/linux/quick-create-portal?toc=%2fazure%2fvirtual-machines%2flinux%2ftoc.json).

## Getting started

**[Follow the step-by-step tutorial](https://aka.ms/vscode-remote/ssh/tutorial)** or if you have a simple SSH host setup, connect to it as follows:

1. Press `F1` and run the **Remote-SSH: Open SSH Host...** command.
2. Enter your user and host/IP in the following format in the input box that appears and press enter: `user@host-or-ip` or `user@domain@host-or-ip`
3. If prompted, enter your password (but we suggest setting up [key based authentication](https://aka.ms/vscode-remote/ssh/key-based-auth)).
4. After you are connected, use **File > Open Folder** to open a folder on the host.

You can press `F1` to bring up the Command Palette and type in `Remote-SSH` for a full list of available commands.

![Command palette](https://microsoft.github.io/vscode-remote-release/images/remote-ssh-command-palette.png)

You can also click on the Remote "Quick Access" status bar item in the lower left corner to get a list of the most common commands.

![Quick actions status bar item](https://microsoft.github.io/vscode-remote-release/images/remote-dev-status-bar.png)

For more information, please see the [extension documentation](https://aka.ms/vscode-remote/ssh).

## Questions, Feedback, Contributing

Have a question or feedback?

- See the [documentation](https://aka.ms/vscode-remote) or the [troubleshooting guide](https://aka.ms/vscode-remote/troubleshooting).
- [Up-vote a feature or request a new one](https://aka.ms/vscode-remote/feature-requests), search [existing issues](https://aka.ms/vscode-remote/issues), or [report a problem](https://aka.ms/vscode-remote/issues/new).
- Contribute to [our documentation](https://github.com/Microsoft/vscode-docs)
- ...and more. See our [CONTRIBUTING](https://aka.ms/vscode-remote/contributing) guide for details.

Or connect with the community...

[![Twitter](https://microsoft.github.io/vscode-remote-release/images/Twitter_Social_Icon_24x24.png)](https://aka.ms/vscode-remote/twitter) [![Stack Overflow](https://microsoft.github.io/vscode-remote-release/images/so-image-24x24.png)](https://stackoverflow.com/questions/tagged/vscode) [![VS Code Dev Community Slack](https://microsoft.github.io/vscode-remote-release/images/Slack_Mark-24x24.png)](https://aka.ms/vscode-dev-community) [![VS CodeGitter](https://microsoft.github.io/vscode-remote-release/images/gitter-icon-24x24.png)](https://gitter.im/Microsoft/vscode)

## Telemetry

Visual Studio Code **Remote - SSH** and related extensions collect telemetry data to help us build a better experience working remotely from VS Code. We only collect data on which commands are executed. We do not collect any information about image names, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in the [Visual Studio Code FAQ](https://aka.ms/vscode-remote/telemetry).

## License

By downloading and using the Visual Studio **Remote - SSH** extension and its related components, you agree to the product [license terms](https://go.microsoft.com/fwlink/?linkid=2077057) and [privacy statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx).
