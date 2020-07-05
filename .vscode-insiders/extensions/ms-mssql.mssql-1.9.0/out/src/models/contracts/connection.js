"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < Connect Request > ----------------------------------------------
// Connection request message callback declaration
var ConnectionRequest;
(function (ConnectionRequest) {
    ConnectionRequest.type = new vscode_languageclient_1.RequestType('connection/connect');
})(ConnectionRequest = exports.ConnectionRequest || (exports.ConnectionRequest = {}));
/**
 * Parameters to initialize a connection to a database
 */
class ConnectionDetails {
    constructor() {
        this.options = {};
    }
}
exports.ConnectionDetails = ConnectionDetails;
/**
 * Connection request message format
 */
class ConnectParams {
}
exports.ConnectParams = ConnectParams;
// ------------------------------- </ Connect Request > ---------------------------------------------
// ------------------------------- < Connection Complete Event > ------------------------------------
/**
 * Connection complete event callback declaration.
 */
var ConnectionCompleteNotification;
(function (ConnectionCompleteNotification) {
    ConnectionCompleteNotification.type = new vscode_languageclient_1.NotificationType('connection/complete');
})(ConnectionCompleteNotification = exports.ConnectionCompleteNotification || (exports.ConnectionCompleteNotification = {}));
/**
 * Information about a SQL Server instance.
 */
class ServerInfo {
}
exports.ServerInfo = ServerInfo;
/**
 * Connection response format.
 */
class ConnectionCompleteParams {
}
exports.ConnectionCompleteParams = ConnectionCompleteParams;
// ------------------------------- </ Connection Complete Event > -----------------------------------
// ------------------------------- < Cancel Connect Request > ---------------------------------------
/**
 * Cancel connect request message callback declaration
 */
var CancelConnectRequest;
(function (CancelConnectRequest) {
    CancelConnectRequest.type = new vscode_languageclient_1.RequestType('connection/cancelconnect');
})(CancelConnectRequest = exports.CancelConnectRequest || (exports.CancelConnectRequest = {}));
/**
 * Cancel connect request message format
 */
class CancelConnectParams {
}
exports.CancelConnectParams = CancelConnectParams;
// ------------------------------- </ Cancel Connect Request > --------------------------------------
// ------------------------------- < Connection Changed Event > -------------------------------------
/**
 * Connection changed event callback declaration.
 */
var ConnectionChangedNotification;
(function (ConnectionChangedNotification) {
    ConnectionChangedNotification.type = new vscode_languageclient_1.NotificationType('connection/connectionchanged');
})(ConnectionChangedNotification = exports.ConnectionChangedNotification || (exports.ConnectionChangedNotification = {}));
/**
 * Summary that identifies a unique database connection.
 */
class ConnectionSummary {
}
exports.ConnectionSummary = ConnectionSummary;
/**
 * Parameters for the ConnectionChanged notification.
 */
class ConnectionChangedParams {
}
exports.ConnectionChangedParams = ConnectionChangedParams;
// ------------------------------- </ Connection Changed Event > ------------------------------------
// ------------------------------- < Disconnect Request > -------------------------------------------
// Disconnect request message callback declaration
var DisconnectRequest;
(function (DisconnectRequest) {
    DisconnectRequest.type = new vscode_languageclient_1.RequestType('connection/disconnect');
})(DisconnectRequest = exports.DisconnectRequest || (exports.DisconnectRequest = {}));
// Disconnect request message format
class DisconnectParams {
}
exports.DisconnectParams = DisconnectParams;
// ------------------------------- </ Disconnect Request > ------------------------------------------
// ------------------------------- < List Databases Request > ---------------------------------------
// List databases request callback declaration
var ListDatabasesRequest;
(function (ListDatabasesRequest) {
    ListDatabasesRequest.type = new vscode_languageclient_1.RequestType('connection/listdatabases');
})(ListDatabasesRequest = exports.ListDatabasesRequest || (exports.ListDatabasesRequest = {}));
// List databases request format
class ListDatabasesParams {
}
exports.ListDatabasesParams = ListDatabasesParams;
// List databases response format
class ListDatabasesResult {
}
exports.ListDatabasesResult = ListDatabasesResult;
// ------------------------------- </ List Databases Request > --------------------------------------

//# sourceMappingURL=connection.js.map
