"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < Expand Node Response > ----------------------------------------------
/**
 * Information returned from a "ExpandRequest"
 */
class ExpandResponse {
}
exports.ExpandResponse = ExpandResponse;
/**
 * Parameters to the ExpandRequest
 */
class ExpandParams {
}
exports.ExpandParams = ExpandParams;
// ------------------------------- < Expand Node Request > ----------------------------------------------
/**
 * A request to expand a Node
 */
var ExpandRequest;
(function (ExpandRequest) {
    /**
     * Returns children of a given node as a NodeInfo array
     */
    ExpandRequest.type = new vscode_languageclient_1.RequestType('objectexplorer/expand');
})(ExpandRequest = exports.ExpandRequest || (exports.ExpandRequest = {}));
/**
 * Expand notification mapping entry
 */
var ExpandCompleteNotification;
(function (ExpandCompleteNotification) {
    ExpandCompleteNotification.type = new vscode_languageclient_1.NotificationType('objectexplorer/expandCompleted');
})(ExpandCompleteNotification = exports.ExpandCompleteNotification || (exports.ExpandCompleteNotification = {}));

//# sourceMappingURL=expandNodeRequest.js.map
