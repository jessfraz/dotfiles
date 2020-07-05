"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
class ResultSetSummary {
}
exports.ResultSetSummary = ResultSetSummary;
class BatchSummary {
}
exports.BatchSummary = BatchSummary;
// ------------------------------- < Query Execution Complete Notification > ------------------------------------
var QueryExecuteCompleteNotification;
(function (QueryExecuteCompleteNotification) {
    QueryExecuteCompleteNotification.type = new vscode_languageclient_1.NotificationType('query/complete');
})(QueryExecuteCompleteNotification = exports.QueryExecuteCompleteNotification || (exports.QueryExecuteCompleteNotification = {}));
class QueryExecuteCompleteNotificationResult {
}
exports.QueryExecuteCompleteNotificationResult = QueryExecuteCompleteNotificationResult;
// Query Batch Notification -----------------------------------------------------------------------
class QueryExecuteBatchNotificationParams {
}
exports.QueryExecuteBatchNotificationParams = QueryExecuteBatchNotificationParams;
// ------------------------------- < Query Batch Start  Notification > ------------------------------------
var QueryExecuteBatchStartNotification;
(function (QueryExecuteBatchStartNotification) {
    QueryExecuteBatchStartNotification.type = new vscode_languageclient_1.NotificationType('query/batchStart');
})(QueryExecuteBatchStartNotification = exports.QueryExecuteBatchStartNotification || (exports.QueryExecuteBatchStartNotification = {}));
// ------------------------------- < Query Batch Complete Notification > ------------------------------------
var QueryExecuteBatchCompleteNotification;
(function (QueryExecuteBatchCompleteNotification) {
    QueryExecuteBatchCompleteNotification.type = new vscode_languageclient_1.NotificationType('query/batchComplete');
})(QueryExecuteBatchCompleteNotification = exports.QueryExecuteBatchCompleteNotification || (exports.QueryExecuteBatchCompleteNotification = {}));
// Query ResultSet Complete Notification -----------------------------------------------------------
var QueryExecuteResultSetCompleteNotification;
(function (QueryExecuteResultSetCompleteNotification) {
    QueryExecuteResultSetCompleteNotification.type = new vscode_languageclient_1.NotificationType('query/resultSetComplete');
})(QueryExecuteResultSetCompleteNotification = exports.QueryExecuteResultSetCompleteNotification || (exports.QueryExecuteResultSetCompleteNotification = {}));
class QueryExecuteResultSetCompleteNotificationParams {
}
exports.QueryExecuteResultSetCompleteNotificationParams = QueryExecuteResultSetCompleteNotificationParams;
// ------------------------------- < Query Message Notification > ------------------------------------
var QueryExecuteMessageNotification;
(function (QueryExecuteMessageNotification) {
    QueryExecuteMessageNotification.type = new vscode_languageclient_1.NotificationType('query/message');
})(QueryExecuteMessageNotification = exports.QueryExecuteMessageNotification || (exports.QueryExecuteMessageNotification = {}));
class QueryExecuteMessageParams {
}
exports.QueryExecuteMessageParams = QueryExecuteMessageParams;
// ------------------------------- < Query Execution Request > ------------------------------------
var QueryExecuteRequest;
(function (QueryExecuteRequest) {
    QueryExecuteRequest.type = new vscode_languageclient_1.RequestType('query/executeDocumentSelection');
})(QueryExecuteRequest = exports.QueryExecuteRequest || (exports.QueryExecuteRequest = {}));
var QueryExecuteStatementRequest;
(function (QueryExecuteStatementRequest) {
    QueryExecuteStatementRequest.type = new vscode_languageclient_1.RequestType('query/executedocumentstatement');
})(QueryExecuteStatementRequest = exports.QueryExecuteStatementRequest || (exports.QueryExecuteStatementRequest = {}));
class QueryExecuteParams {
}
exports.QueryExecuteParams = QueryExecuteParams;
class QueryExecuteStatementParams {
}
exports.QueryExecuteStatementParams = QueryExecuteStatementParams;
class QueryExecuteResult {
}
exports.QueryExecuteResult = QueryExecuteResult;
// ------------------------------- < Query Results Request > ------------------------------------
var QueryExecuteSubsetRequest;
(function (QueryExecuteSubsetRequest) {
    QueryExecuteSubsetRequest.type = new vscode_languageclient_1.RequestType('query/subset');
})(QueryExecuteSubsetRequest = exports.QueryExecuteSubsetRequest || (exports.QueryExecuteSubsetRequest = {}));
class QueryExecuteSubsetParams {
}
exports.QueryExecuteSubsetParams = QueryExecuteSubsetParams;
class DbCellValue {
}
exports.DbCellValue = DbCellValue;
class ResultSetSubset {
}
exports.ResultSetSubset = ResultSetSubset;
class QueryExecuteSubsetResult {
}
exports.QueryExecuteSubsetResult = QueryExecuteSubsetResult;
// ------------------------------- < Query Execution Options Request > ------------------------------------
var QueryExecuteOptionsRequest;
(function (QueryExecuteOptionsRequest) {
    QueryExecuteOptionsRequest.type = new vscode_languageclient_1.RequestType('query/setexecutionoptions');
})(QueryExecuteOptionsRequest = exports.QueryExecuteOptionsRequest || (exports.QueryExecuteOptionsRequest = {}));
class QueryExecutionOptionsParams {
}
exports.QueryExecutionOptionsParams = QueryExecutionOptionsParams;

//# sourceMappingURL=queryExecute.js.map
