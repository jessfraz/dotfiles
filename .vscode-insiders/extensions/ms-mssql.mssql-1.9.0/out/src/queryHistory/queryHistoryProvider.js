"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
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
const path = require("path");
const os = require("os");
const Utils = require("../models/utils");
const queryHistoryNode_1 = require("./queryHistoryNode");
const Constants = require("../constants/constants");
const protocol_1 = require("../protocol");
const queryHistoryUI_1 = require("../views/queryHistoryUI");
class QueryHistoryProvider {
    constructor(_connectionManager, _outputContentProvider, _vscodeWrapper, _untitledSqlDocumentService, _statusView, _prompter) {
        this._connectionManager = _connectionManager;
        this._outputContentProvider = _outputContentProvider;
        this._vscodeWrapper = _vscodeWrapper;
        this._untitledSqlDocumentService = _untitledSqlDocumentService;
        this._statusView = _statusView;
        this._prompter = _prompter;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._queryHistoryNodes = [new queryHistoryNode_1.EmptyHistoryNode()];
        const config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        this._queryHistoryLimit = config.get(Constants.configQueryHistoryLimit);
        this._queryHistoryUI = new queryHistoryUI_1.QueryHistoryUI(this._prompter, this._vscodeWrapper);
    }
    clearAll() {
        this._queryHistoryNodes = [new queryHistoryNode_1.EmptyHistoryNode()];
        this._onDidChangeTreeData.fire();
    }
    refresh(ownerUri, timeStamp, hasError) {
        const timeStampString = timeStamp.toLocaleString();
        const historyNodeLabel = this.createHistoryNodeLabel(ownerUri);
        const tooltip = this.createHistoryNodeTooltip(ownerUri, timeStampString);
        const queryString = this.getQueryString(ownerUri);
        const connectionLabel = this.getConnectionLabel(ownerUri);
        const node = new queryHistoryNode_1.QueryHistoryNode(historyNodeLabel, tooltip, queryString, ownerUri, timeStamp, connectionLabel, !hasError);
        if (this._queryHistoryNodes.length === 1) {
            if (this._queryHistoryNodes[0] instanceof queryHistoryNode_1.EmptyHistoryNode) {
                this._queryHistoryNodes = [];
            }
        }
        this._queryHistoryNodes.push(node);
        // sort the query history sorted by timestamp
        this._queryHistoryNodes.sort((a, b) => {
            return b.timeStamp.getTime() -
                a.timeStamp.getTime();
        });
        // Push out the first listing if it crosses limit to maintain
        // an LRU order
        if (this._queryHistoryNodes.length > this._queryHistoryLimit) {
            this._queryHistoryNodes.shift();
        }
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(node) {
        return node;
    }
    getChildren(element) {
        if (this._queryHistoryNodes.length === 0) {
            this._queryHistoryNodes.push(new queryHistoryNode_1.EmptyHistoryNode());
        }
        return this._queryHistoryNodes;
    }
    /**
     * Shows the Query History List on the command palette
     */
    showQueryHistoryCommandPalette() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = this._queryHistoryNodes.map(node => this._queryHistoryUI.convertToQuickPickItem(node));
            let queryHistoryQuickPickItem = yield this._queryHistoryUI.showQueryHistoryCommandPalette(options);
            if (queryHistoryQuickPickItem) {
                yield this.openQueryHistoryEntry(queryHistoryQuickPickItem.node, queryHistoryQuickPickItem.action ===
                    queryHistoryUI_1.QueryHistoryAction.RunQueryHistoryAction);
            }
            return undefined;
        });
    }
    /**
     * Starts the history capture by changing the setting
     * and changes context for menu actions
     */
    startQueryHistoryCapture() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._vscodeWrapper.setConfiguration(Constants.extensionConfigSectionName, Constants.configEnableQueryHistoryCapture, true);
        });
    }
    /**
     * Pauses the history capture by changing the setting
     * and changes context for menu actions
     */
    pauseQueryHistoryCapture() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._vscodeWrapper.setConfiguration(Constants.extensionConfigSectionName, Constants.configEnableQueryHistoryCapture, false);
        });
    }
    /**
     * Opens a query history listing in a new query window
     */
    openQueryHistoryEntry(node, isExecute = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = yield this._untitledSqlDocumentService.newQuery(node.queryString);
            let uri = editor.document.uri.toString(true);
            let title = path.basename(editor.document.fileName);
            const queryUriPromise = new protocol_1.Deferred();
            let credentials = this._connectionManager.getConnectionInfo(node.ownerUri).credentials;
            yield this._connectionManager.connect(uri, credentials, queryUriPromise);
            yield queryUriPromise;
            this._statusView.languageFlavorChanged(uri, Constants.mssqlProviderName);
            this._statusView.sqlCmdModeChanged(uri, false);
            if (isExecute) {
                const queryPromise = new protocol_1.Deferred();
                yield this._outputContentProvider.runQuery(this._statusView, uri, undefined, title, queryPromise);
                yield queryPromise;
                yield this._connectionManager.connectionStore.removeRecentlyUsed(credentials);
            }
        });
    }
    /**
     * Deletes a query history entry for a URI
     */
    deleteQueryHistoryEntry(node) {
        let index = this._queryHistoryNodes.findIndex(n => {
            let historyNode = n;
            return historyNode === node;
        });
        this._queryHistoryNodes.splice(index, 1);
        this._onDidChangeTreeData.fire();
    }
    /**
     * Getters
     */
    get queryHistoryNodes() {
        return this._queryHistoryNodes;
    }
    /**
     * Creates the node label for a query history node
     */
    createHistoryNodeLabel(ownerUri) {
        const queryString = Utils.limitStringSize(this.getQueryString(ownerUri)).trim();
        const connectionLabel = Utils.limitStringSize(this.getConnectionLabel(ownerUri)).trim();
        return `${queryString} : ${connectionLabel}`;
    }
    /**
     * Gets the selected text for the corresponding query history listing
     */
    getQueryString(ownerUri) {
        const queryRunner = this._outputContentProvider.getQueryRunner(ownerUri);
        return queryRunner.getQueryString(ownerUri);
    }
    /**
     * Creates a connection label based on credentials
     */
    getConnectionLabel(ownerUri) {
        const connInfo = this._connectionManager.getConnectionInfo(ownerUri);
        const credentials = connInfo.credentials;
        let connString = `(${credentials.server}|${credentials.database})`;
        if (credentials.authenticationType === Constants.sqlAuthentication) {
            connString = `${connString} : ${credentials.user}`;
        }
        return connString;
    }
    /**
     * Creates a detailed tool tip when a node is hovered
     */
    createHistoryNodeTooltip(ownerUri, timeStamp) {
        const queryString = this.getQueryString(ownerUri);
        const connectionLabel = this.getConnectionLabel(ownerUri);
        return `${connectionLabel}${os.EOL}${os.EOL}${timeStamp}${os.EOL}${os.EOL}${queryString}`;
    }
}
exports.QueryHistoryProvider = QueryHistoryProvider;

//# sourceMappingURL=queryHistoryProvider.js.map
