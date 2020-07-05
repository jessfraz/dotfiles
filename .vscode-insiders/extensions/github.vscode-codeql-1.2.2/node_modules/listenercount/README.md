# listenercount
backwards compatible version of builtin events.listenercount

[![js standard style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)]()

[![build status](https://circleci.com/gh/jden/node-listenercount.svg?&style=shield)][circleci]

[circleci]: https://circleci.com/gh/jden/node-listenercount
[standard]: http://standardjs.com/

A polyfill of Node.js 0.12+'s events.listenerCount function for Node.js 0.10. Uses the builtin if present, otherwise uses polyfill implementation.

## usage
```js
var listenerCount = require('listenercount')
var EventEmitter = require('events').EventEmitter

var ee = new EventEmitter()
ee.on('event', function () {})
listenerCount(ee, 'event') // => 1
listenerCount(ee, 'foo') // => 0
```


## api
### `listenerCount(ee : EventEmitter, eventName : String) => Number`
Returns the number of listeners for a given `eventName` on an EventEmitter.


## installation

    $ npm install listenercount


## running the tests

From package root:

    $ npm install
    $ npm test


## contributors

- jden <jason@denizac.org>


## license

ISC. (c) MMXVI jden <jason@denizac.org>. See LICENSE.md
