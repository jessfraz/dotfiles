'use strict';

require('ts-node').register({});
const { compileTypeScript, watchTypeScript } = require('build-tasks');

exports.default = compileTypeScript;
exports.watchTypeScript = watchTypeScript;
