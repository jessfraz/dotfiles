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
const connectionCredentials_1 = require("../models/connectionCredentials");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const ConnectionContracts = require("../models/contracts/connection");
const LanguageServiceContracts = require("../models/contracts/languageService");
const Utils = require("../models/utils");
const connectionStore_1 = require("../models/connectionStore");
const connectionUI_1 = require("../views/connectionUI");
const serviceclient_1 = require("../languageservice/serviceclient");
const vscodeWrapper_1 = require("./vscodeWrapper");
const platform_1 = require("../models/platform");
const firewallService_1 = require("../firewall/firewallService");
/**
 * Information for a document's connection. Exported for testing purposes.
 */
class ConnectionInfo {
    get loginFailed() {
        return this.errorNumber && this.errorNumber === Constants.errorLoginFailed;
    }
}
exports.ConnectionInfo = ConnectionInfo;
// ConnectionManager class is the main controller for connection management
class ConnectionManager {
    constructor(context, statusView, prompter, _client, _vscodeWrapper, _connectionStore, _connectionUI) {
        this._client = _client;
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionStore = _connectionStore;
        this._connectionUI = _connectionUI;
        this._statusView = statusView;
        this._connections = {};
        this._connectionCredentialsToServerInfoMap =
            new Map();
        this._uriToConnectionPromiseMap = new Map();
        if (!this.client) {
            this.client = serviceclient_1.default.instance;
        }
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
        if (!this._connectionStore) {
            this._connectionStore = new connectionStore_1.ConnectionStore(context);
        }
        if (!this._connectionUI) {
            this._connectionUI = new connectionUI_1.ConnectionUI(this, this._connectionStore, prompter, this.vscodeWrapper);
        }
        // Initiate the firewall service
        this._firewallService = new firewallService_1.FirewallService(this.client, this.vscodeWrapper);
        this._failedUriToFirewallIpMap = new Map();
        if (this.client !== undefined) {
            this.client.onNotification(ConnectionContracts.ConnectionChangedNotification.type, this.handleConnectionChangedNotification());
            this.client.onNotification(ConnectionContracts.ConnectionCompleteNotification.type, this.handleConnectionCompleteNotification());
            this.client.onNotification(LanguageServiceContracts.IntelliSenseReadyNotification.type, this.handleLanguageServiceUpdateNotification());
        }
    }
    /**
     * Exposed for testing purposes
     */
    get vscodeWrapper() {
        return this._vscodeWrapper;
    }
    /**
     * Exposed for testing purposes
     */
    set vscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    /**
     * Exposed for testing purposes
     */
    get client() {
        return this._client;
    }
    /**
     * Exposed for testing purposes
     */
    set client(client) {
        this._client = client;
    }
    /**
     * Get the connection view.
     */
    get connectionUI() {
        return this._connectionUI;
    }
    /**
     * Exposed for testing purposes
     */
    get statusView() {
        return this._statusView;
    }
    /**
     * Exposed for testing purposes
     */
    set statusView(value) {
        this._statusView = value;
    }
    /**
     * Exposed for testing purposes
     */
    get connectionStore() {
        return this._connectionStore;
    }
    /**
     * Exposed for testing purposes
     */
    set connectionStore(value) {
        this._connectionStore = value;
    }
    /**
     * Exposed for testing purposes
     */
    get connectionCount() {
        return Object.keys(this._connections).length;
    }
    get failedUriToFirewallIpMap() {
        return this._failedUriToFirewallIpMap;
    }
    get firewallService() {
        return this._firewallService;
    }
    isActiveConnection(credential) {
        const connectedCredentials = Object.keys(this._connections).map((uri) => this._connections[uri].credentials);
        for (let connectedCredential of connectedCredentials) {
            if (Utils.isSameConnection(credential, connectedCredential)) {
                return true;
            }
        }
        return false;
    }
    getUriForConnection(connection) {
        for (let uri of Object.keys(this._connections)) {
            if (Utils.isSameConnection(this._connections[uri].credentials, connection)) {
                return uri;
            }
        }
        return undefined;
    }
    isConnected(fileUri) {
        return (fileUri in this._connections && this._connections[fileUri].connectionId && Utils.isNotEmpty(this._connections[fileUri].connectionId));
    }
    isConnecting(fileUri) {
        return (fileUri in this._connections && this._connections[fileUri].connecting);
    }
    /**
     * Exposed for testing purposes.
     */
    getConnectionInfo(fileUri) {
        return this._connections[fileUri];
    }
    /**
     * Public for testing purposes only.
     */
    handleLanguageServiceUpdateNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (event) => {
            self._statusView.languageServiceStatusChanged(event.ownerUri, LocalizedConstants.intelliSenseUpdatedStatus);
            let connection = self.getConnectionInfo(event.ownerUri);
            if (connection !== undefined) {
                let numberOfCharacters = 0;
                if (this.vscodeWrapper.activeTextEditor !== undefined
                    && this.vscodeWrapper.activeTextEditor.document !== undefined) {
                    let document = this.vscodeWrapper.activeTextEditor.document;
                    numberOfCharacters = document.getText().length;
                }
            }
        };
    }
    /**
     * Public for testing purposes only.
     */
    handleConnectionChangedNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (event) => {
            if (self.isConnected(event.ownerUri)) {
                let connectionInfo = self._connections[event.ownerUri];
                connectionInfo.credentials.server = event.connection.serverName;
                connectionInfo.credentials.database = event.connection.databaseName;
                connectionInfo.credentials.user = event.connection.userName;
                self._statusView.connectSuccess(event.ownerUri, connectionInfo.credentials, connectionInfo.serverInfo);
                let logMessage = Utils.formatString(LocalizedConstants.msgChangedDatabaseContext, event.connection.databaseName, event.ownerUri);
                self.vscodeWrapper.logToOutputChannel(logMessage);
            }
        };
    }
    /**
     * Public for testing purposes only.
     */
    handleConnectionCompleteNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (result) => __awaiter(this, void 0, void 0, function* () {
            let fileUri = result.ownerUri;
            let connection = self.getConnectionInfo(fileUri);
            connection.connecting = false;
            let mruConnection = {};
            if (Utils.isNotEmpty(result.connectionId)) {
                // Convert to credentials if it's a connection string based connection
                if (connection.credentials.connectionString) {
                    connection.credentials = this.populateCredentialsFromConnectionString(connection.credentials, result.connectionSummary);
                }
                this._connectionCredentialsToServerInfoMap.set(connection.credentials, result.serverInfo);
                // We have a valid connection
                // Copy credentials as the database name will be updated
                let newCredentials = {};
                Object.assign(newCredentials, connection.credentials);
                if (result.connectionSummary && result.connectionSummary.databaseName) {
                    newCredentials.database = result.connectionSummary.databaseName;
                }
                self.handleConnectionSuccess(fileUri, connection, newCredentials, result);
                mruConnection = connection.credentials;
                const promise = self._uriToConnectionPromiseMap.get(result.ownerUri);
                if (promise) {
                    promise.resolve(true);
                    self._uriToConnectionPromiseMap.delete(result.ownerUri);
                }
            }
            else {
                mruConnection = undefined;
                const promise = self._uriToConnectionPromiseMap.get(result.ownerUri);
                if (promise) {
                    if (result.errorMessage) {
                        yield self.handleConnectionErrors(fileUri, connection, result);
                        promise.reject(result.errorMessage);
                        self._uriToConnectionPromiseMap.delete(result.ownerUri);
                    }
                    else if (result.messages) {
                        promise.reject(result.messages);
                        self._uriToConnectionPromiseMap.delete(result.ownerUri);
                    }
                }
                yield self.handleConnectionErrors(fileUri, connection, result);
            }
            self.tryAddMruConnection(connection, mruConnection);
        });
    }
    handleConnectionSuccess(fileUri, connection, newCredentials, result) {
        connection.connectionId = result.connectionId;
        connection.serverInfo = result.serverInfo;
        connection.credentials = newCredentials;
        connection.errorNumber = undefined;
        connection.errorMessage = undefined;
        this.statusView.connectSuccess(fileUri, newCredentials, connection.serverInfo);
        this.statusView.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
        this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnectedServerInfo, connection.credentials.server, fileUri, JSON.stringify(connection.serverInfo)));
    }
    handleConnectionErrors(fileUri, connection, result) {
        return __awaiter(this, void 0, void 0, function* () {
            if (result.errorNumber && result.errorMessage && !Utils.isEmpty(result.errorMessage)) {
                // Check if the error is an expired password
                if (result.errorNumber === Constants.errorPasswordExpired || result.errorNumber === Constants.errorPasswordNeedsReset) {
                    // TODO: we should allow the user to change their password here once corefx supports SqlConnection.ChangePassword()
                    Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionErrorPasswordExpired, result.errorNumber, result.errorMessage));
                }
                else if (result.errorNumber !== Constants.errorLoginFailed) {
                    Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError, result.errorNumber, result.errorMessage));
                    // check whether it's a firewall rule error
                    let firewallResult = yield this.firewallService.handleFirewallRule(result.errorNumber, result.errorMessage);
                    if (firewallResult.result && firewallResult.ipAddress) {
                        this._failedUriToFirewallIpMap.set(fileUri, firewallResult.ipAddress);
                    }
                }
                connection.errorNumber = result.errorNumber;
                connection.errorMessage = result.errorMessage;
            }
            else {
                platform_1.PlatformInformation.getCurrent().then(platformInfo => {
                    if (!platformInfo.isWindows() && result.errorMessage && result.errorMessage.includes('Kerberos')) {
                        this.vscodeWrapper.showErrorMessage(Utils.formatString(LocalizedConstants.msgConnectionError2, result.errorMessage), LocalizedConstants.macOpenSslHelpButton)
                            .then(action => {
                            if (action && action === LocalizedConstants.macOpenSslHelpButton) {
                                vscode.env.openExternal(vscode.Uri.parse(Constants.integratedAuthHelpLink));
                            }
                        });
                    }
                    else if (platformInfo.runtimeId === platform_1.Runtime.OSX_10_11_64 &&
                        result.messages.indexOf('Unable to load DLL \'System.Security.Cryptography.Native\'') !== -1) {
                        this.vscodeWrapper.showErrorMessage(Utils.formatString(LocalizedConstants.msgConnectionError2, LocalizedConstants.macOpenSslErrorMessage), LocalizedConstants.macOpenSslHelpButton).then(action => {
                            if (action && action === LocalizedConstants.macOpenSslHelpButton) {
                                vscode.env.openExternal(vscode.Uri.parse(Constants.macOpenSslHelpLink));
                            }
                        });
                    }
                    else {
                        Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError2, result.messages));
                    }
                });
            }
            this.statusView.connectError(fileUri, connection.credentials, result);
            this.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnectionFailed, connection.credentials.server, result.errorMessage ? result.errorMessage : result.messages));
        });
    }
    tryAddMruConnection(connection, newConnection) {
        if (newConnection) {
            let connectionToSave = Object.assign({}, newConnection);
            this._connectionStore.addRecentlyUsed(connectionToSave)
                .then(() => {
                connection.connectHandler(true);
            }, err => {
                connection.connectHandler(false, err);
            });
        }
        else {
            connection.connectHandler(false);
        }
    }
    /**
     * Populates a credential object based on the credential connection string
     */
    populateCredentialsFromConnectionString(credentials, connectionSummary) {
        // populate credential details
        credentials.database = connectionSummary.databaseName;
        credentials.user = connectionSummary.userName;
        credentials.server = connectionSummary.serverName;
        // save credentials if needed
        let isPasswordBased = connectionCredentials_1.ConnectionCredentials.isPasswordBasedConnectionString(credentials.connectionString);
        if (isPasswordBased) {
            // save the connection string here
            this._connectionStore.saveProfileWithConnectionString(credentials);
            // replace the conn string from the profile
            credentials.connectionString = connectionStore_1.ConnectionStore.formatCredentialId(credentials.server, credentials.database, credentials.user, connectionStore_1.ConnectionStore.CRED_PROFILE_USER, true);
            // set auth type
            credentials.authenticationType = Constants.sqlAuthentication;
            // set savePassword to true so that credentials are automatically
            // deleted if the settings file is manually changed
            credentials.savePassword = true;
        }
        else {
            credentials.authenticationType = 'Integrated';
        }
        return credentials;
    }
    /**
     * Clear the recently used connections list in the connection store
     */
    clearRecentConnectionsList() {
        return this.connectionStore.clearRecentlyUsed();
    }
    // choose database to use on current server from UI
    onChooseDatabase() {
        const self = this;
        const fileUri = this.vscodeWrapper.activeTextEditorUri;
        return new Promise((resolve, reject) => {
            if (!self.isConnected(fileUri)) {
                self.vscodeWrapper.showWarningMessage(LocalizedConstants.msgChooseDatabaseNotConnected);
                resolve(false);
                return;
            }
            // Get list of databases on current server
            let listParams = new ConnectionContracts.ListDatabasesParams();
            listParams.ownerUri = fileUri;
            self.client.sendRequest(ConnectionContracts.ListDatabasesRequest.type, listParams).then((result) => {
                // Then let the user select a new database to connect to
                self.connectionUI.showDatabasesOnCurrentServer(self._connections[fileUri].credentials, result.databaseNames).then(newDatabaseCredentials => {
                    if (newDatabaseCredentials) {
                        self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgChangingDatabase, newDatabaseCredentials.database, newDatabaseCredentials.server, fileUri));
                        self.disconnect(fileUri).then(() => {
                            self.connect(fileUri, newDatabaseCredentials).then(() => {
                                self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgChangedDatabase, newDatabaseCredentials.database, newDatabaseCredentials.server, fileUri));
                                resolve(true);
                            }).catch(err => {
                                reject(err);
                            });
                        }).catch(err => {
                            reject(err);
                        });
                    }
                    else {
                        resolve(false);
                    }
                }).catch(err => {
                    reject(err);
                });
            });
        });
    }
    changeDatabase(newDatabaseCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            const self = this;
            const fileUri = this.vscodeWrapper.activeTextEditorUri;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!self.isConnected(fileUri)) {
                    self.vscodeWrapper.showWarningMessage(LocalizedConstants.msgChooseDatabaseNotConnected);
                    resolve(false);
                    return;
                }
                yield self.disconnect(fileUri);
                yield self.connect(fileUri, newDatabaseCredentials);
                self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgChangedDatabase, newDatabaseCredentials.database, newDatabaseCredentials.server, fileUri));
                return true;
            }));
        });
    }
    onChooseLanguageFlavor(isSqlCmdMode = false, isSqlCmd = false) {
        const fileUri = this._vscodeWrapper.activeTextEditorUri;
        if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
            if (isSqlCmdMode) {
                serviceclient_1.default.instance.sendNotification(LanguageServiceContracts.LanguageFlavorChangedNotification.type, {
                    uri: fileUri,
                    language: isSqlCmd ? 'sqlcmd' : 'sql',
                    flavor: 'MSSQL'
                });
                return Promise.resolve(true);
            }
            return this._connectionUI.promptLanguageFlavor().then(flavor => {
                if (!flavor) {
                    return false;
                }
                this.statusView.languageFlavorChanged(fileUri, flavor);
                serviceclient_1.default.instance.sendNotification(LanguageServiceContracts.LanguageFlavorChangedNotification.type, {
                    uri: fileUri,
                    language: 'sql',
                    flavor: flavor
                });
            });
        }
        else {
            this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            return Promise.resolve(false);
        }
    }
    // close active connection, if any
    onDisconnect() {
        return this.disconnect(this.vscodeWrapper.activeTextEditorUri);
    }
    disconnect(fileUri) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.isConnected(fileUri)) {
                let disconnectParams = new ConnectionContracts.DisconnectParams();
                disconnectParams.ownerUri = fileUri;
                self.client.sendRequest(ConnectionContracts.DisconnectRequest.type, disconnectParams).then((result) => {
                    if (self.statusView) {
                        self.statusView.notConnected(fileUri);
                    }
                    if (result) {
                        self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgDisconnected, fileUri));
                    }
                    delete self._connections[fileUri];
                    resolve(result);
                });
            }
            else if (self.isConnecting(fileUri)) {
                // Prompt the user to cancel connecting
                self.onCancelConnect();
                resolve(true);
            }
            else {
                resolve(true);
            }
        });
    }
    /**
     * Helper to show all connections and perform connect logic.
     */
    showConnectionsAndConnect(resolve, reject, fileUri) {
        const self = this;
        // show connection picklist
        self.connectionUI.showConnections()
            .then(function (connectionCreds) {
            if (connectionCreds) {
                // close active connection
                self.disconnect(fileUri).then(function () {
                    // connect to the server/database
                    self.connect(fileUri, connectionCreds)
                        .then(result => {
                        self.handleConnectionResult(result, fileUri, connectionCreds).then(() => {
                            resolve(connectionCreds);
                        });
                    });
                });
            }
            else {
                resolve(false);
            }
        });
    }
    /**
     * Get the server info for a connection
     * @param connectionCreds
     */
    getServerInfo(connectionCredentials) {
        if (this._connectionCredentialsToServerInfoMap.has(connectionCredentials)) {
            return this._connectionCredentialsToServerInfoMap.get(connectionCredentials);
        }
    }
    /**
     * Verifies the connection result. If connection failed because of invalid credentials,
     * tries to connect again by asking user for different credentials
     * @param result Connection result
     * @param fileUri file Uri
     * @param connectionCreds Connection Profile
     */
    handleConnectionResult(result, fileUri, connectionCreds) {
        const self = this;
        return new Promise((resolve, reject) => {
            let connection = self._connections[fileUri];
            if (!result && connection && connection.loginFailed) {
                self.connectionUI.createProfileWithDifferentCredentials(connectionCreds).then(newConnection => {
                    if (newConnection) {
                        self.connect(fileUri, newConnection).then(newResult => {
                            connection = self._connections[fileUri];
                            if (!newResult && connection && connection.loginFailed) {
                                Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError, connection.errorNumber, connection.errorMessage));
                            }
                            resolve(newResult);
                        });
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                resolve(true);
            }
        });
    }
    /**
     * Delete a credential from the credential store
     */
    deleteCredential(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._connectionStore.deleteCredential(profile);
        });
    }
    // let users pick from a picklist of connections
    onNewConnection() {
        const self = this;
        const fileUri = this.vscodeWrapper.activeTextEditorUri;
        return new Promise((resolve, reject) => {
            if (!fileUri) {
                // A text document needs to be open before we can connect
                self.vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
                resolve(undefined);
                return;
            }
            else if (!self.vscodeWrapper.isEditingSqlFile) {
                self.connectionUI.promptToChangeLanguageMode().then(result => {
                    if (result) {
                        self.showConnectionsAndConnect(resolve, reject, fileUri);
                    }
                    else {
                        resolve(undefined);
                    }
                });
                return;
            }
            self.showConnectionsAndConnect(resolve, reject, fileUri);
        });
    }
    // create a new connection with the connectionCreds provided
    connect(fileUri, connectionCreds, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            const self = this;
            let connectionPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let connectionInfo = new ConnectionInfo();
                connectionInfo.credentials = connectionCreds;
                connectionInfo.connecting = true;
                this._connections[fileUri] = connectionInfo;
                // Note: must call flavor changed before connecting, or the timer showing an animation doesn't occur
                if (self.statusView) {
                    self.statusView.languageFlavorChanged(fileUri, Constants.mssqlProviderName);
                    self.statusView.connecting(fileUri, connectionCreds);
                    self.statusView.languageFlavorChanged(fileUri, Constants.mssqlProviderName);
                }
                self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnecting, connectionCreds.server, fileUri));
                // Setup the handler for the connection complete notification to call
                connectionInfo.connectHandler = ((connectResult, error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(connectResult);
                    }
                });
                // package connection details for request message
                const connectionDetails = connectionCredentials_1.ConnectionCredentials.createConnectionDetails(connectionCreds);
                let connectParams = new ConnectionContracts.ConnectParams();
                connectParams.ownerUri = fileUri;
                connectParams.connection = connectionDetails;
                // send connection request message to service host
                this._uriToConnectionPromiseMap.set(connectParams.ownerUri, promise);
                try {
                    const result = yield self.client.sendRequest(ConnectionContracts.ConnectionRequest.type, connectParams);
                    if (!result) {
                        // Failed to process connect request
                        resolve(false);
                    }
                }
                catch (error) {
                    reject(error);
                }
            }));
            let connectionResult = yield connectionPromise;
            return connectionResult;
        });
    }
    onCancelConnect() {
        this.connectionUI.promptToCancelConnection().then(result => {
            if (result) {
                this.cancelConnect();
            }
        });
    }
    cancelConnect() {
        let fileUri = this.vscodeWrapper.activeTextEditorUri;
        if (!fileUri || Utils.isEmpty(fileUri)) {
            return;
        }
        let cancelParams = new ConnectionContracts.CancelConnectParams();
        cancelParams.ownerUri = fileUri;
        const self = this;
        this.client.sendRequest(ConnectionContracts.CancelConnectRequest.type, cancelParams).then(result => {
            if (result) {
                self.statusView.notConnected(fileUri);
            }
        });
    }
    /**
     * Called when the 'Manage Connection Profiles' command is issued.
     */
    onManageProfiles() {
        // Show quick pick to create, edit, or remove profiles
        return this._connectionUI.promptToManageProfiles();
    }
    onCreateProfile() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.connectionUI.createAndSaveProfile(self.vscodeWrapper.isEditingSqlFile)
                .then(profile => resolve(profile ? true : false));
        });
    }
    onRemoveProfile() {
        return this.connectionUI.removeProfile();
    }
    onDidCloseTextDocument(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            let docUri = doc.uri.toString(true);
            // If this file isn't connected, then don't do anything
            if (!this.isConnected(docUri)) {
                return;
            }
            // Disconnect the document's connection when we close it
            yield this.disconnect(docUri);
        });
    }
    onDidOpenTextDocument(doc) {
        let uri = doc.uri.toString(true);
        if (doc.languageId === 'sql' && typeof (this._connections[uri]) === 'undefined') {
            this.statusView.notConnected(uri);
        }
    }
    transferFileConnection(oldFileUri, newFileUri) {
        return __awaiter(this, void 0, void 0, function* () {
            // Is the new file connected or the old file not connected?
            if (!this.isConnected(oldFileUri) || this.isConnected(newFileUri)) {
                return;
            }
            // Connect the saved uri and disconnect the untitled uri on successful connection
            let creds = this._connections[oldFileUri].credentials;
            let result = yield this.connect(newFileUri, creds);
            if (result) {
                yield this.disconnect(oldFileUri);
            }
        });
    }
    getIsServerLinux(osVersion) {
        if (osVersion) {
            if (osVersion.indexOf('Linux') !== -1) {
                return 'Linux';
            }
            else {
                return 'Windows';
            }
        }
        return '';
    }
}
exports.default = ConnectionManager;

//# sourceMappingURL=connectionManager.js.map
