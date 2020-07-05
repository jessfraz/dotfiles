var findup = require('findup-sync');
var path = require('path');
var cwd = path.resolve(__dirname, '../fixtures/a/b');

function test() {
	return [
		findup('.{,config/}waldo', {cwd: cwd}),
		findup('{,.config/}foo.txt', {cwd: cwd}),
		findup('{,.config/}baz.txt', {cwd: cwd}),
		findup('{,.config/}find-config-3da35411-9d24-4dec-a7cb-3cb9416db670', {cwd: cwd})
	];
}

console.log('findup-sync', test());

module.exports = test;
