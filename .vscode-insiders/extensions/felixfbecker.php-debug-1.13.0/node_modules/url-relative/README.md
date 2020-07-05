# url-relative
calculate RFC 1808 relative URLs (inverse of url.resolve)

## usage
```js
var urlRelative = require('url-relative')

urlRelative('http://foo.com/a/b','http://foo.com/c/d')
// => '../c/d'

urlRelative('/a/b', '/a/b/c')
// => 'b/c'
```


## api
### `urlRelative : (from : String, to : String) => String`
Returns the shortest relative URL difference between a `from` and a `to` URL. Relative URLs are described in [RFC 1808](https://tools.ietf.org/html/rfc1808).

`from` and `two` can be full URLs (e.g. `http://foo.com/bar`), network location URLs (protocol-relative, e.g. `//foo.com/bar`), or absolute path URLs (e.g. `/bar`).

## installation

    $ npm install url-relative


## running the tests

From package root:

    $ npm install
    $ npm test


## contributors

- jden <jason@denizac.org>


## license

ISC. (c) MMXV jden <jason@denizac.org>. See LICENSE.md
