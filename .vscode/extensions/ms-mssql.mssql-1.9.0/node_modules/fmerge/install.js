#!/usr/bin/env node

var fs = require('fs')

var js = fs.readFileSync('index.js', 'utf8')
var before =
';(function(root,factory) {\n\
if (typeof define === "function" && define.amd) {\n\
	// AMD. Register as an anonymous module.\n\
	define(factory);\n\
} else {\n\
	// Browser globals (root is window)\n\
	root.fmerge = factory()\n\
}}(this,function(){var module={},exports = module.exports = {};'
var after = ';return exports}());'

var min = before + js + after

fs.writeFileSync('fmerge.min.js', min)

console.log('`fmerge.min.js` created')
