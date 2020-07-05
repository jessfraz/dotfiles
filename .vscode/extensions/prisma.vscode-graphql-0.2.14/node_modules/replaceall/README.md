# replaceall [![Build Status](https://travis-ci.org/leecrossley/replaceall.png?branch=master)](https://travis-ci.org/leecrossley/replaceall) [![npm version](https://badge.fury.io/js/replaceall.png)](https://npmjs.org/package/replaceall) [![devDependency Status](https://david-dm.org/leecrossley/replaceall/dev-status.png)](https://david-dm.org/leecrossley/replaceall#info=devDependencies)

Replace all instances in a JavaScript string.

### Install with npm

```
npm install replaceall
```

To then include replaceall in your node app:

```
var replaceall = require("replaceall");
```

### Using replaceall

```js
var result = replaceall("instances of this", "with this string", "in this string");
```

### Example

```js
var original = "hello world goodbye world";

replaceall("world", "everyone", original);
// "hello everyone goodbye everyone"

replaceall("l", "z", original);
// "hezzo worzd goodbye worzd"
```

## License

[MIT License](http://ilee.mit-license.org)
