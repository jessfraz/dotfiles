'use strict';

// Cspell:word configstore
var Configstore = require('configstore');
var Path = require('path');

var packageName = 'cspell';
var importPath = 'import';
var configLocation = Path.join(__dirname, 'cspell-ext.json');

function getImports(conf) {
  var imports = conf.get(importPath);

  imports = imports || [];
  if (typeof imports === 'string') {
    imports = [imports];
  }

  return imports;
}

function install() {
  var conf = new Configstore(packageName);
  /** @type {string[]|string|undefined} */

  var imports = getImports(conf);
  if (imports.indexOf(configLocation) < 0) {
    imports.push(configLocation);
    conf.set(importPath, imports);
  }
}

function uninstall() {
  var conf = new Configstore(packageName);
  /** @type {string[]|string|undefined} */
  var imports = getImports(conf);

  var index = imports.indexOf(configLocation);

  if (index >= 0) {
    imports.splice(index, 1);
    conf.set(importPath, imports);
  }
}

module.exports = {
  install,
  uninstall,
  configLocation,
};
