## Docker for Visual Studio Code  [![Version](https://vsmarketplacebadge.apphb.com/version/ms-azuretools.vscode-docker.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/ms-azuretools.vscode-docker.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) [![Build Status](https://dev.azure.com/ms-azuretools/AzCode/_apis/build/status/Nightly/vscode-docker-nightly-2?branchName=master)](https://dev.azure.com/ms-azuretools/AzCode/_build/latest?definitionId=22&branchName=master)

The Docker extension makes it easy to build, manage, and deploy containerized applications from Visual Studio Code. It also provides one-click debugging of Node.js, Python, and .NET Core inside a container.

![Docker extension overview](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/overview.gif)

**Check out the [Working with containers](https://aka.ms/AA7arez) topic on the Visual Studio Code documentation site to get started**.

[The Docker extension wiki](https://github.com/Microsoft/vscode-docker/wiki) has troubleshooting tips and additional technical information.

## Installation

[Install Docker](https://docs.docker.com/install/) on your machine and add it to the system path.

On Linux, you should also [enable Docker CLI for the non-root user account](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user) that will be used to run VS Code.

To install the extension, open the Extensions view, search for `docker` to filter results and select Docker extension authored by Microsoft.

## Overview of the extension features

### Editing Docker files

You can get IntelliSense when editing your `Dockerfile` and `docker-compose.yml` files, with completions and syntax help for common commands.

![IntelliSense for Dockerfiles](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/dockerfile-intellisense.png)

In addition, you can use the Problems panel (<kbd>Ctrl+Shift+M</kbd> on Windows/Linux, <kbd>Shift+Command+M</kbd> on Mac) to view common errors for `Dockerfile` and `docker-compose.yml` files.

### Generating Docker files

You can add Docker files to your workspace by opening the Command Palette (<kbd>F1</kbd>) and using **Docker: Add Docker Files to Workspace** command. The command will generate `Dockerfile` and `.dockerignore` files and add them to your workspace. The command will also query you if you want the Docker Compose files added as well; this is optional.

The extension recognizes workspaces that use most popular development languages (C#, Node.js, Python, Ruby, Go, and Java) and customizes generated Docker files accordingly.

### Docker view

The Docker extension contributes a Docker view to VS Code. The Docker view lets you examine and manage Docker assets: containers, images, volumes, networks, and container registries. If the Azure Account extension is installed, you can browse your Azure Container Registries as well.

The right-click menu provides access to commonly used commands for each type of asset.

![Docker view context menu](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/docker-view-context-menu.gif)

You can rearrange the Docker view panes by dragging them up or down with a mouse and use the context menu to hide or show them.

![Customize Docker view](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/docker-view-rearrange.gif)

### Docker commands

Many of the most common Docker commands are built right into the Command Palette:

![Docker commands](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/command-palette.png)

You can run Docker commands to manage [images](https://docs.docker.com/engine/reference/commandline/image/), [networks](https://docs.docker.com/engine/reference/commandline/network/), [volumes](https://docs.docker.com/engine/reference/commandline/volume/), [image registries](https://docs.docker.com/engine/reference/commandline/push/), and [Docker Compose](https://docs.docker.com/compose/reference/overview/). In addition, the **Docker: Prune System** command will remove stopped containers, dangling images, and unused networks and volumes.


### Docker Compose

[Docker Compose](https://docs.docker.com/compose/) lets you define and run multi-container applications with Docker. Visual Studio Code's experience for authoring `docker-compose.yml` is very rich, providing IntelliSense for valid Docker compose directives:

 ![Docker Compose IntelliSense](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/dockercomposeintellisense.png)

For the `image` directive, you can press <kbd>ctrl+space</kbd> and VS Code will query the Docker Hub index for public images:

 ![Docker Compose image suggestions](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/dockercomposeimageintellisense.png)

VS Code will first show a list of popular images along with metadata such as the number of stars and description. If you continue typing, VS Code will query the Docker Hub index for matching images, including searching public profiles. For example, searching for 'Microsoft' will show you all the public Microsoft images.

 ![Docker Compose Microsoft image suggestions](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/dockercomposesearch.png)


### Using image registries

You can display the content and push/pull/delete images from [Docker Hub](https://hub.docker.com/) and [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/):

![Azure Container Registry content](https://github.com/microsoft/vscode-docker/raw/master/resources/readme/container-registry.png)

An image in an Azure Container Registry can be deployed to Azure App Service directly from VS Code; see [Deploy images to Azure App Service](https://aka.ms/AA7arf8) page. For more information about how to authenticate to and work with registries see [Using container registries](https://aka.ms/AA7arf9) page.

### Debugging services running inside a container

You can debug services built using Node.js, Python, or .NET (C#) that are running inside a container. The extension offers custom tasks that help with launching a service under the debugger and with attaching the debugger to a running service instance. For more information see [Debug container application](https://aka.ms/AA7arfb)  and [Extension Properties and Tasks](https://aka.ms/AA7ay8l) pages.

### Azure CLI integration

You can start Azure CLI (command-line interface) in a standalone, Linux-based container with **Docker Images: Run Azure CLI** command. This allows access to full Azure CLI command set in an isolated environment. See [Get started with Azure CLI](https://docs.microsoft.com/cli/azure/get-started-with-azure-cli?view=azure-cli-latest#sign-in) page for more information on available commands.

## Contributing

See [the contribution guidelines](https://github.com/microsoft/vscode-docker/blob/master/CONTRIBUTING.md) for ideas and guidance on how to improve the extension. Thank you!

### Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](https://github.com/microsoft/vscode-docker/blob/master/mailto:opencode@microsoft.com) with any additional questions or comments.

## Telemetry

VS Code collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://go.microsoft.com/fwlink/?LinkID=528096&clcid=0x409) to learn more. If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## License

[MIT](https://github.com/microsoft/vscode-docker/blob/master/LICENSE.md)
