import findConfig from '../src/find-config';
import path from 'path';
import test from 'ava';

const pathResolve = path.resolve;
const nofile = 'find-config-3da35411-9d24-4dec-a7cb-3cb9416db670';

function setup() {
	process.chdir(__dirname);
}

test('should find files', async assert => {
	setup();

	const options = {cwd: 'fixtures/a/b'};

	assert.is(findConfig('foo.txt', options), pathResolve('fixtures/a/foo.txt'));
	assert.is(findConfig('bar.txt', options), pathResolve('fixtures/a/b/bar.txt'));
	assert.is(findConfig('a.txt', options), pathResolve('fixtures/a.txt'));

	process.chdir('fixtures/a/b');

	assert.is(findConfig('foo.txt'), pathResolve('../foo.txt'));
	assert.is(findConfig('bar.txt'), pathResolve('./bar.txt'));
	assert.is(findConfig('a.txt'), pathResolve('../../a.txt'));
});

test('should find files in a directory', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b'};

	assert.is(findConfig('baz.txt', options), pathResolve('fixtures/a/.config/baz.txt'));
	assert.is(findConfig('qux.txt', options), pathResolve('fixtures/a/b/.config/qux.txt'));

	process.chdir('fixtures/a/b');

	assert.is(findConfig('baz.txt', options), pathResolve('../.config/baz.txt'));
	assert.is(findConfig('qux.txt', options), pathResolve('./.config/qux.txt'));
});

test('should find files in a directory', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b', dir: false};

	assert.is(findConfig('baz.txt', options), null);
	assert.is(findConfig('a.txt', options), pathResolve('fixtures/a.txt'));

	process.chdir('fixtures/a/b');
	options = {dir: false};

	assert.is(findConfig('baz.txt', options), null);
	assert.is(findConfig('a.txt', options), pathResolve('../../a.txt'));
});

test('should drop leading dots in .dir', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b'};

	assert.is(findConfig('.fred', options), null);
	assert.is(findConfig('.waldo', options), pathResolve('fixtures/.config/waldo'));

	process.chdir('fixtures/a/b');

	assert.is(findConfig('.fred'), null);
	assert.is(findConfig('.waldo'), pathResolve('../../.config/waldo'));
});

test('should keep leading dots in .dir', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b', dot: true};

	assert.is(findConfig('.fred', options), pathResolve('fixtures/.config/.fred'));
	assert.is(findConfig('.waldo', options), null);

	process.chdir('fixtures/a/b');
	options = {dot: true};

	assert.is(findConfig('.fred', options), pathResolve('../../.config/.fred'));
	assert.is(findConfig('.waldo', options), null);
});

test('should resolve modules', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b', module: true};

	assert.is(findConfig('b', options), pathResolve('fixtures/b.js'));
	assert.is(findConfig('baz', options), pathResolve('fixtures/a/.config/baz.js'));

	process.chdir('fixtures/a/b');
	options = {module: true};

	assert.is(findConfig('b', options), pathResolve('../../b.js'));
	assert.is(findConfig('baz', options), pathResolve('../.config/baz.js'));
});

test('should not find non-existant files', async assert => {
	setup();

	assert.is(findConfig(), null);
	assert.is(findConfig(null), null);
	assert.is(findConfig(nofile, {home: false}), null);
});

test('should read files', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b'};

	assert.is(findConfig.read('foo.txt', options), 'foo\n');
	assert.is(findConfig.read('baz.txt', options), 'baz\n');
});

test('should not read non-existant files', async assert => {
	setup();

	assert.is(findConfig.read(), null);
	assert.is(findConfig.read(null), null);
	assert.is(findConfig.read(nofile), null);
	assert.is(findConfig.read(nofile, {home: false}), null);

	assert.throws(() => {
		findConfig.read('b', {cwd: 'fixtures/a/b'});
	});
});

test('should require files', async assert => {
	setup();

	let options = {cwd: 'fixtures/a/b'};

	assert.same(findConfig.require('b', options), {a: 1});
	assert.same(findConfig.require('baz', options), {b: 2});
});

test('should not require non-existant files', async assert => {
	setup();

	assert.is(findConfig.require(), null);
	assert.is(findConfig.require(null), null);
	assert.is(findConfig.require(nofile), null);
	assert.is(findConfig.require(nofile, {home: false}), null);
});
