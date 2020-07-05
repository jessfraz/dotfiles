// examples/basic.js
// Basic
'use strict';

var ips = require('../index')
var result = ips()

console.log(result) // ex: { local: '192.168.10.3', docker: '192.168.10.103' }
