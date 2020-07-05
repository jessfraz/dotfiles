/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const vscode = require("vscode");
const serviceclient_1 = require("../languageservice/serviceclient");
const queryNotificationHandler_1 = require("./queryNotificationHandler");
const vscodeWrapper_1 = require("./vscodeWrapper");
const queryExecute_1 = require("../models/contracts/queryExecute");
const queryDispose_1 = require("../models/contracts/queryDispose");
const queryCancel_1 = require("../models/contracts/queryCancel");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const Utils = require("./../models/utils");
const os = require("os");
/*
* Query Runner class which handles running a query, reports the results to the content manager,
* and handles getting more rows from the service layer and disposing when the content is closed.
*/
class QueryRunner {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(_ownerUri, _editorTitle, _statusView, _client, _notificationHandler, _vscodeWrapper) {
        this._ownerUri = _ownerUri;
        this._editorTitle = _editorTitle;
        this._statusView = _statusView;
        this._client = _client;
        this._notificationHandler = _notificationHandler;
        this._vscodeWrapper = _vscodeWrapper;
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._batchSets = [];
        this._isSqlCmd = false;
        this.eventEmitter = new events_1.EventEmitter();
        this._uriToQueryPromiseMap = new Map();
        this._uriToQueryStringMap = new Map();
        if (!_client) {
            this._client = serviceclient_1.default.instance;
        }
        if (!_notificationHandler) {
            this._notificationHandler = queryNotificationHandler_1.QueryNotificationHandler.instance;
        }
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        // Store the state
        this._isExecuting = false;
        this._totalElapsedMilliseconds = 0;
        this._hasCompleted = false;
    }
    // PROPERTIES //////////////////////////////////////////////////////////
    get uri() {
        return this._ownerUri;
    }
    set uri(uri) {
        this._ownerUri = uri;
    }
    get title() {
        return this._editorTitle;
    }
    set title(title) {
        this._editorTitle = title;
    }
    get batchSets() {
        return this._batchSets;
    }
    set batchSets(batchSets) {
        this._batchSets = batchSets;
    }
    get isExecutingQuery() {
        return this._isExecuting;
    }
    get hasCompleted() {
        return this._hasCompleted;
    }
    get isSqlCmd() {
        return this._isSqlCmd;
    }
    set isSqlCmd(value) {
        this._isSqlCmd = value;
    }
    set hasCompleted(value) {
        this._hasCompleted = value;
    }
    // PUBLIC METHODS ======================================================
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            // Make the request to cancel the query
            let cancelParams = { ownerUri: this._ownerUri };
            let queryCancelResult = yield this._client.sendRequest(queryCancel_1.QueryCancelRequest.type, cancelParams);
            return queryCancelResult;
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    runStatement(line, column) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doRunQuery({ startLine: line, startColumn: column, endLine: 0, endColumn: 0 }, (onSuccess, onError) => __awaiter(this, void 0, void 0, function* () {
                // Put together the request
                let queryDetails = {
                    ownerUri: this._ownerUri,
                    line: line,
                    column: column
                };
                // Send the request to execute the query
                yield this._client.sendRequest(queryExecute_1.QueryExecuteStatementRequest.type, queryDetails).then(onSuccess, onError);
            }));
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    runQuery(selection, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doRunQuery(selection, (onSuccess, onError) => __awaiter(this, void 0, void 0, function* () {
                // Put together the request
                let queryDetails = {
                    ownerUri: this._ownerUri,
                    querySelection: selection
                };
                const doc = yield this._vscodeWrapper.openTextDocument(this._vscodeWrapper.parseUri(this._ownerUri));
                let queryString;
                if (selection) {
                    let range = this._vscodeWrapper.range(this._vscodeWrapper.position(selection.startLine, selection.startColumn), this._vscodeWrapper.position(selection.endLine, selection.endColumn));
                    queryString = doc.getText(range);
                }
                else {
                    queryString = doc.getText();
                }
                // Set the query string for the uri
                this._uriToQueryStringMap.set(this._ownerUri, queryString);
                // Send the request to execute the query
                if (promise) {
                    this._uriToQueryPromiseMap.set(this._ownerUri, promise);
                }
                yield this._client.sendRequest(queryExecute_1.QueryExecuteRequest.type, queryDetails).then(onSuccess, onError);
            }));
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    doRunQuery(selection, queryCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgStartedExecute, this._ownerUri));
            // Update internal state to show that we're executing the query
            this._resultLineOffset = selection ? selection.startLine : 0;
            this._isExecuting = true;
            this._totalElapsedMilliseconds = 0;
            this._statusView.executingQuery(this.uri);
            let onSuccess = (result) => {
                // The query has started, so lets fire up the result pane
                this.eventEmitter.emit('start', this.uri);
                this._notificationHandler.registerRunner(this, this._ownerUri);
            };
            let onError = (error) => {
                this._statusView.executedQuery(this.uri);
                this._isExecuting = false;
                // TODO: localize
                this._vscodeWrapper.showErrorMessage('Execution failed: ' + error.message);
            };
            yield queryCallback(onSuccess, onError);
        });
    }
    // handle the result of the notification
    handleQueryComplete(result) {
        this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgFinishedExecute, this._ownerUri));
        // Store the batch sets we got back as a source of "truth"
        this._isExecuting = false;
        this._hasCompleted = true;
        this._batchSets = result.batchSummaries;
        this._batchSets.map((batch) => {
            if (batch.selection) {
                batch.selection.startLine = batch.selection.startLine + this._resultLineOffset;
                batch.selection.endLine = batch.selection.endLine + this._resultLineOffset;
            }
        });
        // We're done with this query so shut down any waiting mechanisms
        const promise = this._uriToQueryPromiseMap.get(result.ownerUri);
        if (promise) {
            promise.resolve();
            this._uriToQueryPromiseMap.delete(result.ownerUri);
        }
        this._statusView.executedQuery(result.ownerUri);
        let hasError = this._batchSets.some(batch => batch.hasError === true);
        this.eventEmitter.emit('complete', Utils.parseNumAsTimeString(this._totalElapsedMilliseconds), hasError);
    }
    handleBatchStart(result) {
        let batch = result.batchSummary;
        // Recalculate the start and end lines, relative to the result line offset
        if (batch.selection) {
            batch.selection.startLine += this._resultLineOffset;
            batch.selection.endLine += this._resultLineOffset;
        }
        // Set the result sets as an empty array so that as result sets complete we can add to the list
        batch.resultSetSummaries = [];
        // Store the batch
        this._batchSets[batch.id] = batch;
        this.eventEmitter.emit('batchStart', batch);
    }
    handleBatchComplete(result) {
        let batch = result.batchSummary;
        // Store the batch again to get the rest of the data
        this._batchSets[batch.id] = batch;
        let executionTime = (Utils.parseTimeString(batch.executionElapsed) || 0);
        this._totalElapsedMilliseconds += executionTime;
        if (executionTime > 0) {
            // send a time message in the format used for query complete
            this.sendBatchTimeMessage(batch.id, Utils.parseNumAsTimeString(executionTime));
        }
        this.eventEmitter.emit('batchComplete', batch);
    }
    /**
     * Refreshes the webview panel with the query results when tabs are changed
     */
    refreshQueryTab(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            this._isExecuting = true;
            this._hasCompleted = false;
            for (let batchId = 0; batchId < this.batchSets.length; batchId++) {
                const batchSet = this.batchSets[batchId];
                this.eventEmitter.emit('batchStart', batchSet);
                let executionTime = (Utils.parseTimeString(batchSet.executionElapsed) || 0);
                this._totalElapsedMilliseconds += executionTime;
                if (executionTime > 0) {
                    // send a time message in the format used for query complete
                    this.sendBatchTimeMessage(batchSet.id, Utils.parseNumAsTimeString(executionTime));
                }
                this.eventEmitter.emit('batchComplete', batchSet);
                for (let resultSetId = 0; resultSetId < batchSet.resultSetSummaries.length; resultSetId++) {
                    let resultSet = batchSet.resultSetSummaries[resultSetId];
                    this.eventEmitter.emit('resultSet', resultSet, true);
                }
            }
            // We're done with this query so shut down any waiting mechanisms
            this._statusView.executedQuery(uri);
            this._isExecuting = false;
            this._hasCompleted = true;
            this.eventEmitter.emit('complete', Utils.parseNumAsTimeString(this._totalElapsedMilliseconds), true, true);
            return true;
        });
    }
    handleResultSetComplete(result) {
        let resultSet = result.resultSetSummary;
        let batchSet = this._batchSets[resultSet.batchId];
        // Store the result set in the batch and emit that a result set has completed
        batchSet.resultSetSummaries[resultSet.id] = resultSet;
        this.eventEmitter.emit('resultSet', resultSet);
    }
    handleMessage(obj) {
        let message = obj.message;
        message.time = new Date(message.time).toLocaleTimeString();
        // Send the message to the results pane
        this.eventEmitter.emit('message', message);
        // Set row count on status bar if there are no errors
        if (!obj.message.isError) {
            this._statusView.showRowCount(obj.ownerUri, obj.message.message);
        }
        else {
            this._statusView.hideRowCount(obj.ownerUri, true);
        }
    }
    /*
     * Get more data rows from the current resultSets from the service layer
     */
    getRows(rowStart, numberOfRows, batchIndex, resultSetIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryDetails = new queryExecute_1.QueryExecuteSubsetParams();
            queryDetails.ownerUri = this.uri;
            queryDetails.resultSetIndex = resultSetIndex;
            queryDetails.rowsCount = numberOfRows;
            queryDetails.rowsStartIndex = rowStart;
            queryDetails.batchIndex = batchIndex;
            try {
                const queryExecuteSubsetResult = yield this._client.sendRequest(queryExecute_1.QueryExecuteSubsetRequest.type, queryDetails);
                if (queryExecuteSubsetResult) {
                    return queryExecuteSubsetResult;
                }
            }
            catch (error) {
                // TODO: Localize
                this._vscodeWrapper.showErrorMessage('Something went wrong getting more rows: ' + error.message);
                Promise.reject(error);
            }
        });
    }
    /**
     * Disposes the Query from the service client
     * @returns A promise that will be rejected if a problem occured
     */
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            let disposeDetails = new queryDispose_1.QueryDisposeParams();
            disposeDetails.ownerUri = this.uri;
            try {
                yield this._client.sendRequest(queryDispose_1.QueryDisposeRequest.type, disposeDetails);
            }
            catch (error) {
                // TODO: Localize
                this._vscodeWrapper.showErrorMessage('Failed disposing query: ' + error.message);
                Promise.reject(error);
            }
        });
    }
    getColumnHeaders(batchId, resultId, range) {
        let headers = undefined;
        let batchSummary = this.batchSets[batchId];
        if (batchSummary !== undefined) {
            let resultSetSummary = batchSummary.resultSetSummaries[resultId];
            headers = resultSetSummary.columnInfo.slice(range.fromCell, range.toCell + 1).map((info, i) => {
                return info.columnName;
            });
        }
        return headers;
    }
    /**
     * Copy the result range to the system clip-board
     * @param selection The selection range array to copy
     * @param batchId The id of the batch to copy from
     * @param resultId The id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection, batchId, resultId, includeHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
            let copyString = '';
            // add the column headers
            if (this.shouldIncludeHeaders(includeHeaders)) {
                let firstCol;
                let lastCol;
                for (let range of selection) {
                    if (firstCol === undefined || (range.fromCell < firstCol)) {
                        firstCol = range.fromCell;
                    }
                    if (lastCol === undefined || (range.toCell > lastCol)) {
                        lastCol = range.toCell;
                    }
                }
                let columnRange = {
                    fromCell: firstCol,
                    toCell: lastCol,
                    fromRow: undefined,
                    toRow: undefined
                };
                let columnHeaders = this.getColumnHeaders(batchId, resultId, columnRange);
                copyString += columnHeaders.join('\t');
                copyString += os.EOL;
            }
            // sort the selections by row to maintain copy order
            selection.sort((a, b) => a.fromRow - b.fromRow);
            // create a mapping of rows to selections
            let rowIdToSelectionMap = new Map();
            let rowIdToRowMap = new Map();
            // create a mapping of the ranges to get promises
            let tasks = selection.map((range) => {
                return () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield this.getRows(range.fromRow, range.toRow - range.fromRow + 1, batchId, resultId);
                    for (let row of result.resultSubset.rows) {
                        let rowNumber = row[0].rowId + range.fromRow;
                        if (rowIdToSelectionMap.has(rowNumber)) {
                            let rowSelection = rowIdToSelectionMap.get(rowNumber);
                            rowSelection.push(range);
                        }
                        else {
                            rowIdToSelectionMap.set(rowNumber, [range]);
                        }
                        rowIdToRowMap.set(rowNumber, row);
                    }
                });
            });
            // get all the rows
            let p = tasks[0]();
            for (let i = 1; i < tasks.length; i++) {
                p = p.then(tasks[i]);
            }
            yield p;
            // Go through all rows and get selections for them
            let allRowIds = rowIdToRowMap.keys();
            const endColumns = this.getSelectionEndColumns(rowIdToRowMap, rowIdToSelectionMap);
            const firstColumn = endColumns[0];
            const lastColumn = endColumns[1];
            for (let rowId of allRowIds) {
                let row = rowIdToRowMap.get(rowId);
                const rowSelections = rowIdToSelectionMap.get(rowId);
                // sort selections by column to go from left to right
                rowSelections.sort((a, b) => {
                    return ((a.fromCell < b.fromCell) ? -1 : (a.fromCell > b.fromCell) ? 1 : 0);
                });
                for (let i = 0; i < rowSelections.length; i++) {
                    let rowSelection = rowSelections[i];
                    // Add tabs starting from the first column of the selection
                    for (let j = firstColumn; j < rowSelection.fromCell; j++) {
                        copyString += '\t';
                    }
                    let cellObjects = row.slice(rowSelection.fromCell, (rowSelection.toCell + 1));
                    // Remove newlines if requested
                    let cells = this.shouldRemoveNewLines()
                        ? cellObjects.map(x => this.removeNewLines(x.displayValue))
                        : cellObjects.map(x => x.displayValue);
                    copyString += cells.join('\t');
                    // Add tabs until the end column of the selection
                    for (let k = rowSelection.toCell; k < lastColumn; k++) {
                        copyString += '\t';
                    }
                }
                copyString += os.EOL;
            }
            // Remove the last extra new line
            if (copyString.length > 1) {
                copyString = copyString.substring(0, copyString.length - os.EOL.length);
            }
            let oldLang;
            if (process.platform === 'darwin') {
                oldLang = process.env['LANG'];
                process.env['LANG'] = 'en_US.UTF-8';
            }
            yield this._vscodeWrapper.clipboardWriteText(copyString);
            if (process.platform === 'darwin') {
                process.env['LANG'] = oldLang;
            }
        });
    }
    toggleSqlCmd() {
        return __awaiter(this, void 0, void 0, function* () {
            const queryExecuteOptions = { options: {} };
            queryExecuteOptions.options['isSqlCmdMode'] = !this.isSqlCmd;
            const queryExecuteOptionsParams = {
                ownerUri: this.uri,
                options: queryExecuteOptions
            };
            yield this._client.sendRequest(queryExecute_1.QueryExecuteOptionsRequest.type, queryExecuteOptionsParams);
            this._isSqlCmd = !this._isSqlCmd;
            return true;
        });
    }
    shouldIncludeHeaders(includeHeaders) {
        if (includeHeaders !== undefined) {
            // Respect the value explicity passed into the method
            return includeHeaders;
        }
        // else get config option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        includeHeaders = config.get(Constants.copyIncludeHeaders);
        return !!includeHeaders;
    }
    shouldRemoveNewLines() {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        let removeNewLines = config.get(Constants.configCopyRemoveNewLine);
        return removeNewLines;
    }
    removeNewLines(inputString) {
        // This regex removes all newlines in all OS types
        // Windows(CRLF): \r\n
        // Linux(LF)/Modern MacOS: \n
        // Old MacOs: \r
        let outputString = inputString.replace(/(\r\n|\n|\r)/gm, '');
        return outputString;
    }
    sendBatchTimeMessage(batchId, executionTime) {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        let showBatchTime = config.get(Constants.configShowBatchTime);
        if (showBatchTime) {
            let message = {
                batchId: batchId,
                message: Utils.formatString(LocalizedConstants.elapsedBatchTime, executionTime),
                time: undefined,
                isError: false
            };
            // Send the message to the results pane
            this.eventEmitter.emit('message', message);
        }
    }
    /**
     * Gets the first and last column of a selection: [first, last]
     */
    getSelectionEndColumns(rowIdToRowMap, rowIdToSelectionMap) {
        let allRowIds = rowIdToRowMap.keys();
        let firstColumn = -1;
        let lastColumn = -1;
        for (let rowId of allRowIds) {
            const rowSelections = rowIdToSelectionMap.get(rowId);
            for (let i = 0; i < rowSelections.length; i++) {
                if (firstColumn === -1 || rowSelections[i].fromCell < firstColumn) {
                    firstColumn = rowSelections[i].fromCell;
                }
                if (lastColumn === -1 || rowSelections[i].toCell > lastColumn) {
                    lastColumn = rowSelections[i].toCell;
                }
            }
        }
        return [firstColumn, lastColumn];
    }
    /**
     * Sets a selection range in the editor for this query
     * @param selection The selection range to select
     */
    setEditorSelection(selection) {
        return __awaiter(this, void 0, void 0, function* () {
            const docExists = this._vscodeWrapper.textDocuments.find(textDoc => textDoc.uri.toString(true) === this.uri);
            if (docExists) {
                let column = vscode.ViewColumn.One;
                const doc = yield this._vscodeWrapper.openTextDocument(this._vscodeWrapper.parseUri(this.uri));
                const activeTextEditor = this._vscodeWrapper.activeTextEditor;
                if (activeTextEditor) {
                    column = activeTextEditor.viewColumn;
                }
                let editor = yield this._vscodeWrapper.showTextDocument(doc, {
                    viewColumn: column,
                    preserveFocus: false,
                    preview: false
                });
                let querySelection = new vscode.Selection(selection.startLine, selection.startColumn, selection.endLine, selection.endColumn);
                editor.selection = querySelection;
                return;
            }
        });
    }
    getQueryString(uri) {
        if (this._uriToQueryStringMap.has(uri)) {
            return this._uriToQueryStringMap.get(uri);
        }
        return undefined;
    }
    resetHasCompleted() {
        this._hasCompleted = false;
    }
    // public for testing only - used to mock handleQueryComplete
    setHasCompleted() {
        this._hasCompleted = true;
    }
    get totalElapsedMilliseconds() {
        return this._totalElapsedMilliseconds;
    }
}
exports.default = QueryRunner;

//# sourceMappingURL=queryRunner.js.map
