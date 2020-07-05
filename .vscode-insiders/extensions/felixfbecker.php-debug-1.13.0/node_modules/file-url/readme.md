# file-url [![Build Status](https://travis-ci.org/sindresorhus/file-url.svg?branch=master)](https://travis-ci.org/sindresorhus/file-url)

> Convert a path to a file url: `unicorn.jpg` → `file:///Users/sindresorhus/unicorn.jpg`


## Install

```
$ npm install --save file-url
```


## Usage

```js
const fileUrl = require('file-url');

fileUrl('unicorn.jpg');
//=> 'file:///Users/sindresorhus/dev/file-url/unicorn.jpg'

fileUrl('/Users/pony/pics/unicorn.jpg');
//=> 'file:///Users/pony/pics/unicorn.jpg'

// passing {resolve: false} will make it not call path.resolve() on the path
fileUrl('unicorn.jpg', {resolve: false});
//=> 'file:///unicorn.jpg'
```


## Related

- [file-url-cli](https://github.com/sindresorhus/file-url-cli) - CLI for this module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
