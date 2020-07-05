# ipify [![Build Status](https://travis-ci.org/sindresorhus/ipify.svg?branch=master)](https://travis-ci.org/sindresorhus/ipify)

> Get your public IP address

Using the [ipify](http://www.ipify.org) API.


## Usage

```
$ npm install --save ipify
```

```js
const ipify = require('ipify');

ipify((err, ip) => {
	console.log(ip);
	//=> '82.142.31.236'
});
```


## CLI

```
$ npm install --global ipify
```

```
$ ipify --help

  Example
    $ ipify
    82.142.31.236
```


## Related

See [internal-ip](https://github.com/sindresorhus/internal-ip) to get your internal IP address.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
