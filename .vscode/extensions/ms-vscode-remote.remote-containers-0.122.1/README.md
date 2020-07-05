# Visual Studio Code Remote - Containers

The **Remote - Containers** extension lets you use a [Docker container](https://docker.com) as a full-featured development environment. Whether you deploy to containers or not, containers make a great development environment because you can:

- Develop with a consistent, easily reproducible toolchain on the same operating system you deploy to.
- Quickly swap between different, isolated development environments and safely make updates without worrying about impacting your local machine.
- Make it easy for new team members / contributors to get up and running in a consistent development environment.
- Try out new technologies or clone a copy of a code base without impacting your local setup.

The extension starts (or attaches to) a development container running a well defined tool and runtime stack. Workspace files can be mounted into the container from the local file system, or copied or cloned into it once the container is running. Extensions are installed and run inside the container where they have full access to the tools, platform, and file system.

You then work with VS Code as if everything were running locally on your machine, except now they are isolated inside a container.

![Remote Dev Container](https://microsoft.github.io/vscode-remote-release/images/remote-containers-readme.gif)

## System Requirements

**Local:**

- **Windows:** [Docker Desktop](https://www.docker.com/products/docker-desktop) 2.0+ on Windows 10 Pro/Enterprise. Windows 10 Home (2004+) requires Docker Desktop 2.2+ and the [WSL2 back-end](https://aka.ms/vscode-remote/containers/docker-wsl2). (Docker Toolbox is not supported.)
- **macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop) 2.0+.
- **Linux**: [Docker CE/EE](https://docs.docker.com/install/#supported-platforms) 18.06+ and [Docker Compose](https://docs.docker.com/compose/install) 1.21+. (The Ubuntu snap package is not supported.)

**Containers**:

* x86_64 / ARMv7l (AArch32) / ARMv8l (AArch64) Debian 9+, Ubuntu 16.04+, CentOS / RHEL 7+
* x86_64 Alpine Linux 3.7+

Other `glibc` based Linux containers may work if they have [needed prerequisites](https://aka.ms/vscode-remote/linux).

While ARMv7l (AArch32), ARMv8l (AArch64), and `musl` based Alpine Linux support is available, some extensions installed on these devices may not work due to the use of `glibc` or `x86` compiled native code in the extension. See the [Remote Development with Linux](https://aka.ms/vscode-remote/linux) article for details.

Note that while the Docker CLI is required, the Docker daemon/service does not need to be running locally if you are [using a remote Docker host](https://aka.ms/vscode-remote/containers/remote-host). 

## Installation

To get started, follow these steps:

1. Install [VS Code](https://code.visualstudio.com/) or [VS Code Insiders](https://code.visualstudio.com/insiders/) and this extension.

2. Install and configure [Docker](https://www.docker.com/get-started) for your operating system.

   **Windows / macOS:**
    1. Install [Docker Desktop for Mac/Windows](https://www.docker.com/products/docker-desktop).
    2. If not using WSL2 on Windows, right-click on the Docker task bar item, select **Settings / Preferences** and update **Resources > File Sharing** with any locations your source code is kept. See [tips and tricks](https://aka.ms/vscode-remote/containers/troubleshooting) for troubleshooting.
    3. To enable the [Windows WSL2 back-end](https://aka.ms/vscode-remote/containers/docker-wsl2): Right-click on the Docker taskbar item and select **Settings**. Check **Use the WSL2 based engine** and verify your distribution is enabled under **Resources > WSL Integration**.

    **Linux:**
    1. Follow the [official install instructions for Docker CE/EE](https://docs.docker.com/install/#supported-platforms). If you use Docker Compose, follow the [Docker Compose install directions](https://docs.docker.com/compose/install/).
    2. Add your user to the `docker` group by using a terminal to run: `sudo usermod -aG docker $USER` Sign out and back in again so this setting takes effect.

**Working with Git?** Here are two tips to consider:

- If you are working with the same repository folder in a container and Windows, be sure to set up consistent line endings. See [tips and tricks](https://aka.ms/vscode-remote/containers/troubleshooting/crlf) to learn how.
- If you clone using a Git credential manager, your container should already have access to your credentials! If you use SSH keys, you can also opt-in to sharing them. See [Sharing Git credentials with your container](https://aka.ms/vscode-remote/containers/git) for details.

## Getting started

**[Follow the step-by-step tutorial](https://aka.ms/vscode-remote/containers/tutorial-sandbox)** or if you are comfortable with Docker, follow these four steps:

1. Follow the installation steps above.
2. Clone `https://github.com/Microsoft/vscode-remote-try-node` locally.
2. Start VS Code
3. Run the **Remote-Containers: Open Folder in Container...** command and select the local folder.

Check out the [repository README](https://github.com/Microsoft/vscode-remote-try-node) for things to try. Next, learn how you can:

- [Use a container as your full-time environment](https://aka.ms/vscode-remote/containers/getting-started/open) - Open an existing folder in a container for use as your full-time development environment in few easy steps. Works with both container and non-container deployed projects.
- [Attach to a running container](https://aka.ms/vscode-remote/containers/getting-started/attach) - Attach to a running container for quick edits, debugging, and triaging.
- [Advanced: Use a remote Docker host](https://aka.ms/vscode-remote/containers/remote-host) - Once you know the basics, learn how to use a remote Docker host if needed.

## Available commands

Another way to learn what you can do with the extension is to browse the commands it provides. Press `F1` to bring up the Command Palette and type in `Remote-Containers` for a full list of commands.

![Command palette](https://microsoft.github.io/vscode-remote-release/images/remote-command-palette.png)

You can also click on the Remote "Quick Access" status bar item to get a list of the most common commands.

![Quick actions status bar item](https://microsoft.github.io/vscode-remote-release/images/remote-dev-status-bar.png)

For more information, please see the [extension documentation](https://aka.ms/vscode-remote/containers).

## Release Notes

While an optional install, this extension releases with VS Code. [VS Code release notes](https://code.visualstudio.com/updates/) include a summary of changes to all three Remote Development extensions with a link to [detailed release notes](https://github.com/microsoft/vscode-docs/tree/master/remote-release-notes).

As with VS Code itself, the extensions update during a development iteration with changes that are only available in [VS Code Insiders Edition](https://code.visualstudio.com/insiders/).

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

Visual Studio Code Remote - Containers and related extensions collect telemetry data to help us build a better experience working remotely from VS Code. We only collect data on which commands are executed. We do not collect any information about image names, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in the [Visual Studio Code FAQ](https://aka.ms/vscode-remote/telemetry).

## License

By downloading and using the Visual Studio Remote - Containers extension and its related components, you agree to the product [license terms](https://go.microsoft.com/fwlink/?linkid=2077057) and [privacy statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx).
