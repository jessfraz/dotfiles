#!/usr/bin/env node
'use strict';
var meow = require('meow');
var ipify = require('./');

meow({
	help: [
		'Example',
		'  $ ipify',
		'  82.142.31.236'
	]
});

ipify(function (err, ip) {
	if (err) {
		console.error(err.message);
		process.exit(1);
	}

	console.log(ip);
});
