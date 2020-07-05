'use strict';

var fs = require('fs');
var path = require('path');
var home = require('user-home');

var fsReadFileSync = fs.readFileSync;
var fsStatSync = fs.statSync;
var pathJoin = path.join;
var pathResolve = path.resolve;

var DEFAULT_DIR = '.config';
var DEFAULT_ENC = 'utf8';
var LEADING_DOT = /^\./;
var PATH_SEP = path.sep;

// Does X/file.ext exist?
// Else, throw
function resolveFile(cwd, dir, filename) {
	dir = pathJoin(cwd, dir);

	var filepath = pathJoin(dir, filename);
	var stat = fsStatSync(filepath);

	return stat && {
		cwd: cwd,
		dir: dir,
		path: filepath
	};
}

// Does X/file.ext exist?
// Does X/file.ext.js exist?
// Does X/file.ext/index.js exist?
// Else, throw
function resolveModule(cwd, dir, filename) {
	dir = pathJoin(cwd, dir);

	var filepath = pathJoin(dir, filename);
	var resolved = require.resolve(filepath);

	return resolved && {
		cwd: cwd,
		dir: dir,
		path: resolved
	};
}

function findConfig(filename, options) {
	var config = findConfigObj(filename, options);

	return config && config.path;
}

function findConfigObj(filename, options) {
	if (!filename) {
		return null;
	}

	options = options || {};

	var fileObj;
	var dir = options.dir !== null && options.dir !== undefined ? options.dir : DEFAULT_DIR;
	var dotless = options.dot ? filename : filename.replace(LEADING_DOT, '');
	var resolve = options.module ? resolveModule : resolveFile;
	var cwd = pathResolve(options.cwd || '.').split(PATH_SEP);
	var i = cwd.length;

	function test(x) {
		// Does X/file.ext exist?
		try {
			return resolve(x, '', filename);
		} catch (e) {
		}

		// Does X/.dir/file.ext exist?
		try {
			return resolve(x, dir, dotless);
		} catch (e) {
		}
	}

	// Walk up path.
	while (i--) {
		fileObj = test(cwd.join(PATH_SEP));

		// istanbul ignore next
		if (fileObj) {
			return fileObj;
		}

		// Change X to parent.
		cwd.pop();
	}

	// Check in home.
	if (options.home || options.home === null || options.home === undefined) {
		fileObj = test(home);

		// istanbul ignore next
		if (fileObj) {
			return fileObj;
		}
	}

	return null;
}

function findConfigRead(filename, options) {
	if (!filename) {
		return null;
	}

	options = options || {};

	var filepath = findConfig(filename, options);

	return filepath && fsReadFileSync(filepath, {
		encoding: options.encoding || DEFAULT_ENC,
		flag: options.flag
	});
}

function findConfigRequire(filename, options) {
	if (!filename) {
		return null;
	}

	options = options || {};
	options.module = true;

	var filepath = findConfig(filename, options);

	return filepath && require(filepath);
}

module.exports = findConfig;
module.exports.obj = findConfigObj;
module.exports.read = findConfigRead;
module.exports.require = findConfigRequire;
