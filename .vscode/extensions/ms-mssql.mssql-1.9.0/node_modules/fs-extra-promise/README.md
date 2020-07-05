# fs-extra-promise.js

# Node file system library and fs-extra module promisified with bluebird

## Current status

[![NPM version](https://img.shields.io/npm/v/fs-extra-promise.svg)](https://www.npmjs.com/package/fs-extra-promise)
[![Build Status](https://img.shields.io/travis/overlookmotel/fs-extra-promise/master.svg)](http://travis-ci.org/overlookmotel/fs-extra-promise)
[![Dependency Status](https://img.shields.io/david/overlookmotel/fs-extra-promise.svg)](https://david-dm.org/overlookmotel/fs-extra-promise)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/fs-extra-promise.svg)](https://david-dm.org/overlookmotel/fs-extra-promise)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/fs-extra-promise/master.svg)](https://coveralls.io/r/overlookmotel/fs-extra-promise)

API is stable. No tests at present but it seems to work fine!

## Usage

This module is a drop-in replacement for the [native node file system module](http://nodejs.org/api/fs.html) and the augmented [fs-extra](https://www.npmjs.org/package/fs-extra) module.

Additionally, it creates promisified versions of all `fs`'s and `fs-extra`'s async methods, using [bluebird](https://www.npmjs.org/package/bluebird). These methods are named the same as the original `fs`/`fs-extra` methods with `'Async'` added to the end of the method names.

So instead of:

```js
var fs = require('fs');
fs.readFile(path, function(err, data) {
	console.log(data);
});
```

You can now:

```js
var fs = require('fs-extra-promise');
fs.readFileAsync(path).then(function(data) {
	console.log(data);
});
```

All original `fs` and `fs-extra` methods are included unmodified.

### `isDirectory()` methods

For convenience, additional methods `isDirectory()`, `isDirectorySync()` and `isDirectoryAsync()` are provided.

These are are shortcuts for doing `fs.stat()` followed by running `isDirectory()` on the result returned by `stat()`.

### `usePromise()` method

Creates a new instance of `fs-extra-promise`, which uses the Promise implementation provided.

```js
var Bluebird = require('bluebird');
var fs = require('fs-extra-promise').usePromise(Bluebird);

// now use `fs-extra-promise` in the usual way
var promise = fs.readFileAsync(path);

console.log(promise instanceof Bluebird); // true
```

This can be useful for using a Promise implementation that supports `cls`, or an augmented version of Bluebird like [bluebird-extra](https://www.npmjs.org/package/bluebird-extra).

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

There aren't any tests at present, except for running jshint on the code.

## Changelog

See [changelog.md](https://github.com/overlookmotel/fs-extra-promise/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/fs-extra-promise/issues
