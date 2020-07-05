# ips <img src="https://raw.githubusercontent.com/voodootikigod/logo.js/master/js.png" align="right" height="120">

Get local, docker and public IP addresses

# Install

## Package use

```js
npm install ips --save
```

## CLI

```js
npm install ips -g
```

<!-- EXAMPLES:BEGIN -->
## Examples

### Command line

```sh
ips
```

### [Basic](examples/basic.js)

```js
var ips = require('ips')
var result = ips()

console.log(result) // ex: { local: '192.168.10.3', docker: '192.168.10.103' }
```

### [With External IP](examples/with-external-ip.js)

```js
var ips = require('ips')
ips(function(err, data) {
  console.log(data) // ex: { local: '192.168.10.3', public: '70.22.12.182' }
})
```
<!-- EXAMPLES:END -->
## License: MIT
