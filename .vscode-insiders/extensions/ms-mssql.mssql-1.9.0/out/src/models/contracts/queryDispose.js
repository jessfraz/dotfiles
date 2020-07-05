"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
var QueryDisposeRequest;
(function (QueryDisposeRequest) {
    QueryDisposeRequest.type = new vscode_languageclient_1.RequestType('query/dispose');
})(QueryDisposeRequest = exports.QueryDisposeRequest || (exports.QueryDisposeRequest = {}));
/**
 * Parameters to provide when disposing of a query
 */
class QueryDisposeParams {
}
exports.QueryDisposeParams = QueryDisposeParams;
/**
 * Result received upon successful disposal of a query
 */
class QueryDisposeResult {
}
exports.QueryDisposeResult = QueryDisposeResult;

//# sourceMappingURL=queryDispose.js.map
