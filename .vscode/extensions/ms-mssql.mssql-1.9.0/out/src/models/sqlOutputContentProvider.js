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
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const Utils = require("./utils");
const queryRunner_1 = require("../controllers/queryRunner");
const resultsSerializer_1 = require("../models/resultsSerializer");
const vscodeWrapper_1 = require("./../controllers/vscodeWrapper");
const webviewController_1 = require("../controllers/webviewController");
const pd = require('pretty-data').pd;
const deletionTimeoutTime = 1.8e6; // in ms, currently 30 minutes
// holds information about the state of a query runner
class QueryRunnerState {
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
        this.flaggedForDeletion = false;
    }
}
exports.QueryRunnerState = QueryRunnerState;
class ResultsConfig {
}
class SqlOutputContentProvider {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(context, _statusView, _vscodeWrapper) {
        this.context = context;
        this._statusView = _statusView;
        this._vscodeWrapper = _vscodeWrapper;
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._queryResultsMap = new Map();
        this._panels = new Map();
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    rowRequestHandler(uri, batchId, resultId, rowStart, numberOfRows) {
        return this._queryResultsMap.get(uri).queryRunner.getRows(rowStart, numberOfRows, batchId, resultId).then((r => r.resultSubset));
    }
    configRequestHandler(uri) {
        let queryUri = this._queryResultsMap.get(uri).queryRunner.uri;
        let extConfig = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let config = new ResultsConfig();
        for (let key of Constants.extConfigResultKeys) {
            config[key] = extConfig[key];
        }
        return Promise.resolve(config);
    }
    saveResultsRequestHandler(uri, batchId, resultId, format, selection) {
        let saveResults = new resultsSerializer_1.default();
        saveResults.onSaveResults(uri, batchId, resultId, format, selection);
    }
    openLinkRequestHandler(content, columnName, linkType) {
        this.openLink(content, columnName, linkType);
    }
    copyRequestHandler(uri, batchId, resultId, selection, includeHeaders) {
        this._queryResultsMap.get(uri).queryRunner.copyResults(selection, batchId, resultId, includeHeaders);
    }
    editorSelectionRequestHandler(uri, selection) {
        this._queryResultsMap.get(uri).queryRunner.setEditorSelection(selection);
    }
    showErrorRequestHandler(message) {
        this._vscodeWrapper.showErrorMessage(message);
    }
    showWarningRequestHandler(message) {
        this._vscodeWrapper.showWarningMessage(message);
    }
    // PUBLIC METHODS //////////////////////////////////////////////////////
    isRunningQuery(uri) {
        return !this._queryResultsMap.has(uri)
            ? false
            : this._queryResultsMap.get(uri).queryRunner.isExecutingQuery;
    }
    runQuery(statusView, uri, selection, title, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            // execute the query with a query runner
            yield this.runQueryCallback(statusView ? statusView : this._statusView, uri, title, (queryRunner) => __awaiter(this, void 0, void 0, function* () {
                if (queryRunner) {
                    // if the panel isn't active and exists
                    if (this._panels.get(uri).isActive === false) {
                        this._panels.get(uri).revealToForeground(uri);
                    }
                    yield queryRunner.runQuery(selection, promise);
                }
            }));
        });
    }
    runCurrentStatement(statusView, uri, selection, title) {
        return __awaiter(this, void 0, void 0, function* () {
            // execute the statement with a query runner
            yield this.runQueryCallback(statusView ? statusView : this._statusView, uri, title, (queryRunner) => {
                if (queryRunner) {
                    queryRunner.runStatement(selection.startLine, selection.startColumn);
                }
            });
        });
    }
    runQueryCallback(statusView, uri, title, queryCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryRunner = yield this.createQueryRunner(statusView ? statusView : this._statusView, uri, title);
            if (this._panels.has(uri)) {
                let panelController = this._panels.get(uri);
                if (panelController.isDisposed) {
                    this._panels.delete(uri);
                    yield this.createWebviewController(uri, title, queryRunner);
                }
                else {
                    queryCallback(queryRunner);
                    return;
                }
            }
            else {
                yield this.createWebviewController(uri, title, queryRunner);
            }
            if (queryRunner) {
                queryCallback(queryRunner);
            }
        });
    }
    createWebviewController(uri, title, queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxy = {
                getRows: (batchId, resultId, rowStart, numberOfRows) => this.rowRequestHandler(uri, batchId, resultId, rowStart, numberOfRows),
                copyResults: (batchId, resultsId, selection, includeHeaders) => this.copyRequestHandler(uri, batchId, resultsId, selection, includeHeaders),
                getConfig: () => this.configRequestHandler(uri),
                getLocalizedTexts: () => Promise.resolve(LocalizedConstants),
                openLink: (content, columnName, linkType) => this.openLinkRequestHandler(content, columnName, linkType),
                saveResults: (batchId, resultId, format, selection) => this.saveResultsRequestHandler(uri, batchId, resultId, format, selection),
                setEditorSelection: (selection) => this.editorSelectionRequestHandler(uri, selection),
                showError: (message) => this.showErrorRequestHandler(message),
                showWarning: (message) => this.showWarningRequestHandler(message),
                sendReadyEvent: () => __awaiter(this, void 0, void 0, function* () { return yield this.sendReadyEvent(uri); }),
                dispose: () => this._panels.delete(uri)
            };
            const controller = new webviewController_1.WebviewPanelController(this._vscodeWrapper, uri, title, proxy, this.context.extensionPath, this._statusView);
            this._panels.set(uri, controller);
            yield controller.init();
        });
    }
    createQueryRunner(statusView, uri, title) {
        // Reuse existing query runner if it exists
        let queryRunner;
        if (this._queryResultsMap.has(uri)) {
            let existingRunner = this._queryResultsMap.get(uri).queryRunner;
            // If the query is already in progress, don't attempt to send it
            if (existingRunner.isExecutingQuery) {
                this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgRunQueryInProgress);
                return;
            }
            // If the query is not in progress, we can reuse the query runner
            queryRunner = existingRunner;
            queryRunner.resetHasCompleted();
        }
        else {
            // We do not have a query runner for this editor, so create a new one
            // and map it to the results uri
            queryRunner = new queryRunner_1.default(uri, title, statusView ? statusView : this._statusView);
            queryRunner.eventEmitter.on('start', (panelUri) => {
                this._panels.get(uri).proxy.sendEvent('start', panelUri);
            });
            queryRunner.eventEmitter.on('resultSet', (resultSet) => {
                this._panels.get(uri).proxy.sendEvent('resultSet', resultSet);
            });
            queryRunner.eventEmitter.on('batchStart', (batch) => {
                // Build a message for the selection and send the message
                // from the webview
                let message = {
                    message: LocalizedConstants.runQueryBatchStartMessage,
                    selection: batch.selection,
                    isError: false,
                    time: new Date().toLocaleTimeString(),
                    link: {
                        text: Utils.formatString(LocalizedConstants.runQueryBatchStartLine, batch.selection.startLine + 1)
                    }
                };
                this._panels.get(uri).proxy.sendEvent('message', message);
            });
            queryRunner.eventEmitter.on('message', (message) => {
                this._panels.get(uri).proxy.sendEvent('message', message);
            });
            queryRunner.eventEmitter.on('complete', (totalMilliseconds, hasError, isRefresh) => {
                if (!isRefresh) {
                    // only update query history with new queries
                    this._vscodeWrapper.executeCommand(Constants.cmdRefreshQueryHistory, uri, hasError);
                }
                this._panels.get(uri).proxy.sendEvent('complete', totalMilliseconds);
            });
            this._queryResultsMap.set(uri, new QueryRunnerState(queryRunner));
        }
        return queryRunner;
    }
    cancelQuery(input) {
        let self = this;
        let queryRunner;
        if (typeof input === 'string') {
            if (this._queryResultsMap.has(input)) {
                // Option 1: The string is a results URI (the results tab has focus)
                queryRunner = this._queryResultsMap.get(input).queryRunner;
            }
        }
        else {
            queryRunner = input;
        }
        if (queryRunner === undefined || !queryRunner.isExecutingQuery) {
            self._vscodeWrapper.showInformationMessage(LocalizedConstants.msgCancelQueryNotRunning);
            return;
        }
        // Switch the spinner to canceling, which will be reset when the query execute sends back its completed event
        this._statusView.cancelingQuery(queryRunner.uri);
        // Cancel the query
        queryRunner.cancel().then(success => undefined, error => {
            // On error, show error message
            self._vscodeWrapper.showErrorMessage(Utils.formatString(LocalizedConstants.msgCancelQueryFailed, error.message));
        });
    }
    /**
     * Executed from the MainController when an untitled text document was saved to the disk. If
     * any queries were executed from the untitled document, the queryrunner will be remapped to
     * a new resuls uri based on the uri of the newly saved file.
     * @param untitledUri   The URI of the untitled file
     * @param savedUri  The URI of the file after it was saved
     */
    onUntitledFileSaved(untitledUri, savedUri) {
        // If we don't have any query runners mapped to this uri, don't do anything
        let untitledResultsUri = decodeURIComponent(untitledUri);
        if (!this._queryResultsMap.has(untitledResultsUri)) {
            return;
        }
        // NOTE: We don't need to remap the query in the service because the queryrunner still has
        // the old uri. As long as we make requests to the service against that uri, we'll be good.
        // Remap the query runner in the map
        let savedResultUri = decodeURIComponent(savedUri);
        this._queryResultsMap.set(savedResultUri, this._queryResultsMap.get(untitledResultsUri));
        this._queryResultsMap.delete(untitledResultsUri);
    }
    /**
     * Executed from the MainController when a text document (that already exists on disk) was
     * closed. If the query is in progress, it will be canceled. If there is a query at all,
     * the query will be disposed.
     * @param doc   The document that was closed
     */
    onDidCloseTextDocument(doc) {
        for (let [key, value] of this._queryResultsMap.entries()) {
            // closes text document related to a results window we are holding
            if (doc.uri.toString(true) === value.queryRunner.uri) {
                value.flaggedForDeletion = true;
            }
            // "closes" a results window we are holding
            if (doc.uri.toString(true) === key) {
                value.timeout = this.setRunnerDeletionTimeout(key);
            }
        }
    }
    /**
     * Ready event sent by the angular app
     * @param uri
     */
    sendReadyEvent(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const panelController = this._panels.get(uri);
            const queryRunner = this.getQueryRunner(uri);
            // in case of a tab switch
            // and if it has rendered before
            if (panelController.isActive !== undefined &&
                queryRunner.hasCompleted &&
                panelController.rendered) {
                return queryRunner.refreshQueryTab(uri);
            }
            else {
                // first ready event
                panelController.rendered = true;
            }
            return false;
        });
    }
    setRunnerDeletionTimeout(uri) {
        const self = this;
        return setTimeout(() => {
            let queryRunnerState = self._queryResultsMap.get(uri);
            if (queryRunnerState.flaggedForDeletion) {
                self._queryResultsMap.delete(uri);
                if (queryRunnerState.queryRunner.isExecutingQuery) {
                    // We need to cancel it, which will dispose it
                    this.cancelQuery(queryRunnerState.queryRunner);
                }
                else {
                    // We need to explicitly dispose the query
                    queryRunnerState.queryRunner.dispose();
                }
            }
            else {
                queryRunnerState.timeout = this.setRunnerDeletionTimeout(uri);
            }
        }, deletionTimeoutTime);
    }
    /**
     * Open a xml/json link - Opens the content in a new editor pane
     */
    openLink(content, columnName, linkType) {
        const self = this;
        if (linkType === 'xml') {
            try {
                content = pd.xml(content);
            }
            catch (e) {
                // If Xml fails to parse, fall back on original Xml content
            }
        }
        else if (linkType === 'json') {
            let jsonContent = undefined;
            try {
                jsonContent = JSON.parse(content);
            }
            catch (e) {
                // If Json fails to parse, fall back on original Json content
            }
            if (jsonContent) {
                // If Json content was valid and parsed, pretty print content to a string
                content = JSON.stringify(jsonContent, undefined, 4);
            }
        }
        vscode.workspace.openTextDocument({ language: linkType }).then((doc) => {
            vscode.window.showTextDocument(doc, 2, false).then(editor => {
                editor.edit(edit => {
                    edit.insert(new vscode.Position(0, 0), content);
                }).then(result => {
                    if (!result) {
                        self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgCannotOpenContent);
                    }
                });
            }, (error) => {
                self._vscodeWrapper.showErrorMessage(error);
            });
        }, (error) => {
            self._vscodeWrapper.showErrorMessage(error);
        });
    }
    /**
     * Return the query for a file uri
     */
    getQueryRunner(uri) {
        if (this._queryResultsMap.has(uri)) {
            return this._queryResultsMap.get(uri).queryRunner;
        }
        else {
            return undefined;
        }
    }
    /**
     * Switches SQLCMD Mode to on/off
     * @param queryUri Uri of the query
     */
    toggleSqlCmd(uri) {
        const queryRunner = this.getQueryRunner(uri);
        if (queryRunner) {
            return queryRunner.toggleSqlCmd().then((result) => {
                return result;
            });
        }
        return Promise.resolve(false);
    }
    // PRIVATE HELPERS /////////////////////////////////////////////////////
    /**
     * Returns which column should be used for a new result pane
     * @return ViewColumn to be used
     * public for testing purposes
     */
    newResultPaneViewColumn(queryUri) {
        // Find configuration options
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let splitPaneSelection = config[Constants.configSplitPaneSelection];
        let viewColumn;
        switch (splitPaneSelection) {
            case 'current':
                viewColumn = this._vscodeWrapper.activeTextEditor.viewColumn;
                break;
            case 'end':
                viewColumn = vscode.ViewColumn.Three;
                break;
            // default case where splitPaneSelection is next or anything else
            default:
                if (this._vscodeWrapper.activeTextEditor.viewColumn === vscode.ViewColumn.One) {
                    viewColumn = vscode.ViewColumn.Two;
                }
                else {
                    viewColumn = vscode.ViewColumn.Three;
                }
        }
        return viewColumn;
    }
    set setVscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    get getResultsMap() {
        return this._queryResultsMap;
    }
    set setResultsMap(setMap) {
        this._queryResultsMap = setMap;
    }
}
exports.SqlOutputContentProvider = SqlOutputContentProvider;

//# sourceMappingURL=sqlOutputContentProvider.js.map
