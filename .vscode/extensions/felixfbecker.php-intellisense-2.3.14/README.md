# PHP IntelliSense

[![vs marketplace](https://img.shields.io/vscode-marketplace/v/felixfbecker.php-intellisense.svg?label=vs%20marketplace)](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-intellisense) [![downloads](https://img.shields.io/vscode-marketplace/d/felixfbecker.php-intellisense.svg)](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-intellisense) [![rating](https://img.shields.io/vscode-marketplace/r/felixfbecker.php-intellisense.svg)](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-intellisense) [![build](https://travis-ci.org/felixfbecker/vscode-php-intellisense.svg?branch=master)](https://travis-ci.org/felixfbecker/vscode-php-intellisense) [![php: >=7.0.0](https://img.shields.io/badge/php->=7.0-8892BF.svg)](https://php.net/) [![chat: on gitter](https://badges.gitter.im/felixfbecker/vscode-php-intellisense.svg)](https://gitter.im/felixfbecker/vscode-php-intellisense?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Advanced PHP IntelliSense for Visual Studio Code.

**Note: This is just the VS Code extension that spawns the actual language server. The language server itself is implemented purely in PHP [in its own repository](https://github.com/felixfbecker/php-language-server), all features need to be implemented there and all issues should be reported there. You do NOT need to install it manually though, it is bundled in this extension.**

## Installation

You need at least PHP 7 installed for the extension to work. You can either add it to your PATH or set the `php.executablePath` setting.

I recommend to disable VS Code's built-in PHP IntelliSense by setting `php.suggest.basic` to `false` to avoid duplicate suggestions.

## Features

### Completion

![Completion search demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/completion.gif)

### Signature Help

![Signature help demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/signatureHelp.gif)

### Workspace symbol search

![Workspace symbol search demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/workspaceSymbol.gif)

### Find all References

![Find References demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/references.png)

### Go to Definition

![Go To Definition demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/definition.gif)

### Hover

![Hover class demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/hoverClass.png)

![Hover parameter demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/hoverParam.png)

### Find all symbols

![Find all symbols demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/documentSymbol.gif)

### Column-accurate error reporting

![Error reporting demo](https://github.com/felixfbecker/vscode-php-intellisense/raw/master/images/publishDiagnostics.png)

### Code style linting

Please use a dedicated extension like [PHP CodeSniffer](https://marketplace.visualstudio.com/items?itemName=ikappas.phpcs).

### Format code

Please use a dedicated extension like [PHP CS Fixer](https://marketplace.visualstudio.com/items?itemName=junstyle.php-cs-fixer).

## Todo

- Rename
- Signature help

## Contributing

Clone whole repository and in root directory execute:

```bash
composer install
npm install
npm run build
code .
```

The last command will open the folder in VS Code. Hit `F5` to launch an Extension Development Host with the extension.
For working on the language server, the easiest way is to replace the language server installation from composer in `vendor/felixfbecker/language-server` with a symlink to your local clone.

**For guidance on how to work on the language server, please see the [language server repository](https://github.com/felixfbecker/php-language-server).**
