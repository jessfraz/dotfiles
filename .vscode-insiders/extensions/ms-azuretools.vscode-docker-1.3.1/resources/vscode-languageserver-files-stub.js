// This stub is a subset of the code from files.ts in vscode-languageserver
// (https://github.com/Microsoft/vscode-languageserver-node/blob/master/server/src/files.ts), which is used
// by https://www.npmjs.com/package/dockerfile-language-server-nodejs. It contains some dynamic imports that
// can't be webpack'ed. Since dockerfile-language-server-node only uses the uriToFilePath utility from this
// file and that function doesn't have issues, the easiest solution is to copy just that function here.
//
// The original files.js file gets replaced by this file during webpack

/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
/**
 * @deprecated Use the `vscode-uri` npm module which provides a more
 * complete implementation of handling VS Code URIs.
 */
function uriToFilePath(uri) {
    let parsed = url.parse(uri);
    if (parsed.protocol !== 'file:' || !parsed.path) {
        return undefined;
    }
    let segments = parsed.path.split('/');
    for (var i = 0, len = segments.length; i < len; i++) {
        segments[i] = decodeURIComponent(segments[i]);
    }
    if (process.platform === 'win32' && segments.length > 1) {
        let first = segments[0];
        let second = segments[1];
        // Do we have a drive letter and we started with a / which is the
        // case if the first segement is empty (see split above)
        if (first.length === 0 && second.length > 1 && second[1] === ':') {
            // Remove first slash
            segments.shift();
        }
    }
    return path.normalize(segments.join('/'));
}
exports.uriToFilePath = uriToFilePath;

// END OF ORIGINAL CODE

// Throw NYI if any of the other functions are ever called (they shouldn't be currently)
function resolveModule(workspaceRoot, moduleName) {
    throw new Error('Not implemented');
}
exports.resolveModule = resolveModule;
function resolve(moduleName, nodePath, cwd, tracer) {
    throw new Error('Not implemented');
}
exports.resolve = resolve;
function resolveGlobalNodePath(tracer) {
    throw new Error('Not implemented');
}
exports.resolveGlobalNodePath = resolveGlobalNodePath;
function resolveGlobalYarnPath(tracer) {
    throw new Error('Not implemented');
}
exports.resolveGlobalYarnPath = resolveGlobalYarnPath;
function resolveModulePath(workspaceRoot, moduleName, nodePath, tracer) {
    throw new Error('Not implemented');
}
exports.resolveModulePath = resolveModulePath;
function resolveModule2(workspaceRoot, moduleName, nodePath, tracer) {
    throw new Error('Not implemented');
}
exports.resolveModule2 = resolveModule2;
