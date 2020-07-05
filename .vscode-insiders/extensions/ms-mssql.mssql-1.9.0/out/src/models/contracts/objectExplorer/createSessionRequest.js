"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < Create Session Request > ----------------------------------------------
// Create session request message callback declaration
var CreateSessionRequest;
(function (CreateSessionRequest) {
    CreateSessionRequest.type = new vscode_languageclient_1.RequestType('objectexplorer/createsession');
})(CreateSessionRequest = exports.CreateSessionRequest || (exports.CreateSessionRequest = {}));
/**
 * Contains success information, a sessionId to be used when requesting
 * expansion of nodes, and a root node to display for this area
 */
class CreateSessionResponse {
}
exports.CreateSessionResponse = CreateSessionResponse;
// ------------------------------- </ Create Session Request > ---------------------------------------------
// ------------------------------- < Create Session Complete Event > ---------------------------------------
/**
 * Information returned from a createSessionRequest. Contains success information, a sessionId to be used
 * when requesting expansion of nodes, and a root node to display for this area
 */
class SessionCreatedParameters {
}
exports.SessionCreatedParameters = SessionCreatedParameters;
/**
 * Connection complete event callback declaration.
 */
var CreateSessionCompleteNotification;
(function (CreateSessionCompleteNotification) {
    CreateSessionCompleteNotification.type = new vscode_languageclient_1.NotificationType('objectexplorer/sessioncreated');
})(CreateSessionCompleteNotification = exports.CreateSessionCompleteNotification || (exports.CreateSessionCompleteNotification = {}));

//# sourceMappingURL=createSessionRequest.js.map
