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
const events = require("events");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const Utils = require("../models/utils");
const sqlOutputContentProvider_1 = require("../models/sqlOutputContentProvider");
const languageService_1 = require("../models/contracts/languageService");
const statusView_1 = require("../views/statusView");
const connectionManager_1 = require("./connectionManager");
const serviceclient_1 = require("../languageservice/serviceclient");
const adapter_1 = require("../prompts/adapter");
const vscodeWrapper_1 = require("./vscodeWrapper");
const untitledSqlDocumentService_1 = require("./untitledSqlDocumentService");
const path = require("path");
const fs = require("fs");
const objectExplorerProvider_1 = require("../objectExplorer/objectExplorerProvider");
const scriptingService_1 = require("../scripting/scriptingService");
const protocol_1 = require("../protocol");
const objectExplorerUtils_1 = require("../objectExplorer/objectExplorerUtils");
const scriptingRequest_1 = require("../models/contracts/scripting/scriptingRequest");
const queryHistoryProvider_1 = require("../queryHistory/queryHistoryProvider");
/**
 * The main controller class that initializes the extension
 */
class MainController {
    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context, connectionManager, vscodeWrapper) {
        this._event = new events.EventEmitter();
        this._initialized = false;
        this._queryHistoryRegistered = false;
        this._context = context;
        if (connectionManager) {
            this._connectionMgr = connectionManager;
        }
        this._vscodeWrapper = vscodeWrapper || new vscodeWrapper_1.default();
        this._untitledSqlDocumentService = new untitledSqlDocumentService_1.default(this._vscodeWrapper);
    }
    /**
     * Helper method to setup command registrations
     */
    registerCommand(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => self._event.emit(command)));
    }
    /**
     * Helper method to setup command registrations with arguments
     */
    registerCommandWithArgs(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, (args) => {
            self._event.emit(command, args);
        }));
    }
    /**
     * Disposes the controller
     */
    dispose() {
        this.deactivate();
    }
    /**
     * Deactivates the extension
     */
    deactivate() {
        Utils.logDebug('de-activated.');
        this.onDisconnect();
        this._statusview.dispose();
    }
    /**
     * Initializes the extension
     */
    activate() {
        const self = this;
        // initialize the language client then register the commands
        return this.initialize().then((didInitialize) => {
            if (didInitialize) {
                // register VS Code commands
                this.registerCommand(Constants.cmdConnect);
                this._event.on(Constants.cmdConnect, () => { self.runAndLogErrors(self.onNewConnection()); });
                this.registerCommand(Constants.cmdDisconnect);
                this._event.on(Constants.cmdDisconnect, () => { self.runAndLogErrors(self.onDisconnect()); });
                this.registerCommand(Constants.cmdRunQuery);
                this._event.on(Constants.cmdRunQuery, () => { self.onRunQuery(); });
                this.registerCommand(Constants.cmdManageConnectionProfiles);
                this._event.on(Constants.cmdRunCurrentStatement, () => { self.onRunCurrentStatement(); });
                this.registerCommand(Constants.cmdRunCurrentStatement);
                this._event.on(Constants.cmdManageConnectionProfiles, () => __awaiter(this, void 0, void 0, function* () { yield self.onManageProfiles(); }));
                this.registerCommand(Constants.cmdChooseDatabase);
                this._event.on(Constants.cmdChooseDatabase, () => { self.runAndLogErrors(self.onChooseDatabase()); });
                this.registerCommand(Constants.cmdChooseLanguageFlavor);
                this._event.on(Constants.cmdChooseLanguageFlavor, () => { self.runAndLogErrors(self.onChooseLanguageFlavor()); });
                this.registerCommand(Constants.cmdCancelQuery);
                this._event.on(Constants.cmdCancelQuery, () => { self.onCancelQuery(); });
                this.registerCommand(Constants.cmdShowGettingStarted);
                this._event.on(Constants.cmdShowGettingStarted, () => { self.launchGettingStartedPage(); });
                this.registerCommand(Constants.cmdNewQuery);
                this._event.on(Constants.cmdNewQuery, () => self.runAndLogErrors(self.onNewQuery()));
                this.registerCommand(Constants.cmdRebuildIntelliSenseCache);
                this._event.on(Constants.cmdRebuildIntelliSenseCache, () => { self.onRebuildIntelliSense(); });
                this.registerCommandWithArgs(Constants.cmdLoadCompletionExtension);
                this._event.on(Constants.cmdLoadCompletionExtension, (params) => { self.onLoadCompletionExtension(params); });
                this.registerCommand(Constants.cmdToggleSqlCmd);
                this._event.on(Constants.cmdToggleSqlCmd, () => __awaiter(this, void 0, void 0, function* () { yield self.onToggleSqlCmd(); }));
                this.initializeObjectExplorer();
                this.initializeQueryHistory();
                // Add handlers for VS Code generated commands
                this._vscodeWrapper.onDidCloseTextDocument((params) => __awaiter(this, void 0, void 0, function* () { return yield this.onDidCloseTextDocument(params); }));
                this._vscodeWrapper.onDidOpenTextDocument(params => this.onDidOpenTextDocument(params));
                this._vscodeWrapper.onDidSaveTextDocument(params => this.onDidSaveTextDocument(params));
                this._vscodeWrapper.onDidChangeConfiguration(params => this.onDidChangeConfiguration(params));
                return true;
            }
        });
    }
    /**
     * Helper to script a node based on the script operation
     */
    scriptNode(node, operation, executeScript = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
            let connectionCreds = Object.assign({}, node.connectionCredentials);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
            // if not connected or different database
            if (!this.connectionManager.isConnected(nodeUri) ||
                connectionCreds.database !== databaseName) {
                // make a new connection
                connectionCreds.database = databaseName;
                if (!this.connectionManager.isConnecting(nodeUri)) {
                    const promise = new protocol_1.Deferred();
                    yield this.connectionManager.connect(nodeUri, connectionCreds, promise);
                    yield promise;
                }
            }
            const selectStatement = yield this._scriptingService.script(node, nodeUri, operation);
            const editor = yield this._untitledSqlDocumentService.newQuery(selectStatement);
            let uri = editor.document.uri.toString(true);
            let scriptingObject = this._scriptingService.getObjectFromNode(node);
            let title = `${scriptingObject.schema}.${scriptingObject.name}`;
            const queryUriPromise = new protocol_1.Deferred();
            yield this.connectionManager.connect(uri, connectionCreds, queryUriPromise);
            yield queryUriPromise;
            this._statusview.languageFlavorChanged(uri, Constants.mssqlProviderName);
            this._statusview.sqlCmdModeChanged(uri, false);
            if (executeScript) {
                const queryPromise = new protocol_1.Deferred();
                yield this._outputContentProvider.runQuery(this._statusview, uri, undefined, title, queryPromise);
                yield queryPromise;
                yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
            }
        });
    }
    /**
     * Returns a flag indicating if the extension is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Initializes the extension
     */
    initialize() {
        const self = this;
        // initialize language service client
        return new Promise((resolve, reject) => {
            serviceclient_1.default.instance.initialize(self._context).then(serverResult => {
                // Init status bar
                self._statusview = new statusView_1.default(self._vscodeWrapper);
                // Init CodeAdapter for use when user response to questions is needed
                self._prompter = new adapter_1.default(self._vscodeWrapper);
                // Init content provider for results pane
                self._outputContentProvider = new sqlOutputContentProvider_1.SqlOutputContentProvider(self._context, self._statusview, self._vscodeWrapper);
                // Init connection manager and connection MRU
                self._connectionMgr = new connectionManager_1.default(self._context, self._statusview, self._prompter);
                self.showReleaseNotesPrompt();
                // Handle case where SQL file is the 1st opened document
                const activeTextEditor = this._vscodeWrapper.activeTextEditor;
                if (activeTextEditor && this._vscodeWrapper.isEditingSqlFile) {
                    this.onDidOpenTextDocument(activeTextEditor.document);
                }
                Utils.logDebug('activated.');
                self._initialized = true;
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        });
    }
    /**
     * Helper function to toggle SQLCMD mode
     */
    toggleSqlCmdMode(isSqlCmd) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._outputContentProvider.toggleSqlCmd(this._vscodeWrapper.activeTextEditorUri).then(() => __awaiter(this, void 0, void 0, function* () {
                yield this._connectionMgr.onChooseLanguageFlavor(true, !isSqlCmd);
                return Promise.resolve(true);
            }));
        });
    }
    /**
     * Creates a new Object Explorer session
     */
    createObjectExplorerSession(connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            let createSessionPromise = new protocol_1.Deferred();
            const sessionId = yield this._objectExplorerProvider.createSession(createSessionPromise, connectionCredentials);
            if (sessionId) {
                const newNode = yield createSessionPromise;
                if (newNode) {
                    this._objectExplorerProvider.refresh(undefined);
                }
            }
        });
    }
    /**
     * Initializes the Object Explorer commands
     */
    initializeObjectExplorer() {
        const self = this;
        // Register the object explorer tree provider
        this._objectExplorerProvider = new objectExplorerProvider_1.ObjectExplorerProvider(this._connectionMgr);
        const treeView = vscode.window.createTreeView('objectExplorer', {
            treeDataProvider: this._objectExplorerProvider,
            canSelectMany: false
        });
        this._context.subscriptions.push(treeView);
        // Sets the correct current node on any node selection
        this._context.subscriptions.push(treeView.onDidChangeSelection((e) => {
            const selections = e.selection;
            if (selections && selections.length > 0) {
                self._objectExplorerProvider.currentNode = selections[0];
            }
        }));
        // Add Object Explorer Node
        this.registerCommand(Constants.cmdAddObjectExplorer);
        this._event.on(Constants.cmdAddObjectExplorer, () => __awaiter(this, void 0, void 0, function* () {
            if (!self._objectExplorerProvider.objectExplorerExists) {
                self._objectExplorerProvider.objectExplorerExists = true;
            }
            yield self.createObjectExplorerSession();
        }));
        // Object Explorer New Query
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNewQuery, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            const connectionCredentials = Object.assign({}, treeNodeInfo.connectionCredentials);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(treeNodeInfo);
            if (databaseName !== connectionCredentials.database &&
                databaseName !== LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = databaseName;
            }
            else if (databaseName === LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = '';
            }
            treeNodeInfo.connectionCredentials = connectionCredentials;
            yield self.onNewQuery(treeNodeInfo);
        })));
        // Remove Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRemoveObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeObjectExplorerNode(treeNodeInfo);
            let profile = treeNodeInfo.connectionCredentials;
            yield this._connectionMgr.connectionStore.removeProfile(profile, false);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        // Refresh Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.refreshNode(treeNodeInfo);
        })));
        // Sign In into Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNodeSignIn, (node) => __awaiter(this, void 0, void 0, function* () {
            let profile = node.parentNode.connectionCredentials;
            profile = yield self.connectionManager.connectionUI.promptForRetryCreateProfile(profile);
            if (profile) {
                node.parentNode.connectionCredentials = profile;
                self._objectExplorerProvider.updateNode(node.parentNode);
                self._objectExplorerProvider.signInNodeServer(node.parentNode);
                return self._objectExplorerProvider.refresh(undefined);
            }
        })));
        // Connect to Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdConnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            yield self.createObjectExplorerSession(node.parentNode.connectionCredentials);
        })));
        // Disconnect Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDisconnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeObjectExplorerNode(node, true);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        // Initiate the scripting service
        this._scriptingService = new scriptingService_1.ScriptingService(this._connectionMgr);
        // Script as Select
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptSelect, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Select, true);
        })));
        // Script as Create
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptCreate, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Create); })));
        // Script as Drop
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptDelete, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Delete); })));
        // Script as Execute
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptExecute, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Execute); })));
        // Script as Alter
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptAlter, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Alter); })));
        // Copy object name command
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCopyObjectName, () => __awaiter(this, void 0, void 0, function* () {
            let node = this._objectExplorerProvider.currentNode;
            // Folder node
            if (node.contextValue === Constants.folderLabel) {
                return;
            }
            else if (node.contextValue === Constants.serverLabel ||
                node.contextValue === Constants.disconnectedServerLabel) {
                yield this._vscodeWrapper.clipboardWriteText(node.label);
            }
            else {
                let scriptingObject = this._scriptingService.getObjectFromNode(node);
                const escapedName = Utils.escapeClosingBrackets(scriptingObject.name);
                if (scriptingObject.schema) {
                    let database = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
                    const databaseName = Utils.escapeClosingBrackets(database);
                    const escapedSchema = Utils.escapeClosingBrackets(scriptingObject.schema);
                    yield this._vscodeWrapper.clipboardWriteText(`[${databaseName}].${escapedSchema}.[${escapedName}]`);
                }
                else {
                    yield this._vscodeWrapper.clipboardWriteText(`[${escapedName}]`);
                }
            }
        })));
    }
    /**
     * Initializes the Query History commands
     */
    initializeQueryHistory() {
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let queryHistoryFeature = config.get(Constants.configEnableQueryHistoryFeature);
        // If the query history feature is enabled
        if (queryHistoryFeature && !this._queryHistoryRegistered) {
            // Register the query history tree provider
            this._queryHistoryProvider = new queryHistoryProvider_1.QueryHistoryProvider(this._connectionMgr, this._outputContentProvider, this._vscodeWrapper, this._untitledSqlDocumentService, this._statusview, this._prompter);
            this._context.subscriptions.push(vscode.window.registerTreeDataProvider('queryHistory', this._queryHistoryProvider));
            // Command to refresh Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshQueryHistory, (ownerUri, hasError) => {
                config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
                let queryHistoryFeatureEnabled = config.get(Constants.configEnableQueryHistoryFeature);
                let queryHistoryCaptureEnabled = config.get(Constants.configEnableQueryHistoryCapture);
                if (queryHistoryFeatureEnabled && queryHistoryCaptureEnabled) {
                    const timeStamp = new Date();
                    this._queryHistoryProvider.refresh(ownerUri, timeStamp, hasError);
                }
            }));
            // Command to enable clear all entries in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdClearAllQueryHistory, () => {
                this._queryHistoryProvider.clearAll();
            }));
            // Command to enable delete an entry in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDeleteQueryHistory, (node) => {
                this._queryHistoryProvider.deleteQueryHistoryEntry(node);
            }));
            // Command to enable open a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdOpenQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node);
            })));
            // Command to enable run a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRunQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node, true);
            })));
            // Command to start the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdStartQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.startQueryHistoryCapture();
            })));
            // Command to pause the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdPauseQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.pauseQueryHistoryCapture();
            })));
            // Command to open the query history experience in the command palette
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCommandPaletteQueryHistory, () => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.showQueryHistoryCommandPalette();
            })));
            this._queryHistoryRegistered = true;
        }
    }
    /**
     * Handles the command to enable SQLCMD mode
     */
    onToggleSqlCmd() {
        return __awaiter(this, void 0, void 0, function* () {
            let isSqlCmd;
            const uri = this._vscodeWrapper.activeTextEditorUri;
            const queryRunner = this._outputContentProvider.getQueryRunner(uri);
            const promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                // if a query runner exists, use it
                if (queryRunner) {
                    isSqlCmd = queryRunner.isSqlCmd;
                    const result = yield this.toggleSqlCmdMode(!isSqlCmd);
                    resolve(result);
                }
                else {
                    // otherwise create a new query runner
                    isSqlCmd = false;
                    const editor = this._vscodeWrapper.activeTextEditor;
                    const title = path.basename(editor.document.fileName);
                    this._outputContentProvider.createQueryRunner(this._statusview, uri, title);
                    const result = yield this.toggleSqlCmdMode(!isSqlCmd);
                    resolve(result);
                }
                return this._statusview.sqlCmdModeChanged(this._vscodeWrapper.activeTextEditorUri, !isSqlCmd);
            }));
            return promise;
        });
    }
    /**
     * Handles the command to cancel queries
     */
    onCancelQuery() {
        if (!this.canRunCommand() || !this.validateTextDocumentHasFocus()) {
            return;
        }
        try {
            let uri = this._vscodeWrapper.activeTextEditorUri;
            this._outputContentProvider.cancelQuery(uri);
        }
        catch (err) {
            console.warn(`Unexpected error cancelling query : ${err}`);
        }
    }
    /**
     * Choose a new database from the current server
     */
    onChooseDatabase() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            return this._connectionMgr.onChooseDatabase();
        }
        return Promise.resolve(false);
    }
    /**
     * Choose a language flavor for the SQL document. Should be either "MSSQL" or "Other"
     * to indicate that intellisense and other services should not be provided
     */
    onChooseLanguageFlavor() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._connectionMgr.onChooseLanguageFlavor();
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
        return Promise.resolve(false);
    }
    /**
     * Close active connection, if any
     */
    onDisconnect() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            let fileUri = this._vscodeWrapper.activeTextEditorUri;
            let queryRunner = this._outputContentProvider.getQueryRunner(fileUri);
            if (queryRunner && queryRunner.isExecutingQuery) {
                this._outputContentProvider.cancelQuery(fileUri);
            }
            return this._connectionMgr.onDisconnect();
        }
        return Promise.resolve(false);
    }
    /**
     * Manage connection profiles (create, edit, remove).
     * Public for testing purposes
     */
    onManageProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                yield this._connectionMgr.onManageProfiles();
                return;
            }
        });
    }
    /**
     * Let users pick from a list of connections
     */
    onNewConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                let credentials = yield this._connectionMgr.onNewConnection();
                if (credentials) {
                    yield this.createObjectExplorerSession(credentials);
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Clear and rebuild the IntelliSense cache
     */
    onRebuildIntelliSense() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._statusview.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
                serviceclient_1.default.instance.sendNotification(languageService_1.RebuildIntelliSenseNotification.type, {
                    ownerUri: fileUri
                });
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
    }
    /**
     * Send completion extension load request to language service
     */
    onLoadCompletionExtension(params) {
        serviceclient_1.default.instance.sendRequest(languageService_1.CompletionExtLoadRequest.type, params);
    }
    /**
     * execute the SQL statement for the current cursor position
     */
    onRunCurrentStatement(callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand()) {
                    return;
                }
                if (!self.canRunV2Command()) {
                    // Notify the user that this is not supported on this version
                    this._vscodeWrapper.showErrorMessage(LocalizedConstants.macSierraRequiredErrorMessage);
                    return;
                }
                if (!self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (self.isRetryRequiredBeforeQuery(self.onRunCurrentStatement)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                let title = path.basename(editor.document.fileName);
                // return early if the document does contain any text
                if (editor.document.getText(undefined).trim().length === 0) {
                    return;
                }
                // only the start line and column are used to determine the current statement
                let querySelection = {
                    startLine: editor.selection.start.line,
                    startColumn: editor.selection.start.character,
                    endLine: 0,
                    endColumn: 0
                };
                yield self._outputContentProvider.runCurrentStatement(self._statusview, uri, querySelection, title);
            }
            catch (err) {
                console.warn(`Unexpected error running current statement : ${err}`);
            }
        });
    }
    /**
     * get the T-SQL query from the editor, run it and show output
     */
    onRunQuery(callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand() || !self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (self.isRetryRequiredBeforeQuery(self.onRunQuery)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                // create new connection
                if (!self.connectionManager.isConnected(uri)) {
                    yield self.onNewConnection();
                }
                let title = path.basename(editor.document.fileName);
                let querySelection;
                // Calculate the selection if we have a selection, otherwise we'll treat null as
                // the entire document's selection
                if (!editor.selection.isEmpty) {
                    let selection = editor.selection;
                    querySelection = {
                        startLine: selection.start.line,
                        startColumn: selection.start.character,
                        endLine: selection.end.line,
                        endColumn: selection.end.character
                    };
                }
                // Trim down the selection. If it is empty after selecting, then we don't execute
                let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
                if (editor.document.getText(selectionToTrim).trim().length === 0) {
                    return;
                }
                yield self._outputContentProvider.runQuery(self._statusview, uri, querySelection, title);
            }
            catch (err) {
                console.warn(`Unexpected error running query : ${err}`);
            }
        });
    }
    /**
     * Check if the state is ready to execute a query and retry
     * the query execution method if needed
     */
    isRetryRequiredBeforeQuery(retryMethod) {
        let self = this;
        if (!self._vscodeWrapper.isEditingSqlFile) {
            // Prompt the user to change the language mode to SQL before running a query
            self._connectionMgr.connectionUI.promptToChangeLanguageMode().then(result => {
                if (result) {
                    retryMethod(self);
                }
            }).catch(err => {
                self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            });
            return true;
        }
        else if (!self._connectionMgr.isConnected(self._vscodeWrapper.activeTextEditorUri)) {
            // If we are disconnected, prompt the user to choose a connection before executing
            self.onNewConnection().then(result => {
                if (result) {
                    retryMethod(self);
                }
            }).catch(err => {
                self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            });
            return true;
        }
        else {
            // we don't need to do anything to configure environment before running query
            return false;
        }
    }
    /**
     * Executes a callback and logs any errors raised
     */
    runAndLogErrors(promise) {
        let self = this;
        return promise.catch(err => {
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            return undefined;
        });
    }
    /**
     * Access the connection manager for testing
     */
    get connectionManager() {
        return this._connectionMgr;
    }
    set connectionManager(connectionManager) {
        this._connectionMgr = connectionManager;
    }
    set untitledSqlDocumentService(untitledSqlDocumentService) {
        this._untitledSqlDocumentService = untitledSqlDocumentService;
    }
    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    canRunCommand() {
        if (this._connectionMgr === undefined) {
            Utils.showErrorMsg(LocalizedConstants.extensionNotInitializedError);
            return false;
        }
        return true;
    }
    /**
     * Return whether or not some text document currently has focus, and display an error message if not
     */
    validateTextDocumentHasFocus() {
        if (this._vscodeWrapper.activeTextEditorUri === undefined) {
            Utils.showErrorMsg(LocalizedConstants.noActiveEditorMsg);
            return false;
        }
        return true;
    }
    /**
     * Verifies the tools service version is high enough to support certain commands
     */
    canRunV2Command() {
        let version = serviceclient_1.default.instance.getServiceVersion();
        return version > 1;
    }
    /**
     * Prompt the user to view release notes if this is new extension install
     */
    showReleaseNotesPrompt() {
        let self = this;
        if (!this.doesExtensionLaunchedFileExist()) {
            // ask the user to view a scenario document
            let confirmText = 'View Now';
            this._vscodeWrapper.showInformationMessage('View mssql for Visual Studio Code release notes?', confirmText)
                .then((choice) => {
                if (choice === confirmText) {
                    self.launchReleaseNotesPage();
                }
            });
        }
    }
    /**
     * Shows the release notes page in the preview browser
     */
    launchReleaseNotesPage() {
        vscode.env.openExternal(vscode.Uri.parse(Constants.changelogLink));
    }
    /**
     * Shows the Getting Started page in the preview browser
     */
    launchGettingStartedPage() {
        vscode.env.openExternal(vscode.Uri.parse(Constants.gettingStartedGuideLink));
    }
    /**
     * Opens a new query and creates new connection
     */
    onNewQuery(node, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                // from the object explorer context menu
                const editor = yield this._untitledSqlDocumentService.newQuery(content);
                const uri = editor.document.uri.toString(true);
                if (node) {
                    // connect to the node if the command came from the context
                    const connectionCreds = node.connectionCredentials;
                    // if the node isn't connected
                    if (!node.sessionId) {
                        // connect it first
                        yield this.createObjectExplorerSession(node.connectionCredentials);
                    }
                    this._statusview.languageFlavorChanged(uri, Constants.mssqlProviderName);
                    // connection string based credential
                    if (connectionCreds.connectionString) {
                        if (connectionCreds.savePassword) {
                            // look up connection string
                            let connectionString = yield this._connectionMgr.connectionStore.lookupPassword(connectionCreds, true);
                            connectionCreds.connectionString = connectionString;
                        }
                    }
                    yield this.connectionManager.connect(uri, connectionCreds);
                    this._statusview.sqlCmdModeChanged(uri, false);
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
                    return true;
                }
                else {
                    // new query command
                    const credentials = yield this._connectionMgr.onNewConnection();
                    // initiate a new OE with same connection
                    if (credentials) {
                        yield this.createObjectExplorerSession(credentials);
                    }
                    this._statusview.sqlCmdModeChanged(uri, false);
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Check if the extension launched file exists.
     * This is to detect when we are running in a clean install scenario.
     */
    doesExtensionLaunchedFileExist() {
        // check if file already exists on disk
        let filePath = this._context.asAbsolutePath('extensionlaunched.dat');
        try {
            // this will throw if the file does not exist
            fs.statSync(filePath);
            return true;
        }
        catch (err) {
            try {
                // write out the "first launch" file if it doesn't exist
                fs.writeFile(filePath, 'launched', (err) => {
                    return;
                });
            }
            catch (err) {
                // ignore errors writing first launch file since there isn't really
                // anything we can do to recover in this situation.
            }
            return false;
        }
    }
    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    onDidCloseTextDocument(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connectionMgr === undefined) {
                // Avoid processing events before initialization is complete
                return;
            }
            let closedDocumentUri = doc.uri.toString(true);
            let closedDocumentUriScheme = doc.uri.scheme;
            // Stop timers if they have been started
            if (this._lastSavedTimer) {
                this._lastSavedTimer.end();
            }
            if (this._lastOpenedTimer) {
                this._lastOpenedTimer.end();
            }
            // Determine which event caused this close event
            // If there was a saveTextDoc event just before this closeTextDoc event and it
            // was untitled then we know it was an untitled save
            if (this._lastSavedUri &&
                closedDocumentUriScheme === LocalizedConstants.untitledScheme &&
                this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
                // Untitled file was saved and connection will be transfered
                yield this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastSavedUri);
                // If there was an openTextDoc event just before this closeTextDoc event then we know it was a rename
            }
            else if (this._lastOpenedUri &&
                this._lastOpenedTimer.getDuration() < Constants.renamedOpenTimeThreshold) {
                // File was renamed and connection will be transfered
                yield this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastOpenedUri);
            }
            else {
                // Pass along the close event to the other handlers for a normal closed file
                yield this._connectionMgr.onDidCloseTextDocument(doc);
                this._outputContentProvider.onDidCloseTextDocument(doc);
            }
            // Reset special case timers and events
            this._lastSavedUri = undefined;
            this._lastSavedTimer = undefined;
            this._lastOpenedTimer = undefined;
            this._lastOpenedUri = undefined;
            // Remove diagnostics for the related file
            let diagnostics = serviceclient_1.default.instance.diagnosticCollection;
            if (diagnostics.has(doc.uri)) {
                diagnostics.delete(doc.uri);
            }
        });
    }
    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    onDidOpenTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        this._connectionMgr.onDidOpenTextDocument(doc);
        if (doc && doc.languageId === Constants.languageId) {
            // set encoding to false
            this._statusview.languageFlavorChanged(doc.uri.toString(true), Constants.mssqlProviderName);
        }
        // Setup properties incase of rename
        this._lastOpenedTimer = new Utils.Timer();
        this._lastOpenedTimer.start();
        if (doc && doc.uri) {
            this._lastOpenedUri = doc.uri.toString(true);
        }
    }
    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    onDidSaveTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        // Set encoding to false by giving true as argument
        let savedDocumentUri = doc.uri.toString(true);
        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new Utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
    onChangeQueryHistoryConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let queryHistoryFeatureEnabled = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName)
                .get(Constants.configEnableQueryHistoryFeature);
            if (queryHistoryFeatureEnabled) {
                this.initializeQueryHistory();
            }
        });
    }
    /**
     * Called by VS Code when user settings are changed
     * @param ConfigurationChangeEvent event that is fired when config is changed
     */
    onDidChangeConfiguration(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e.affectsConfiguration(Constants.extensionName)) {
                // Query History settings change
                yield this.onChangeQueryHistoryConfig();
                // Connections change
                let needsRefresh = false;
                // user connections is a super set of object explorer connections
                let userConnections = this._vscodeWrapper.getConfiguration(Constants.extensionName).get(Constants.connectionsArrayName);
                let objectExplorerConnections = this._objectExplorerProvider.rootNodeConnections;
                // if a connection(s) was/were manually removed
                let staleConnections = objectExplorerConnections.filter((oeConn) => {
                    return !userConnections.some((userConn) => Utils.isSameConnection(oeConn, userConn));
                });
                // disconnect that/those connection(s) and then
                // remove its/their credentials from the credential store
                // and MRU
                for (let conn of staleConnections) {
                    let profile = conn;
                    if (this.connectionManager.isActiveConnection(conn)) {
                        const uri = this.connectionManager.getUriForConnection(conn);
                        yield this.connectionManager.disconnect(uri);
                    }
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(profile);
                    if (profile.authenticationType === Constants.sqlAuthentication &&
                        profile.savePassword) {
                        yield this.connectionManager.deleteCredential(profile);
                    }
                }
                // remove them from object explorer
                yield this._objectExplorerProvider.removeConnectionNodes(staleConnections);
                needsRefresh = staleConnections.length > 0;
                // if a connection(s) was/were manually added
                let newConnections = userConnections.filter((userConn) => {
                    return !objectExplorerConnections.some((oeConn) => Utils.isSameConnection(userConn, oeConn));
                });
                for (let conn of newConnections) {
                    // if a connection is not connected
                    // that means it was added manually
                    const newConnectionProfile = conn;
                    const uri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUriFromProfile(newConnectionProfile);
                    if (!this.connectionManager.isActiveConnection(conn) &&
                        !this.connectionManager.isConnecting(uri)) {
                        // add a disconnected node for the connection
                        this._objectExplorerProvider.addDisconnectedNode(conn);
                        needsRefresh = true;
                    }
                }
                // Get rid of all passwords in the settings file
                for (let conn of userConnections) {
                    if (!Utils.isEmpty(conn.password)) {
                        // save the password in the credential store if save password is true
                        yield this.connectionManager.connectionStore.saveProfilePasswordIfNeeded(conn);
                    }
                    conn.password = '';
                }
                this._vscodeWrapper.setConfiguration(Constants.extensionName, Constants.connectionsArrayName, userConnections);
                if (needsRefresh) {
                    this._objectExplorerProvider.refresh(undefined);
                }
            }
        });
    }
}
exports.default = MainController;

//# sourceMappingURL=mainController.js.map
