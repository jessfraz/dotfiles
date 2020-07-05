# `find-config`

[![NPM version][npm-img]][npm-url] [![Downloads][downloads-img]][npm-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Chat][gitter-img]][gitter-url] [![Tip][amazon-img]][amazon-url]

Finds the first matching config file, if any, in the current directory, nearest ancestor, or user's home directory. Supports finding files within a subdirectory of an ancestor directory. Configurable with defaults set to support the [XDG Base Directory Specification][xdg] for configuration files.

Because this module is intended to find consistently named configuration files, it is case-sensitive and does not support globs. If you need a more generic solution, see [findup-sync][fus] or [look-up][lku].

[fus]: https://www.npmjs.com/package/findup-sync
[lku]: https://www.npmjs.com/package/look-up
[xdg]: http://standards.freedesktop.org/basedir-spec/basedir-spec-latest.html

## Algorithm

Where X is the current directory:

1. If X/file.ext exists, return it. STOP
2. If X/.dir/file.ext exists, return it. STOP
3. If X has a parent directory, change X to parent. GO TO 1
4. Return NULL.

## Install

With [Node.js](http://nodejs.org):

    $ npm install find-config

## Usage

```js
var findConfig = require('find-config');

// Find the path to the nearest `package.json`
var pkg = findConfig('package.json');

// Find the path to the nearest `.foorc` or `.config/foorc`
var foo = findConfig('.foorc');

// Find the path to the nearest `.foorc` or `.config/.foorc`
var foo = findConfig('.foorc', { dot: true });

// Find the path to the nearest module using Node.js module resolution.
// Will look for `bar.js` or `bar/index.js`, etc.
var foo = findConfig('bar', { module: true });

// Find the path to the nearest `baz.json` or `some/path/baz.json`
var foo = findConfig('baz.json', { dir: 'some/path' });

// Find the path to the nearest `qux.json` or `some/path/qux.json` in
// some other directory or its nearest ancestor directory.
var foo = findConfig('qux.json', { cwd: '/other/dir', dir: 'some/path' });

// Find and require the nearest `package.json`
var pkg = findConfig.require('package.json');

// Find and read the nearest `.foorc` or `.config/foorc`
var foo = findConfig.read('.foorc');
```

## API

### `findConfig(filename, [options]) : String|Null`

- `filename` `String` - Name of the configuration file to find.
- `options` `{Object=}`
  - `cwd` `{String=}` - Directory in which to start looking. (Default: `process.cwd()`)
  - `dir` `{String=}` - An optional subdirectory to check at each level. (Default: `'.config'`)
  - `dot` `{Boolean=}` - Whether to keep the leading dot in the filename in `dir`. (Default: `false`)
  - `home` `{Boolean=}` - Whether to also check the user's home directory. (Default: `true`)
  - `module` `{Boolean=}` - Whether to use Node.js [module resolution][modres]. (Default: `false`)

Synchronously find the first config file matching a given name in the current directory or the nearest ancestor directory.

[modres]: https://nodejs.org/api/modules.html#modules_all_together

### `findConfig.obj(filename, [options]) : Object|Null`

- `filename` `String` - Name of the configuration file to find.
- `options` `{Object=}` - Same as `findConfig()`.

Finds first matching config file, if any and returns the matched directories and config file path.

### `findConfig.read(filename, [options]) : String|Null`

- `filename` `String` - Name of the configuration file to find.
- `options` `{Object=}` - Same as `findConfig()` with two additions.
  - `encoding` `{String}` - File encoding. (Default: `'utf8'`).
  - `flag` `{String}` - Flag. (Default: `'r'`).

Finds and reads the first matching config file, if any.

```js
var yaml = require('js-yaml');
var travis = yaml.safeLoad(findConfig.read('.travis.yml'));
```

### `findConfig.require(filename, [options]) : *`

- `filename` `String` - Name of the configuration file to find.
- `options` `{Object=}` - Same as `findConfig()`.

Finds and requires the first matching config file, if any. Implies `module` is `true`.

```js
var version = findConfig.require('package.json').version;
```

## Contribute

Standards for this project, including tests, code coverage, and semantics are enforced with a build tool. Pull requests must include passing tests with 100% code coverage and no linting errors.

## Test

    $ npm test

----

© Shannon Moeller <me@shannonmoeller.com> (shannonmoeller.com)

Licensed under [MIT](http://shannonmoeller.com/mit.txt)

[amazon-img]:    https://img.shields.io/badge/amazon-tip_jar-yellow.svg?style=flat-square
[amazon-url]:    https://www.amazon.com/gp/registry/wishlist/1VQM9ID04YPC5?sort=universal-price
[coveralls-img]: http://img.shields.io/coveralls/shannonmoeller/find-config/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/shannonmoeller/find-config
[downloads-img]: http://img.shields.io/npm/dm/find-config.svg?style=flat-square
[gitter-img]:    http://img.shields.io/badge/gitter-join_chat-1dce73.svg?style=flat-square
[gitter-url]:    https://gitter.im/shannonmoeller/shannonmoeller
[npm-img]:       http://img.shields.io/npm/v/find-config.svg?style=flat-square
[npm-url]:       https://npmjs.org/package/find-config
[travis-img]:    http://img.shields.io/travis/shannonmoeller/find-config.svg?style=flat-square
[travis-url]:    https://travis-ci.org/shannonmoeller/find-config
