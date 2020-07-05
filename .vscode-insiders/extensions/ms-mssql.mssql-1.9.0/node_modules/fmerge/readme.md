fmerge
======

fmerge is a simple tool for merging objects. It is perfect for handling options
objects.

It takes any number of parameters. It even merges recursively. Arrays will just
be replaced, though.

It does require a browser that supports ES5 methods though, so for IE8 or
earlier, take a look at https://github.com/olivernn/augment.js.


Installing
----------

Installing is easy. It automatically detects the environment among the three
supported types ([node.js](http://nodejs.org), [require.js](http://requirejs.org)
and normal browser version).

- In `node`, simply use `npm install fmerge`.
- The module is `require.js`-aware, so you can link it directly through `require.js`
  as well.
    - To make the `require.js` version, either install through `npm` or check out
      from git and run `node install.js`.
- For normal browsers, it creates a global function `fmerge`.

Example of use
--------------

    var merge = require('fmerge')

    console.log(merge(
      { a: 1, b: { c: 3, d: 4 }, [ 'entry', { e: 5 } ] }
    , { a: 2, b: { a: 1, c: 2 }, [ 'another entry', { a: 1 } ] }
    ))
    // { a: 2, b: { a: 1, c: 2, d: 4 }, [ 'another entry', { a: 1 } ] }
