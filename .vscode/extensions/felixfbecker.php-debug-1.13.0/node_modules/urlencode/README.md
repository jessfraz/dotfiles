urlencode [![Build Status](https://secure.travis-ci.org/node-modules/urlencode.png)](http://travis-ci.org/node-modules/urlencode) [![Coverage Status](https://coveralls.io/repos/node-modules/urlencode/badge.png)](https://coveralls.io/r/node-modules/urlencode)
=======

[![NPM](https://nodei.co/npm/urlencode.png?downloads=true&stars=true)](https://nodei.co/npm/urlencode/)

encodeURIComponent with charset, e.g.: `gbk`

## Install

```bash
$ npm install urlencode
```

## Usage

```js
var urlencode = require('urlencode');

console.log(urlencode('苏千')); // default is utf8
console.log(urlencode('苏千', 'gbk')); // '%CB%D5%C7%A7'

// decode gbk
urlencode.decode('%CB%D5%C7%A7', 'gbk'); // '苏千'

// parse gbk querystring
urlencode.parse('nick=%CB%D5%C7%A7', {charset: 'gbk'}); // {nick: '苏千'}

// stringify obj with gbk encoding
var str = 'x[y][0][v][w]=' + urlencode('雾空', 'gbk'); // x[y][0][v][w]=%CE%ED%BF%D5
var obj =  {'x' : {'y' : [{'v' : {'w' : '雾空'}}]}};
urlencode.stringify(obj, {charset: 'gbk'}).should.equal(str);

```

## Benchmark

### urlencode(str, encoding)

```bash
$ node benchmark/urlencode.js

node version: v0.10.26
urlencode(str) x 11,980 ops/sec ±1.13% (100 runs sampled)
urlencode(str, "gbk") x 8,575 ops/sec ±1.58% (94 runs sampled)
encodeURIComponent(str) x 11,677 ops/sec ±2.32% (93 runs sampled)
Fastest is urlencode(str)
```

### urlencode.decode(str, encoding)

```bash
$ node benchmark/urlencode.decode.js

node version: v0.10.26
urlencode.decode(str) x 26,027 ops/sec ±7.51% (73 runs sampled)
urlencode.decode(str, "gbk") x 14,409 ops/sec ±1.72% (98 runs sampled)
decodeURIComponent(str) x 36,052 ops/sec ±0.90% (96 runs sampled)
urlencode.parse(qs, {charset: "gbk"}) x 16,401 ops/sec ±1.09% (98 runs sampled)
urlencode.parse(qs, {charset: "utf8"}) x 23,381 ops/sec ±2.22% (93 runs sampled)
Fastest is decodeURIComponent(str)
```

## TODO

* [x] stringify()

## License

[MIT](LICENSE.txt)
