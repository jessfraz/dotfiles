# Visual Studio Code Remote - WSL

The **Remote - WSL extension** extension lets you use the [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl) as your full-time development environment right from VS Code. This new, optimized support lets you:

- Use Windows to develop in a Linux based environment, using Linux specific toolchains and utilities.
- Edit files located in WSL or the mounted Windows filesystem (e.g. `/mnt/c`).
- Run and debug your Linux based applications on Windows, in VS Code.

Remote - WSL runs commands and extensions directly in WSL so you don't have to worry about pathing issues, binary compatibility, or other cross-OS challenges. You're able to use VS Code in WSL just as you would from Windows.

![demo](https://microsoft.github.io/vscode-remote-release/images/wsl-readme.gif)

## Installation

1. Install [VS Code](https://code.visualstudio.com/Download) or [VS Code Insiders](https://code.visualstudio.com/insiders) and this extension.

    > **Note:** When prompted to **Select Additional Tasks** during installation, be sure to check the **Add to PATH** option so you can easily open a folder in WSL using the `code` or `code-insiders` command.

2. Install the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) along with your preferred Linux distribution.

    > **Note:** WSL2 support is **experimental**. Also, extensions installed in Alpine Linux may not work due to `glibc` dependencies in native code inside the extension. See the [Remote Development and Linux](https://aka.ms/vscode-remote/linux) article for details.

**Working with Git?** Here are two tips to consider:

- If you are working with the same repository in WSL and Windows, be sure to set up consistent line endings. See [tips and tricks](https://aka.ms/vscode-remote/wsl/troubleshooting/crlf) to learn how.
- You can also avoid passwords by configuring WSL to use the Windows Git credential manager. See [tips and tricks](https://aka.ms/vscode-remote/wsl/troubleshooting/cred-manager) to for details.

## Getting started

**[Follow the step-by-step tutorial](https://aka.ms/vscode-remote/wsl/tutorial)** or if you already have WSL running:

1. Follow the installation steps above.
2. Open a WSL terminal for your installed distribution (e.g. Ubuntu 18.04 LTS)
3. Go to any folder and type: `code .`

Or you can:

1. Start VS Code.
2. Press `F1`, enter **Remote-WSL: New Window**, and hit enter.
3. Use the File menu to open your folder.

VS Code will set up the environment and a new VS Code window will appear with the contents of the WSL folder!

Another way to learn what you can do with the extension is to browse the commands it provides. Press `F1` to bring up the Command Palette and type in `Remote-WSL` for a full list.

![Command palette](https://microsoft.github.io/vscode-remote-release/images/remote-wsl-command-palette.png)

You can also click on the Remote "Quick Access" status bar item in the lower left corner to get a list of the most common commands.

![Quick actions status bar item](https://microsoft.github.io/vscode-remote-release/images/remote-dev-status-bar.png)

For more information, please see the [extension documentation](https://aka.ms/vscode-remote/wsl).

## Release Notes

While an optional install, this extension releases with VS Code. [VS Code release notes](https://code.visualstudio.com/updates/) include a summary of changes to all three Remote Development extensions with a link to [detailed release notes](https://github.com/microsoft/vscode-docs/tree/master/remote-release-notes).

As with VS Code itself, the extensions update during a development iteration with changes that are only available in [VS Code Insiders Edition](https://code.visualstudio.com/insiders/).

## Questions, Feedback, Contributing

Have a question or feedback?

- See the [documentation](https://aka.ms/vscode-remote) or the [troubleshooting guide](https://aka.ms/vscode-remote/troubleshooting).
- [Up-vote a feature or request a new one](https://aka.ms/vscode-remote/feature-requests), search [existing issues](https://aka.ms/vscode-remote/issues), or [report a problem](https://aka.ms/vscode-remote/issues/new).
- Contribute to [our documentation](https://github.com/Microsoft/vscode-docs)
- ...and more. See our [CONTRIBUTING](https://aka.ms/vscode-remote/contributing) guide for details.

Or connect with the community...

[![Twitter](https://microsoft.github.io/vscode-remote-release/images/Twitter_Social_Icon_24x24.png)](https://aka.ms/vscode-remote/twitter) [![Stack Overflow](https://microsoft.github.io/vscode-remote-release/images/so-image-24x24.png)](https://stackoverflow.com/questions/tagged/vscode) [![VS Code Dev Community Slack](https://microsoft.github.io/vscode-remote-release/images/Slack_Mark-24x24.png)](https://aka.ms/vscode-dev-community) [![VS CodeGitter](https://microsoft.github.io/vscode-remote-release/images/gitter-icon-24x24.png)](https://gitter.im/Microsoft/vscode)

## Telemetry

Visual Studio Code Remote - WSL and related extensions collect telemetry data to help us build a better experience working remotely from VS Code. We only collect data on which commands are executed. We do not collect any information about image names, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in the [Visual Studio Code FAQ](https://aka.ms/vscode-remote/telemetry).

## License

By downloading and using the Visual Studio Remote - WSL extension and its related components, you agree to the product [license terms](https://go.microsoft.com/fwlink/?linkid=2077057) and [privacy statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx).
