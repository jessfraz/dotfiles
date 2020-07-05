/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

"use strict";

// This is the extension entrypoint, which imports extension.js, the actual extension code.
//
// This is in a separate file so we can properly measure extension.js load time.

let perfStats = {
    loadStartTime: Date.now(),
    loadEndTime: undefined
};

Object.defineProperty(exports, "__esModule", { value: true });

const ignoreBundle = !/^(false|0)?$/i.test(process.env.AZCODE_DOCKER_IGNORE_BUNDLE || '');
const extensionPath = ignoreBundle ? "./out/src/extension" : "./dist/extension.bundle";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const extension = require(extensionPath);

async function activate(ctx) {
    return await extension.activateInternal(ctx, perfStats);
}

async function deactivate(ctx) {
    return await extension.deactivateInternal(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;

perfStats.loadEndTime = Date.now();
