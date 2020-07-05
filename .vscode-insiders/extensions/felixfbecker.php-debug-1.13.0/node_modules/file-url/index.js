'use strict';
const path = require('path');

module.exports = (str, opts) => {
	if (typeof str !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof str}`);
	}

	opts = Object.assign({resolve: true}, opts);

	let pathName = str;

	if (opts.resolve) {
		pathName = path.resolve(str);
	}

	pathName = pathName.replace(/\\/g, '/');

	// Windows drive letter must be prefixed with a slash
	if (pathName[0] !== '/') {
		pathName = `/${pathName}`;
	}

	// Escape required characters for path components
	// See: https://tools.ietf.org/html/rfc3986#section-3.3
	return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
};
