var findConfig = require('../../src/find-config');
var path = require('path');
var cwd = path.resolve(__dirname, '../fixtures/a/b');

function test() {
	return [
		findConfig('.waldo', {cwd: cwd}),
		findConfig('foo.txt', {cwd: cwd}),
		findConfig('baz.txt', {cwd: cwd}),
		findConfig('find-config-3da35411-9d24-4dec-a7cb-3cb9416db670', {cwd: cwd})
	];
}

console.log('find-config', test());

module.exports = test;
