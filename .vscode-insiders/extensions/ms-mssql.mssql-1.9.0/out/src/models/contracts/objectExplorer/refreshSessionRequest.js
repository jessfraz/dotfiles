"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const expandNodeRequest_1 = require("./expandNodeRequest");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
/**
 * Parameters to the RefreshRequest.
 */
class RefreshParams extends expandNodeRequest_1.ExpandParams {
}
exports.RefreshParams = RefreshParams;
// ------------------------------- < Refresh Session Request > ----------------------------------------------
var RefreshRequest;
(function (RefreshRequest) {
    /**
     * Returns children of a given node as a NodeInfo array.
     */
    RefreshRequest.type = new vscode_jsonrpc_1.RequestType('objectexplorer/refresh');
})(RefreshRequest = exports.RefreshRequest || (exports.RefreshRequest = {}));

//# sourceMappingURL=refreshSessionRequest.js.map
