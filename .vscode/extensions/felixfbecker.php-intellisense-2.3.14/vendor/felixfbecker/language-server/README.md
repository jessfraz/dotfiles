# PHP Language Server

[![Version](https://img.shields.io/packagist/v/felixfbecker/language-server.svg)](https://packagist.org/packages/felixfbecker/language-server)
[![Linux Build Status](https://travis-ci.org/felixfbecker/php-language-server.svg?branch=master)](https://travis-ci.org/felixfbecker/php-language-server)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/2sp5ll052wdjqmdm/branch/master?svg=true)](https://ci.appveyor.com/project/felixfbecker/php-language-server/branch/master)
[![Coverage](https://codecov.io/gh/felixfbecker/php-language-server/branch/master/graph/badge.svg)](https://codecov.io/gh/felixfbecker/php-language-server)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Minimum PHP Version](https://img.shields.io/badge/php-%3E%3D%207.0-8892BF.svg)](https://php.net/)
[![License](https://img.shields.io/packagist/l/felixfbecker/language-server.svg)](https://github.com/felixfbecker/php-language-server/blob/master/LICENSE.txt)
[![Gitter](https://badges.gitter.im/felixfbecker/php-language-server.svg)](https://gitter.im/felixfbecker/php-language-server?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

A pure PHP implementation of the open [Language Server Protocol](https://github.com/Microsoft/language-server-protocol).
Provides static code analysis for PHP for any IDE.

Uses the great [Tolerant PHP Parser](https://github.com/Microsoft/tolerant-php-parser),
[phpDocumentor's DocBlock reflection](https://github.com/phpDocumentor/ReflectionDocBlock)
and an [event loop](http://sabre.io/event/loop/) for concurrency.

**Table of Contents**
  - [Features](#features)
  - [Performance](#performance)
  - [Versioning](#versioning)
  - [Installation](#installation)
  - [Running](#running)
  - [Used by](#used-by)
  - [Contributing](#contributing)


## Features

### [Completion](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#textDocument_completion)
![Completion search demo](images/completion.gif)

### [Signature Help](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#textDocument_signatureHelp)
![Signature help demo](images/signatureHelp.gif)

### [Go To Definition](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#goto-definition-request)
![Go To Definition demo](images/definition.gif)

### [Find References](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#find-references-request)
![Find References demo](images/references.png)

### [Hover](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#hover-request)
![Hover class demo](images/hoverClass.png)

![Hover parameter demo](images/hoverParam.png)

A hover request returns a declaration line (marked with language `php`) and the summary of the docblock.
For Parameters, it will return the `@param` tag.

### [Document Symbols](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-symbols-request)
![Document Symbols demo](images/documentSymbol.gif)

### [Workspace Symbols](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#workspace-symbols-request)
![Workspace Symbols demo](images/workspaceSymbol.gif)

The query is matched case-insensitively against the fully qualified name of the symbol.  
Non-Standard: An empty query will return _all_ symbols found in the workspace.

### Error reporting through [Publish Diagnostics](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#publishdiagnostics-notification)
![Error reporting demo](images/publishDiagnostics.png)

PHP parse errors are reported as errors, parse errors of docblocks are reported as warnings.
Errors/Warnings from the `vendor` directory are ignored.

### Stubs for PHP built-ins

Completion, type resolval etc. will use the standard PHP library and common extensions.

### What is considered a definition?

Globally searchable definitions are:
 - classes
 - interfaces
 - traits
 - properties
 - methods
 - class constants
 - constants with `const` keyword

Definitions resolved just-in-time when needed:
 - variable assignments
 - parameters
 - closure `use` statements

Not supported yet:
 - constants with `define()`

Namespaces are not considerd a declaration by design because they only make up a part of the fully qualified name
and don't map to one unique declaration.

### What is considered a reference?

Definitions/references/hover currently work for
 - class instantiations
 - static method calls
 - class constant access
 - static property access
 - parameter type hints
 - return type hints
 - method calls, if the variable was assigned to a new object in the same scope
 - property access, if the variable was assigned to a new object in the same scope
 - variables
 - parameters
 - imported closure variables (`use`)
 - `use` statements for classes, constants and functions
 - class-like after `implements`/`extends`
 - function calls
 - constant access
 - `instanceof` checks
 - Reassigned variables
 - Nested access/calls on return values, properties, array access

### Protocol Extensions

This language server implements the [files protocol extension](https://github.com/sourcegraph/language-server-protocol/blob/master/extension-files.md).
If the client expresses support through `ClientCapabilities.xfilesProvider` and `ClientCapabilities.xcontentProvider`,
the server will request files in the workspace and file contents through requests from the client and never access
the file system directly. This allows the server to operate in an isolated environment like a container,
on a remote workspace or any a different protocol than `file://`.

## Performance

Upon initialization, the server will recursively scan the project directory for PHP files, parse them and add all definitions
and references to an in-memory index.
The time this takes depends on the project size.
At the time of writing, this project contains 78 files + 1560 files in dependencies which take 97s to parse
and consume 76 MB on a Surface Pro 3.
The language server is fully operational while indexing and can respond to requests with the definitions already indexed.
Follow-up requests will be almost instant because the index is kept in memory.

Having XDebug enabled heavily impacts performance and can even crash the server if the `max_nesting_level` setting is too low.

## Versioning

This project follows [semver](http://semver.org/) for the protocol communication and command line parameters,
e.g. a major version increase of the LSP will result in a major version increase of the PHP LS.
New features like request implementations will result in a new minor version.
Everything else will be a patch release.
All classes are considered internal and are not subject to semver.

## Installation

The recommended installation method is through [Composer](https://getcomposer.org/).
Simply run

    composer require felixfbecker/language-server

and you will get the latest stable release and all dependencies.  
Running `composer update` will update the server to the latest non-breaking version.

After installing the language server and its dependencies,
you must parse the stubs for standard PHP symbols and save the index for fast initialization.

     composer run-script --working-dir=vendor/felixfbecker/language-server parse-stubs

## Running

Start the language server with

    php vendor/felixfbecker/language-server/bin/php-language-server.php

### Command line arguments

#### `--tcp=host:port` (optional)
Causes the server to use a tcp connection for communicating with the language client instead of using STDIN/STDOUT.
The server will try to connect to the specified address.
Strongly recommended on Windows because of blocking STDIO.

Example:

    php bin/php-language-server.php --tcp=127.0.0.1:12345

#### `--tcp-server=host:port` (optional)
Causes the server to use a tcp connection for communicating with the language client instead of using STDIN/STDOUT.
The server will listen on the given address for a connection.
If PCNTL is available, will fork a child process for every connection.
If not, will only accept one connection and the connection cannot be reestablished once closed, spawn a new process instead.

Example:

    php bin/php-language-server.php --tcp-server=127.0.0.1:12345

#### `--memory-limit=integer` (optional)
Sets memory limit for language server.
Equivalent to [memory-limit](http://php.net/manual/en/ini.core.php#ini.memory-limit) php.ini directive.
The default is 4GB (which is way more than needed).

Example:

    php bin/php-language-server.php --memory-limit=256M

## Used by
 - [VS Code PHP IntelliSense](https://github.com/felixfbecker/vscode-php-intellisense)
 - [Eclipse Che](https://eclipse.org/che/)
 - [Eclipse IDE (LSP4E-PHP)](https://github.com/eclipselabs/lsp4e-php)
 - NeoVim: [LanguageServer-php-neovim](https://github.com/roxma/LanguageServer-php-neovim) with [LanguageClient neovim](https://github.com/autozimu/LanguageClient-neovim)
 - Atom: [ide-php](https://github.com/atom/ide-php)

## Contributing

You need at least PHP 7.0 and Composer installed.
Clone the repository and run

    composer install

to install dependencies.

Run the tests with 

    composer test

Lint with

    composer lint
    
The project parses PHPStorm's PHP stubs to get support for PHP builtins. It re-parses them as needed after Composer processes, but after some code changes (such as ones involving the index or parsing) you may have to explicitly re-parse them:

    composer run-script parse-stubs
    
To debug with xDebug ensure that you have this set as an environment variable

    PHPLS_ALLOW_XDEBUG=1

This tells the Language Server to not restart without XDebug if it detects that XDebug is enabled (XDebug has a high performance impact).
