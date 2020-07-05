"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < Close Session Response > ----------------------------------------------
/**
 * Information returned from a CloseSessionRequest.
 * Contains success information, a SessionId to be used when
 * requesting closing an existing session.
 */
class CloseSessionResponse {
}
exports.CloseSessionResponse = CloseSessionResponse;
/**
 * Parameters to the CloseSessionRequest
 */
class CloseSessionParams {
}
exports.CloseSessionParams = CloseSessionParams;
/**
 * Information returned when a session is disconnected.
 * Contains success information and a SessionId
 */
class SessionDisconnectedParameters {
}
exports.SessionDisconnectedParameters = SessionDisconnectedParameters;
// ------------------------------- < Close Session Request > ----------------------------------------------
/**
 * Closes an Object Explorer tree session for a specific connection.
 * This will close a connection to a specific server or database
 */
var CloseSessionRequest;
(function (CloseSessionRequest) {
    CloseSessionRequest.type = new vscode_languageclient_1.RequestType('objectexplorer/closesession');
})(CloseSessionRequest = exports.CloseSessionRequest || (exports.CloseSessionRequest = {}));
/**
 * Session disconnected notification
 */
var SessionDisconnectedNotification;
(function (SessionDisconnectedNotification) {
    SessionDisconnectedNotification.type = new vscode_languageclient_1.NotificationType('objectexplorer/sessiondisconnected');
})(SessionDisconnectedNotification = exports.SessionDisconnectedNotification || (exports.SessionDisconnectedNotification = {}));

//# sourceMappingURL=closeSessionRequest.js.map
