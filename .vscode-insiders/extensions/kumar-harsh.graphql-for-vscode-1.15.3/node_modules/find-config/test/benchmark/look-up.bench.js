var lookup = require('look-up');
var path = require('path');
var cwd = path.resolve(__dirname, '../fixtures/a/b');

function test() {
	return [
		lookup(['.waldo', '.config/waldo'], {cwd: cwd}),
		lookup(['foo.txt', '.config/foo.txt'], {cwd: cwd}),
		lookup(['baz.txt', '.config/baz.txt'], {cwd: cwd}),
		lookup([
			'find-config-3da35411-9d24-4dec-a7cb-3cb9416db670',
			'.config/find-config-3da35411-9d24-4dec-a7cb-3cb9416db670'
		], {
			cwd: cwd
		})
	];
}

console.log('look-up', test());

module.exports = test;
