// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
// tslint:disable-next-line: no-any
async function requirePromise(pkg) {
    return new Promise((resolve, reject) => {
        // tslint:disable-next-line: no-any
        const requirejs = window.requirejs;
        if (requirejs === undefined) {
            reject('Requirejs is needed, please ensure it is loaded on the page.');
        }
        else {
            requirejs(pkg, resolve, reject);
        }
    });
}
export function requireLoader(moduleName) {
    return requirePromise([`${moduleName}`]);
}
//# sourceMappingURL=widgetLoader.js.map