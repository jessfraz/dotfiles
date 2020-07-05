// --------------------
// fs-extra-promise
// --------------------

// modules
var fsExtra = require('fs-extra'),
	Promise = require('bluebird');

// exports
var makeFs = function(Promise) {
	// clone fs-extra
	var fs = {};
	for (var methodName in fsExtra) {
		fs[methodName] = fsExtra[methodName];
	}

	// extend fs with isDirectory and isDirectorySync methods
	fs.isDirectory = function(path, callback) {
		fs.stat(path, function(err, stats) {
			if (err) return callback(err);

			callback(null, stats.isDirectory());
		});
	};

	fs.isDirectorySync = function(path) {
		return fs.statSync(path).isDirectory();
	};

	// promisify all methods
	// (except those ending with 'Sync', classes and various methods which do not use a callback)
	var method;
	for (methodName in fs) {
		method = fs[methodName];

		if (typeof method != 'function') continue;
		if (methodName.slice(-4) == 'Sync') continue;
		if (methodName.match(/^[A-Z]/)) continue;
		if (['exists', 'watch', 'watchFile', 'unwatchFile', 'createReadStream'].indexOf(methodName) != -1) continue;

		fs[methodName + 'Async'] = Promise.promisify(method);
	}

	// create fs.existsAsync()
	// fs.exists() is asynchronous but does not call callback with usual node (err, result) signature - uses just (result)
	fs.existsAsync = function(path) {
		return new Promise(function(resolve) {
			fs.exists(path, function(exists) {
				resolve(exists);
			});
		});
	};

	// usePromise method to set Promise used internally (e.g. by using bluebird-extra module)
	fs.usePromise = makeFs;

	// return fs
	return fs;
};

// export fs promisified with bluebird
module.exports = makeFs(Promise);
