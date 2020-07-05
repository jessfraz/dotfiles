// examples/with-external-ip.js
// With External IP
'use strict';

var ips = require('../index')
ips(function(err, data) {
  console.log(data) // ex: { local: '192.168.10.3', public: '70.22.12.182' }
})
