# buffer-indexof-polyfill

[![Build Status][travis-image]][travis-url]
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

This is a polyfill for [`Buffer#indexOf`](https://nodejs.org/api/buffer.html#buffer_buf_indexof_value_byteoffset) and Buffer#lastIndexOf introduced in NodeJS 4.0.

## Example

```js
require("buffer-indexof-polyfill");

new Buffer("buffer").indexOf("uff") // return 1
new Buffer("buffer").indexOf("abc") // return -1
```

## Installation

```bash
npm install buffer-indexof-polyfill
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/buffer-indexof-polyfill.svg
[npm-url]: https://npmjs.org/package/buffer-indexof-polyfill
[downloads-image]: https://img.shields.io/npm/dm/buffer-indexof-polyfill.svg
[downloads-url]: https://npmjs.org/package/buffer-indexof-polyfill
[travis-image]: https://travis-ci.org/sarosia/buffer-indexof-polyfill.svg?branch=master
[travis-url]: https://travis-ci.org/sarosia/buffer-indexof-polyfill
