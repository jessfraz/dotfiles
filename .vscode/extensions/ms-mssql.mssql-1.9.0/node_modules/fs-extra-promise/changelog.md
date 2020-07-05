# Changelog

## 0.0.1

* Initial release

## 0.1.0

* Expose Promise object so it can be augmented (e.g. by bluebird-extra module)

## 0.1.1

* Updated fs-extra dependency to v0.18.2
* Updated bluebird dependency to v2.9.24
* Travis runs tests against node 0.10 and 0.12
* Travis runs on new container infrastructure

## 0.1.2

* Update fs-extra dependency
* Update bluebird dependency
* Update dev dependencies
* Run jshint on tests
* Test code coverage & Travis sends to coveralls
* README badges use shields.io

## 0.1.3

* Disable Travis dependency cache

## 0.2.0

* Update fs-extra dependency

## 0.2.1

* Update fs-extra dependency
* Update bluebird dependency
* Update dev dependencies
* Change `main` in package.json to `./lib/index` (closes #6)

## 0.3.0

* `usePromise` method
* Update bluebird dependency
* Update dev dependencies
* README update

Breaking changes:

* Now creates a new instance of `fs` rather than adding methods to the global `fs-extra` module

## 0.3.1

* Update fs-extra dependency
* `usePromise` method anonymous function
* License update
