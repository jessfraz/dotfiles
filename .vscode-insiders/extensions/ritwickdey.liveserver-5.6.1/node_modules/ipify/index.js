'use strict';
var got = require('got');

module.exports = got.bind(null, 'https://api.ipify.org');
