# has-own-prop [![Build Status](https://travis-ci.org/sindresorhus/has-own-prop.svg?branch=master)](https://travis-ci.org/sindresorhus/has-own-prop)

> A safer `.hasOwnProperty()`

Shortcut for `Object.prototype.hasOwnProperty.call(object, property)`.

You shouldn't use `.hasOwnProperty()` as it won't exist on [objects created with `Object.create(null)`](https://stackoverflow.com/a/12017703/64949) or it can have been overridden.


## Install

```
$ npm install has-own-prop
```


## Usage

```js
const hasOwnProp = require('has-own-prop');

const object = Object.create(null);
object.unicorn = true;

object.hasOwnProperty('unicorn');
//=> 'TypeError: undefined is not a function'

hasOwnProp(object, 'unicorn');
//=> true
```
