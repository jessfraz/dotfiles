## 1.3.1 - 18 June 2020
### Fixed
* Python debugging fails with message "Unable to find the debugger in the Python extension" due to new debugger location. [#2080](https://github.com/microsoft/vscode-docker/issues/2080)

## 1.3.0 - 15 June 2020
### Added
* .NET Core attach support added for Windows containers. [#1662](https://github.com/microsoft/vscode-docker/issues/1662)

### Fixed
* Explorer no longer needs to be opened for palette commands to work. [#2029](https://github.com/microsoft/vscode-docker/issues/2029)
* Node base image scaffolded has been updated to latest LTS. [#2037](https://github.com/microsoft/vscode-docker/pull/2037)
* Python debugging now uses debugpy instead of ptvsd, fixing several issues and improving reliability. [#1831](https://github.com/microsoft/vscode-docker/issues/1831), [#1879](https://github.com/microsoft/vscode-docker/issues/1879)
* A custom `docker-compose up` command with no match no longer produces incorrect commands. [#1954](https://github.com/microsoft/vscode-docker/issues/1954)
* Explorer is more responsive when trying to connect to an unreachable SSH host. [#1947](https://github.com/microsoft/vscode-docker/issues/1947)

### Deprecated
* The `docker.attachShellCommand.Windows` and `docker.attachShellCommand.Linux` settings have been deprecated and will be removed in the future. [Command customization](https://code.visualstudio.com/docs/containers/reference#_command-customization) replaces this functionality. [#1980](https://github.com/microsoft/vscode-docker/issues/1980)
* The `docker-coreclr` launch configuration has been deprecated and will be removed in the future. [The `docker` configuration replaces this](https://code.visualstudio.com/docs/containers/debug-common). [#1380](https://github.com/microsoft/vscode-docker/issues/1380)

## 1.2.1 - 26 May 2020
### Fixed
* When changing contexts, UI is more responsive and clear. [#1965](https://github.com/microsoft/vscode-docker/issues/1965)
* .NET 5 images are published in a new repository. [#1973](https://github.com/microsoft/vscode-docker/issues/1973)

## 1.2.0 - 11 May 2020
Requires Visual Studio Code 1.44 or higher.

### Added
* Semantic highlighting support. [#1840](https://github.com/microsoft/vscode-docker/issues/1840)
* Help and Feedback pane in explorer view. [#1893](https://github.com/microsoft/vscode-docker/issues/1893)
* Docker Context pane in explorer view. [#1844](https://github.com/microsoft/vscode-docker/issues/1844)
* Images can be pulled from the images list. [#1313](https://github.com/microsoft/vscode-docker/issues/1313)
* Containers can be grouped by docker-compose project name. [#215](https://github.com/microsoft/vscode-docker/issues/215), [#1846](https://github.com/microsoft/vscode-docker/issues/1846)
* A new setting, `docker.dockerodeOptions`, allowing any options to be provided to Dockerode. [#1459](https://github.com/microsoft/vscode-docker/issues/1459)

### Changed
* Any file named `Dockerfile.*` is now recognized as a Dockerfile. [#1907](https://github.com/microsoft/vscode-docker/issues/1907)

## 1.1.0 - 20 April 2020
### Added
* Custom file names for docker-compose files can be defined. [#102](https://github.com/microsoft/vscode-docker/issues/102)
* The experience for pushing Docker images has been revamped. [#351](https://github.com/microsoft/vscode-docker/issues/351), [#1539](https://github.com/microsoft/vscode-docker/issues/1539), [#1595](https://github.com/microsoft/vscode-docker/issues/1595)
* Extensibility model for registry providers has been improved. [#147](https://github.com/microsoft/vscode-docker/issues/147)
* Generic DockerV2 registries using OAuth can now be connected to in many cases. [#869](https://github.com/microsoft/vscode-docker/issues/869)
* Docker contexts can now be changed, inspected, and removed from the Command Palette. [#1784](https://github.com/microsoft/vscode-docker/issues/1784)
* If the Docker context is changed from outside VSCode, the changes will be picked up in VSCode within 20 seconds by default, configurable with the `docker.contextRefreshInterval` setting. If the Docker context is changed within VSCode it is picked up immediately. [#1790](https://github.com/microsoft/vscode-docker/pull/1790)

### Fixed
* Improved extension activation performance. [#1804](https://github.com/microsoft/vscode-docker/issues/1804)
* Images are deleted by name instead of ID, which resolves several issues. [#1529](https://github.com/microsoft/vscode-docker/issues/1529)
* Error "Task to execute is undefined" when doing Docker build. [#1647](https://github.com/microsoft/vscode-docker/issues/1647)
* .NET Core scaffolding will use assembly name in ENTRYPOINT [#1583](https://github.com/microsoft/vscode-docker/issues/1583)

### Removed
* The `docker.defaultRegistryPath` setting has been removed, as part of the new image push experience.

## 1.0.0 - 9 March 2020
### Added
* Debugging support for Python [#1255](https://github.com/microsoft/vscode-docker/issues/1255)
* Improved support for common Python frameworks (e.g. Django, Flask, etc.) [#1546](https://github.com/microsoft/vscode-docker/issues/1546)
* Multi-select support in Docker explorer, including multi-select for some commands [#331](https://github.com/microsoft/vscode-docker/issues/331)
* Ability to right-click and re-enter incorrect registry credentials [#1122](https://github.com/microsoft/vscode-docker/issues/1122)
* Most command lines can be fully customized [#1596](https://github.com/microsoft/vscode-docker/issues/1596) (and more)
* docker-compose support for .NET Core, including attach config [#1543](https://github.com/microsoft/vscode-docker/issues/1543)
* Changes to selection logic of `docker-compose.yml` files [#370](https://github.com/microsoft/vscode-docker/issues/370) [#379](https://github.com/microsoft/vscode-docker/issues/379) [#569](https://github.com/microsoft/vscode-docker/issues/569)

### Fixed
* Incorrect `WORKDIR paths should be absolute` message [#1492](https://github.com/microsoft/vscode-docker/issues/1492)
* README not showing images in gallery [#1654](https://github.com/microsoft/vscode-docker/issues/1654)

## 0.10.0 - 23 January 2020
### Added
* Better error handling in command execution [#1398](https://github.com/microsoft/vscode-docker/issues/1398), [#1528](https://github.com/microsoft/vscode-docker/issues/1528)
* Place Dockerfile next to project file for .NET projects [#592](https://github.com/microsoft/vscode-docker/issues/592)
* Use container name in shell label [#1463](https://github.com/microsoft/vscode-docker/issues/1463)
* Auto Refresh Azure Registry node after installing Azure Account extension [#1461](https://github.com/microsoft/vscode-docker/issues/1461)
* Show only the applicable container groups in container command execution using command palette [#1430](https://github.com/microsoft/vscode-docker/issues/1430)
* `Copy Full Tag` command added to image context menu and command palette [#1431](https://github.com/microsoft/vscode-docker/issues/1431)
* pull latest image during docker build [#1409](https://github.com/microsoft/vscode-docker/issues/1409)

### Fixed
* Port validation during scaffolding [#1510](https://github.com/microsoft/vscode-docker/issues/1510)
* Use the default registry value in `Docker push` [#1478](https://github.com/microsoft/vscode-docker/issues/1478)
* Various other fixes and improvements: https://github.com/microsoft/vscode-docker/issues?q=is%3Aissue+milestone%3A0.10.0+is%3Aclosed

## 0.9.0 - 15 November 2019
### Added
* Task-based debugging for .NET Core and Node.js: [#1242](https://github.com/microsoft/vscode-docker/issues/1242)
  * These tasks can also be used for generic `docker build` and `docker run` scenarios
* Support for connecting to remote Docker daemons over SSH: [#646](https://github.com/microsoft/vscode-docker/issues/646)
* When using Docker Desktop WSL 2, the WSL daemon or local daemon will be selected automatically, based on `docker context` [#1199](https://github.com/microsoft/vscode-docker/issues/1199)
* `Open in Browser` command added to container context menus [#1429](https://github.com/microsoft/vscode-docker/pull/1429)

### Removed
* `docker.importCertificates` has been removed; the functionality to trust system certificates is now built in to VS Code itself (enabled by default): https://github.com/microsoft/vscode/issues/52880

### Fixed
* Blazor apps using static web assets were not able to be debugged [#1275](https://github.com/microsoft/vscode-docker/issues/1275)
* Various other fixes and improvements: https://github.com/microsoft/vscode-docker/milestone/13?closed=1

## 0.8.2 - 25 October 2019
### Added
* More pattern matches for Dockerfiles (Dockerfile.debug, Dockerfile.dev, Dockerfile.develop, Dockerfile.prod)
* Button to create simple networks [#1322](https://github.com/microsoft/vscode-docker/issues/1322)
* Survey prompt for some active users
* Telemetry event for when Dockerfiles are edited using Docker extension features

### Fixed
* Will not refresh Explorer window if VSCode is not in focus [#1351](https://github.com/microsoft/vscode-docker/issues/1351)

## 0.8.1 - 13 September 2019
### Fixed
* Creating and deploying to a webapp with name containing hyphen (for eg. "abc-xyz") breaks webhook creation. [#1270](https://github.com/Microsoft/vscode-docker/issues/1270)

## 0.8.0 - 12 September 2019
### Added
* Changed default behavior in VS Code remote environments to run as a "workspace" extension instead of a "UI" extension. See [#954](https://github.com/Microsoft/vscode-docker/issues/954) for more information
* Added support to debug ASP.NET Core web apps with SSL enabled
* Added support to debug .NET Core apps with user secrets
* Updated icons to match latest VS Code guidelines
* Automatically create a webhook when deploying an image to Azure App Service

### Fixed
* [Bugs fixed](https://github.com/Microsoft/vscode-docker/issues?q=is%3Aissue+milestone%3A%220.8.0%22+is%3Aclosed)

## 0.7.0 - 9 July 2019
### Added
* Revamped Docker Explorer
  * Containers, images, and registries now have their own explorer which can be hid, resized, or reordered
  * Added per-explorer settings for display format, grouping, and sorting
  * Modified icons to respect theme
  * Moved connection errors and troubleshooting links directly into the explorer instead of as a separate notification
  * Added support for "Load more..." if not all items are retrieved in the first batch
  * Local explorers poll less often (only if the explorer is open)
  * Added per-explorer prune command (system prune is still available from the command palette)
  * Ensured all desctructive actions have a confirmation and are grouped separately in context menus
* Generalized registries view to better support more providers
  * All registries regardless of provider now support viewing repos/tags, pulling images, and setting a registry as default
  * Added docs for contributing a new registry provider
  * Multiple registry providers of the same type can now be connected (e.g. multiple Docker Hub accounts)
  * Added support for GitLab (not including self-hosted)
* Update to version 0.0.21 of the language server (thanks @rcjsuen)
  * Improves linting checks so that there are fewer false positives
  * Fixes variable resolution to ensure that only alphanumeric and underscore characters are considered
* Revamped command palette support
  * Commands are grouped by explorer
  * Commands respect "Group By" setting when prompting for items
  * Leveraged multi-select quick pick to execute a command for multiple items at a time
* Revamped Azure support
  * Registries are grouped by subscription, with option to filter by subscription
  * Tasks are shown in the explorer instead of a webview
  * Task commands and "Deploy to App Service" are supported from the command palette
  * Creating a registry or web app now supports async validation, the back button, and related-name recommendations
* View all namespaces for your Docker Hub account, not just username
* Added explorer for Volumes, including prune, remove, and inspect commands
* Added explorer for Networks (thanks @stuartthomson), including prune, remove, and inspect commands
* Added VS Code settings `docker.certPath`, `docker.tlsVerify`, and `docker.machineName` which directly map to environment variables `DOCKER_CERT_PATH`, `DOCKER_TLS_VERIFY`, and `DOCKER_MACHINE_NAME`

### [Fixed](https://github.com/Microsoft/vscode-docker/issues?q=is%3Aissue+milestone%3A0.7.0+is%3Aclosed+label%3Abug)
* Modified `docker.host` setting to _actually_ be equivalent to `DOCKER_HOST` environment variable
* Respect `file.associations` setting when prompting for a Dockerfile
* Better handle expired credentials for Docker Hub
* `docker.truncateLongRegistryPaths` is now respected for containers as well as images

### Changed
* In order to support more providers and still keep the registries view clean, you must now explicitly connect a provider. Previously signed-in providers will need to be re-connected
* Azure Tasks no longer support custom filtering. This functionality is still available in the portal
* Removed `docker.groupImagesBy` setting in favor of `docker.images.groupBy` (based on a new pattern for all explorers)
* Removed `docker.showExplorer` setting. Instead, right click on the explorer title to hide.
* Removed `docker.promptOnSystemPrune` setting as a part of making all destructive actions consistent

## 0.6.4 - 19 June 2019

### Fixed
* Mitigate error "command 'vscode-docker.images.selectGroupBy' already exists" [#1008](https://github.com/microsoft/vscode-docker/issues/1008)

## 0.6.3 - 18 June 2019

### Changed
* Changed publisher from "PeterJausovec" to "ms-azuretools"

## 0.6.2 - 2 May 2019

### Fixed
* Handle opening resources to use native vscode APIs
* Running the extension in older versions of VS Code
* Report an issue opening a blank webpage due to a large stack frame
* Use appropriate nuget fallback volume mount for dotnet debugging - [#793](https://github.com/Microsoft/vscode-docker/pull/793)
* Ensure debugger directory exists - [#897](https://github.com/Microsoft/vscode-docker/issues/897)

### Added
*  `networkAlias` option to Docker run configuration [#890](https://github.com/Microsoft/vscode-docker/pull/890)

## 0.6.1 - 18 March 2019

### Fixed
* viewLogs are not readable in dark theme [#851](https://github.com/Microsoft/vscode-docker/issues/851)

## 0.6.0 - 12 March 2019

### Added
* Group By options for Images node [#603](https://github.com/Microsoft/vscode-docker/issues/603)
* Add debugging and dockerfile creation for fsharp dotnet core projects (Thanks, @gdziadkiewicz) [#795](https://github.com/Microsoft/vscode-docker/pull/795)
* Add support for Redstone 5 (Thanks, @tfenster) [#804](https://github.com/Microsoft/vscode-docker/pull/804)
* Allow more customization of Docker run configuration (thanks @ismael-soriano)[#690](https://github.com/Microsoft/vscode-docker/pull/690/files)
* Add `network` option to Docker run configuration [#748](https://github.com/Microsoft/vscode-docker/pull/748)

### Fixed
* Use colorblind-friendly icons [#811](https://github.com/Microsoft/vscode-docker/issues/811)
* Don't ask to save registry path if no workspace [#824](https://github.com/Microsoft/vscode-docker/pull/824)
* Two "Docker" tabs in output view [#715](https://github.com/Microsoft/vscode-docker/issues/715)
* Error when deploying images to Azure App Service for a private registry with no authentication [#550](https://github.com/Microsoft/vscode-docker/issues/550)
* Improve Docker Hub login experience [#429](https://github.com/Microsoft/vscode-docker/issues/429), [#375](https://github.com/Microsoft/vscode-docker/issues/375), [#817](https://github.com/Microsoft/vscode-docker/issues/817)
* Resolve .NET Core debugging on Windows (Thanks, @gdziadkiewicz) [#798](https://github.com/Microsoft/vscode-docker/pull/798)
* Earlier validation of Docker .NET Core configuration [#747](https://github.com/Microsoft/vscode-docker/pull/747)
* [.NET Core Debugging] Add support for Alpine images [#771](https://github.com/Microsoft/vscode-docker/pull/771)
* Support for ${workspaceFolder} in dockerRun/Volumes localPath and containerPath [#785](https://github.com/Microsoft/vscode-docker/issues/785)
* Cannot read property 'useCertificateStore' of undefined [#735](https://github.com/Microsoft/vscode-docker/issues/735)
* Operation cancelled error shows up when any user action is cancelled [#718](https://github.com/Microsoft/vscode-docker/issues/718)
* Error showing logs if there are no running containers [#739](https://github.com/Microsoft/vscode-docker/issues/739)
* Wrong DOCKER_HOST config when using docker.host configuration (thanks @ntcong) [#649](https://github.com/Microsoft/vscode-docker/issues/649)

## 0.5.2 - 30 January 2019

### Fixed

* Extension fails to initialize in VS Code Insiders 1.31 [#733](https://github.com/Microsoft/vscode-docker/issues/733)

## 0.5.1 - 8 January 2019

### Fixed

* Require vscode 1.26.0 because it's required by the language client version 5.0.0 [#729](https://github.com/Microsoft/vscode-docker/issues/729)

## 0.5.0 - 7 January 2019

### Added

* Significantly improved startup and installation performance by packaging with webpack
* Support for adding C++ Dockerfile (thanks @robotdad) [#644](https://github.com/Microsoft/vscode-docker/issues/644)

### Fixed

* Fix null ref showing connection error during prune [#653](https://github.com/Microsoft/vscode-docker/issues/653)
* Sporadic failure pushing images to ACR [#666](https://github.com/Microsoft/vscode-docker/issues/666)
* Unhandled error if you cancel saving Azure log [#639](https://github.com/Microsoft/vscode-docker/issues/639)
* Save Azure log dialog shows "log..log" as the filename extension [#640](https://github.com/Microsoft/vscode-docker/issues/640)
* ACR pull image issue [#648](https://github.com/Microsoft/vscode-docker/issues/648)
* ACR Build for Dockerfile fails through extension [#650](https://github.com/Microsoft/vscode-docker/issues/650)
* "Run ACR Task File" from command palette with no .yml file in workspace throws error [#635](https://github.com/Microsoft/vscode-docker/issues/635)
* Add prerequisite check for missing Dockerfile [#687](https://github.com/Microsoft/vscode-docker/issues/687)
* Make the launch.json generation leaner (merci vielmal @isidorn) [#618](https://github.com/Microsoft/vscode-docker/issues/618)

## 0.4.0 - 20 November 2018

### Added
* Added support for self-signed certificates and reading from Windows/Mac certificate stores (currently opt-in) [#613](https://github.com/Microsoft/vscode-docker/issues/613), [#602](https://github.com/Microsoft/vscode-docker/issues/602), [#483](https://github.com/Microsoft/vscode-docker/issues/483)
* Use a different icon for unhealthy containers (thanks @grhm) [#615](https://github.com/Microsoft/vscode-docker/issues/615)
* 8.9-alpine -> 10.13-alpine [#624](https://github.com/Microsoft/vscode-docker/pull/624)
* Adds preview support for debugging .NET Core web applications running in Linux Docker containers.
* Azure Container Registry improvements:
  - Automatic login for pulls (even if Admin user not enabled)
  - Explore and build tasks
  - Display and filter logs
  - Create build from Dockerfile
  - Run ACR task file (.yml)
  - Delete or untag images

### Fixed
* Don't output EXPOSE if empty port specified [#490](https://github.com/Microsoft/vscode-docker/issues/490)
* When attaching shell, use bash if available [#505](https://github.com/Microsoft/vscode-docker/issues/505)
* Fix truncation of long image and container registry paths in the Explorer [#527](https://github.com/Microsoft/vscode-docker/issues/527)
* Performance: Delay loading of Azure Account extension until after activation (part of [#535](https://github.com/Microsoft/vscode-docker/issues/535)). Note: much bigger performance improvements coming in next version!
* Specify .dockerignore language to receive syntax highlighting and toggling of comments (thanks @remcohaszing) [#564](https://github.com/Microsoft/vscode-docker/issues/564)

## 0.3.1 - 25 September 2018

### Fixed

* Error while generating Dockerfile for 'other' [#504](https://github.com/Microsoft/vscode-docker/issues/504)

## 0.3.0 - 21 September 2018

### Added

* Add Docker Files to Workspace
  - Support multiple versions of .NET Core (ASP .NET and Console apps)

### Fixed
* Some private registries returning 404 error [#471](https://github.com/Microsoft/vscode-docker/issues/471)
* You shouldn't have to reload vscode in order for changes to docker.attachShellCommand.{linux,windows}Container to take effect [#463](https://github.com/microsoft/vscode-docker/issues/463)
* Engineering improvements (lint, tests, work toward strict null checking, etc.)

## 0.2.0 - 5 September 2018

### Added
* Add preview support for connecting to private registries
* Improved workflow for Tag Image:
  - User will be asked on the first usage of Tag Image with a registry to save it to the `docker.defaultRegistryPath` setting
  - User will be prompted to tag an image if attempting to push an image with no registry or username
  - New `Set as Default Registry Path` menu on registries
  - When default registry path is prefixed to the image name, it is selected for easy removal or editing
* Improved workflow for Build Image:
  - Previous image name will be remembered
* Azure container registries can now be browsed without having "Admin user" turned on. However, deploying to Azure app service currently still requires it, and you still need to log in to Azure in docker [#359](https://github.com/Microsoft/vscode-docker/issues/359)
* A new [API](https://github.com/microsoft/vscode-docker/blob/master/docs\api.md) has been added for other extensions to be able to control the "Add Docker Files to Workspace" functionality.
* You can now create and delete Azure (ACR) registries and delete Azure repositories and images directly from the extension.

### Fixed
* Images list does not refresh after tagging an image [#371](https://github.com/Microsoft/vscode-docker/issues/371)
* Don't prompt for Dockerfile if only one in project (command palette->Build Image) [#377](https://github.com/Microsoft/vscode-docker/issues/377)
* Docker Hub repos are not alphabetized consistently [#410](https://github.com/Microsoft/vscode-docker/issues/410)
* Obsolete usage of `go-wrapper` removed from Go Dockerfile (thanks @korservick)
* Error when listing Azure Registries when some of the accounts do not have appropriate permissions (thanks @estebanreyl) [#336](https://github.com/Microsoft/vscode-docker/issues/336)
* UDP exposed ports not launching correctly [#284](https://github.com/Microsoft/vscode-docker/issues/284)
* Adopt version 0.0.19 of the language server (thanks @rcjsuen) [#392](https://github.com/Microsoft/vscode-docker/pull/392). This fix includes:
  - Folding support for comments
  - Fix for [#338 Multi-line LABEL directives highlight as errors](https://github.com/Microsoft/vscode-docker/issues/338)
  - Support for handling SCTP ports in EXPOSE instructions per Docker CE 18.03
  - Optional warning/error for WORKDIR instructions that are not absolute paths (to try to enforce good practices per the official guidelines and recommendations document for Dockerfiles
  - New `docker.languageserver.diagnostics.instructionWorkdirRelative` configuration setting
* Output title corrected [#428](https://github.com/Microsoft/vscode-docker/pull/428)

### Changed
* The `docker.defaultRegistry` setting is now obsolete. Instead of using a combination of `docker.defaultRegistry` and `docker.defaultRegistryPath`, now simply use `docker.defaultRegistryPath`. This will be suggested automatically the first time the extension is run.

## 0.1.0 - 26 July 2018
* Update .NET Core Dockerfile generation [#264](https://github.com/Microsoft/vscode-docker/issues/264). Per the .NET team, don't generate `docker-compose` files for .NET Core
* Update to version 0.0.18 of the language server (thanks @rcjsuen) [#291](https://github.com/Microsoft/vscode-docker/pull/291).  This includes fixes for:
  * Auto-complete/intellisense types too much - it repeats what's already written [#277](https://github.com/Microsoft/vscode-docker/issues/277)
  * Dockerfile linting error in FROM [#269](https://github.com/Microsoft/vscode-docker/issues/269), [#280](https://github.com/Microsoft/vscode-docker/issues/280), [#288](https://github.com/Microsoft/vscode-docker/issues/288), and others
  * Other linting fixes
* Update Linux post-install link in README.md (thanks @gregvanl) [#275](https://github.com/Microsoft/vscode-docker/pull/275)
* Add docker.host setting as alternative for setting DOCKER_HOST environment variable (thanks @tfenster) [#304](https://github.com/Microsoft/vscode-docker/pull/304)
* Basic Dockerfile for Ruby (thanks @MiguelSavignano) [#276](https://github.com/Microsoft/vscode-docker/pull/276)
* Azure container registries bugfixes and enhancements (thanks @estebanreyl, @julialieberman) [#299](https://github.com/Microsoft/vscode-docker/pull/299)
  * Fixes [#266](https://github.com/Microsoft/vscode-docker/issues/266) to fix error when expanding empty container registry
  * Improves Azure explorer expansion speed by parallelizing network calls
  * Alphabetically organized registries listed from azure and organized tags by date of creation
* Add "Docker: Compose Restart" command [#316](https://github.com/Microsoft/vscode-docker/pull/316)
* Add link to extension docs and Azure publish tutorial to readme
* Fix [#295](https://github.com/Microsoft/vscode-docker/issues/295) to provide proper error handling if project file can't be found adding Dockerfile to project
* Fix [#302](https://github.com/Microsoft/vscode-docker/issues/302) so that Compose Up/Down work correctly from the text editor context menu
* Clarify README documentation on DOCKER_HOST to note that DOCKER_CER_PATH may be required for TLS (thanks @mikepatrick) [#324](https://github.com/Microsoft/vscode-docker/pull/324)
* Engineering improvements (tests and lint fixes)

## 0.0.27 - 19 May 2018

* Fixes indentation problem with Python docker-compose.yml files (thanks @brettcannon) [#242](https://github.com/Microsoft/vscode-docker/pull/242)
* Adds support for showing the Docker explorer in a new Activity Bar view
* Adopt v0.0.17 of the language server (thanks @rcjsuen!) [#249](https://github.com/Microsoft/vscode-docker/pull/249)

## 0.0.26 - 30 Mar 2018

* Support generating Java Dockerfiles (thanks @testforstephen) [#235](https://github.com/Microsoft/vscode-docker/pull/235)
* Support generating Python Dockerfiles (thanks @brettcannon) [#219](https://github.com/Microsoft/vscode-docker/pull/219)

## 0.0.25 - 27 Feb 2018

* Fixes [#217](https://github.com/Microsoft/vscode-docker/issues/217) to adopt the usage of ASAR in VS Code
* Support for multi-select of `docker-compose` files and then issuing the `compose up` or `compose down` commands.
* Changed the default of `promptOnSystemPrune` setting to `true`, meaning you will get a confirmation when running the `System Prune` prune command by default. You can change this by setting `docker.promptOnSystemPrune: false` in your `settings.json`. Thanks to [@driskell](https://github.com/driskell) for [PR [#213](https://github.com/microsoft/vscode-docker/issues/213)](https://github.com/Microsoft/vscode-docker/pull/213).
* Right click commands on `dockerfile` and `docker-compose.yml` files are now enabled based on a regular expression over the file name rather than being hard coded.

## 0.0.24 - 02 Feb 2018

* Fixes [#189](https://github.com/Microsoft/vscode-docker/issues/189) to provide friendly errors when Docker is not running
* Fixes [#200](https://github.com/Microsoft/vscode-docker/issues/200) to provide two new options `dockerComposeBuild` and `dockerComposeDetached` control how `docker-compose` is launched
* Fixes [#208](https://github.com/Microsoft/vscode-docker/issues/208) where an incorrect repository name was being passed to Azure App Services
* Update to `v0.0.13` of the Docker Language Server (thanks @rcjsuen) [#198](https://github.com/Microsoft/vscode-docker/pull/198)
* Activate on `onDebugInitialConfigurations` instead of `onDebug` to delay loading (thanks @gregvanl)
* Thank you to @DovydasNavickas for [PR [#202](https://github.com/microsoft/vscode-docker/issues/202)](https://github.com/Microsoft/vscode-docker/pull/202) to fix grammatical errors

## 0.0.23 - 05 Jan 2018

* Do not show dangling images in explorer (thanks @johnpapa) [#175](https://github.com/Microsoft/vscode-docker/pull/175)
* Add configuration to prompt on System Prune, fixes [#183](https://github.com/Microsoft/vscode-docker/issues/183)
* Upgrade to new language server (thanks @rcjsuen) [#173](https://github.com/Microsoft/vscode-docker/pull/173)
* Adding show logs command to dead containers (thanks @FredrikFolkesson) [#178](https://github.com/Microsoft/vscode-docker/pull/178)
* Default to Node 8.9 when generating Dockerfile (thanks @johnpapa) [#174](https://github.com/Microsoft/vscode-docker/pull/174)
* Add `compose up` and `compose down` context menus for files explicitly named `docker-compose.yml` or `docker-compose.debug.yml`
* Browse to the Azure portal context menu, fixes [#151](https://github.com/Microsoft/vscode-docker/issues/151)
* Add `docker.truncateLongRegistryPaths` and `docker.truncateMaxLength` configuration options enable truncation of long image and container names in the Explorer, fixes [#180](https://github.com/Microsoft/vscode-docker/issues/180)
* Images in the Explorer now show age (e.g. '22 days ago')
* Update `Dockerfile` for `go` workspaces (thanks @vladbarosan) [#194](https://github.com/Microsoft/vscode-docker/pull/194)

## 0.0.22 - 13 Nov 2017

* Make shell commands configurable (thanks @FredrikFolkesson) [#160](https://github.com/Microsoft/vscode-docker/pull/160)
* Update usage of Azure Account API to speed up deployment to Azure App Services
* Set CD App Setting when deploying image from Azure Container Registry

## 0.0.21 - 08 Nov 2017

* Update `docker-compose.debug.yml` command to include full the URI to the debug port (fix for [vscode: 36192](https://github.com/Microsoft/vscode/issues/36192))
* Filter the subscriptions presented when deploying to Azure based on the Azure Account subscription filter
* Mark as multi-root ready
* Fix debug configuration generation [VSCode [#37648](https://github.com/microsoft/vscode-docker/issues/37648)](https://github.com/Microsoft/vscode/issues/37648)
* Add `restart` command for containers (thanks @orfevr) [#152](https://github.com/Microsoft/vscode-docker/pull/152)
* Less aggressive matching for `dockerfile` (thanks @dlech) [#155](https://github.com/Microsoft/vscode-docker/pull/155)
* Support workspace folders for language server settings (thanks @rcjsuen) [#156](https://github.com/Microsoft/vscode-docker/pull/156)
* Add config option for docker build path (thanks @nyamakawa) [#158](https://github.com/Microsoft/vscode-docker/pull/158)

## 0.0.20 - 18 Oct 2017

* No longer take a hard dependency on the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension.

## 0.0.19 - 14 Oct 2017

* Add an automatic refresh option for the explorer (`"docker.explorerRefreshInterval": 1000`)
* Add support for Multi-Root Workspaces
* Add support for browsing Docker Hub and Azure Container Registries
* Add support for deploying images from Docker Hub and Azure Container Registries to Azure App Service
* `docker-compose` now runs detached and always invokes a build (e.g. `docker-compose -f docker-compose.yml -d --build`)
* `docker system prune` command no longer prompts for confirmation
* `docker-compose.debuy.yml` no longer contains a volume mapping
* Adopt 0.0.9 release of the [Docker Language Server](https://github.com/rcjsuen/dockerfile-language-server-nodejs)

## 0.0.18 - 18 Sept 2017

* Add configuration option (`"docker.showExplorer": false`) to globally turn off or on the Explorer contribution
* Prompt for confirmation when running `docker system prune` command, improve icon

## 0.0.17 - 16 Sept 2017

* Add `docker inspect` command
* Gracefully handle when Docker is not running
* Add Explorer contribution, letting you view Images and Containers in the Explorer viewlet.
* Add `--rm` to `docker build` to remove intermediate images
* Thanks to @rcjsuen, moved to the [Dockerfile Language Server](https://github.com/rcjsuen/dockerfile-language-server-nodejs)
* Update thirdpartynotices.txt, README.md to reflect changes

## 0.0.16 - 09 June 2017

* Update snippet syntax to be in accordance with the [stricter snippet syntax](https://code.visualstudio.com/updates/v1_13#_strict-snippets)
* Moved source code to support async/await (important if you want to make PRs!)

## 0.0.15 - 25 May 2017

* Updated both the `Docker: Run` and `Docker: Run Interactive` commands to automatically publish the ports that the specified image exposes
* Updated the `Docker: Run` command to run the specified container in the background
* Updated the `Docker: Add docker files to workspace` command to generate a `.dockerignore` file
* Updated the `Docker: Azure CLI` command to fully support running `az acs` commands

## 0.0.14 - 08 May 2017

* Support for Docker multi stage build Dockerfiles (syntax, linting)
* Support different variations on naming of `dockerfile` such as `dockerfile-development`
* Bug fixing

## 0.0.13 - 14 March 2017

* Support for `.yaml` file extension on `docker-compose` files.
* Updated Azure CLI image name, map .azure folder from host file system, fix block running on Windows containers, fix Windows path issues (this didn't make it into `0.0.12`)
* Added telemetry to understand which commands developers find useful. This will help us refine which commands we add in the future. We track whether the following commands are executed:
  * `build image`
  * `compose up`, `compose down`
  * `open shell` on running container and whether or not it is a Windows or Linux based container
  * `push image` (we don't track the image name or the location)
  * `remove image`
  * `show logs`
  * `start container`, `start container interactive`
  * `start Azure CLI` container
  * `stop container`
  * `system prune`
  * `tag` (we don't track tag name)
  * Configure workspace along with the type (e.g. Node or Other)

> Please note, you can turn off telemetry reporting for VS Code and all extensions through the ["telemetry.enableTelemetry": false setting](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## 0.0.12 - 11 February 2017

* Removed `MAINTAINER` from templates and linting warnings by upgrading the `dockerfile_lint` module (Docker has deprecated `MAINTAINER` in favor of `LABEL`).
* Added command to run `docker system prune`, note we use the `-f` (force) flag to ignore the confirmation prompt.
* `Docker: Attach Shell` command now supports Windows containers [#58](https://github.com/microsoft/vscode-docker/pull/58).

## 0.0.10 - 12 December 2016

* Added context menu support to run the Docker Build command on Dockerfile files from the editor or from the explorer.
* Docker logs now uses the -f flag ([follow](https://docs.docker.com/engine/reference/commandline/logs/)) to continue streaming the logs to terminal.

## 0.0.11 - 4 January 2017

* Fixed [Issue 51](https://github.com/microsoft/vscode-docker/issues/51), a path problem on Windows.
