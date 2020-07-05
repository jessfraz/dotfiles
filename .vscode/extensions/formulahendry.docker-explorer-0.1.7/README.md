# Docker Explorer

[![Join the chat at https://gitter.im/formulahendry/vscode-docker-explorer](https://badges.gitter.im/formulahendry/vscode-docker-explorer.svg)](https://gitter.im/formulahendry/vscode-docker-explorer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/formulahendry.docker-explorer.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.docker-explorer) [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/formulahendry.docker-explorer.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.docker-explorer) [![Rating](https://vsmarketplacebadge.apphb.com/rating-short/formulahendry.docker-explorer.svg)](https://marketplace.visualstudio.com/items?itemName=formulahendry.docker-explorer) [![Build Status](https://travis-ci.org/formulahendry/vscode-docker-explorer.svg?branch=master)](https://travis-ci.org/formulahendry/vscode-docker-explorer)

## Features

* Manage Docker Containers, Docker Images, Docker Hub and Azure Container Registry

## Prerequisites

* [Docker](https://www.docker.com/) is installed
* For Linux user, make sure you could [manage Docker as a non-root user](https://docs.docker.com/engine/installation/linux/linux-postinstall/#manage-docker-as-a-non-root-user) without `sudo`

## Usage

* Manage Docker Containers in Explorer

![explorer](https://github.com/formulahendry/vscode-docker-explorer/raw/master/images/explorer.png)

* Manage Docker Images in Explorer

![image](https://github.com/formulahendry/vscode-docker-explorer/raw/master/images/image.png)

* Manage Docker Hub in Explorer

![docker-hub](https://github.com/formulahendry/vscode-docker-explorer/raw/master/images/docker-hub.png)

* Manage Azure Container Registry in Explorer

![ACR](https://github.com/formulahendry/vscode-docker-explorer/raw/master/images/ACR.png)

* Suggested Docker Images

![suggested-image](https://github.com/formulahendry/vscode-docker-explorer/raw/master/images/suggested-image.png)

## Settings

* `docker-explorer.autoRefreshInterval`: Interval (in milliseconds) to auto-refresh containers list. Set 0 to disable auto-refresh. (Default is **1000**)
* `docker-explorer.executionCommand`: Command to execute in container.
* `docker-explorer.containerLogsOptions`: Options to show container logs. (Default is **"--tail 50 -f"**)

## Visibility of Docker Explorer

You could use below settings to show or hide different explorers:
* `docker-explorer.showDockerContainers`: Docker Containers
* `docker-explorer.showDockerImages`: Docker Images
* `docker-explorer.showAzureRegistries`: Azure Container Registry
* `docker-explorer.showDockerHubTreeView`: Docker Hub
* `docker-explorer.showSuggestedDockerImages`: Suggested Docker Hub Images

## Telemetry data

By default, anonymous telemetry data collection is turned on to understand user behavior to improve this extension. To disable it, update the settings.json as below:
```json
{
    "docker-explorer.enableTelemetry": false
}
```

## Change Log

See Change Log [here](https://github.com/formulahendry/vscode-docker-explorer/blob/master/CHANGELOG.md)

## Issues

Currently, the extension is in the very initial phase. If you find any bug or have any suggestion/feature request, please join the chat on [Gitter](https://gitter.im/formulahendry/vscode-docker-explorer) or submit the [issues](https://github.com/formulahendry/vscode-docker-explorer/issues) to the GitHub Repo.
