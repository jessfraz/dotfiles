/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
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
const vscode_languageclient_1 = require("vscode-languageclient");
const path = require("path");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const Utils = require("../models/utils");
const contracts_1 = require("../models/contracts");
const logger_1 = require("../models/logger");
const Constants = require("../constants/constants");
const server_1 = require("./server");
const serviceDownloadProvider_1 = require("./serviceDownloadProvider");
const decompressProvider_1 = require("./decompressProvider");
const httpClient_1 = require("./httpClient");
const extConfig_1 = require("../configurations/extConfig");
const platform_1 = require("../models/platform");
const serverStatus_1 = require("./serverStatus");
const statusView_1 = require("../views/statusView");
const LanguageServiceContracts = require("../models/contracts/languageService");
let _channel = undefined;
/**
 * Handle Language Service client errors
 * @class LanguageClientErrorHandler
 */
class LanguageClientErrorHandler {
    /**
     * Creates an instance of LanguageClientErrorHandler.
     * @memberOf LanguageClientErrorHandler
     */
    constructor(vscodeWrapper) {
        this.vscodeWrapper = vscodeWrapper;
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    /**
     * Show an error message prompt with a link to known issues wiki page
     * @memberOf LanguageClientErrorHandler
     */
    showOnErrorPrompt() {
        this.vscodeWrapper.showErrorMessage(Constants.sqlToolsServiceCrashMessage, Constants.sqlToolsServiceCrashButton).then(action => {
            if (action && action === Constants.sqlToolsServiceCrashButton) {
                vscode.env.openExternal(vscode.Uri.parse(Constants.sqlToolsServiceCrashLink));
            }
        });
    }
    /**
     * Callback for language service client error
     *
     * @param {Error} error
     * @param {Message} message
     * @param {number} count
     * @returns {ErrorAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    error(error, message, count) {
        this.showOnErrorPrompt();
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.ErrorAction.Shutdown;
    }
    /**
     * Callback for language service client closed
     *
     * @returns {CloseAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    closed() {
        this.showOnErrorPrompt();
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.CloseAction.DoNotRestart;
    }
}
// The Service Client class handles communication with the VS Code LanguageClient
class SqlToolsServiceClient {
    constructor(_config, _server, _logger, _statusView, _vscodeWrapper) {
        this._config = _config;
        this._server = _server;
        this._logger = _logger;
        this._statusView = _statusView;
        this._vscodeWrapper = _vscodeWrapper;
        // VS Code Language Client
        this._client = undefined;
        this._resourceClient = undefined;
    }
    // getter method for the Language Client
    get client() {
        return this._client;
    }
    set client(client) {
        this._client = client;
    }
    // getter method for language client diagnostic collection
    get diagnosticCollection() {
        return this._client.diagnostics;
    }
    // gets or creates the singleton SQL Tools service client instance
    static get instance() {
        if (this._instance === undefined) {
            let config = new extConfig_1.default();
            _channel = vscode.window.createOutputChannel(Constants.serviceInitializingOutputChannelName);
            let logger = new logger_1.Logger(text => _channel.append(text));
            let serverStatusView = new serverStatus_1.ServerStatusView();
            let httpClient = new httpClient_1.default();
            let decompressProvider = new decompressProvider_1.default();
            let downloadProvider = new serviceDownloadProvider_1.default(config, logger, serverStatusView, httpClient, decompressProvider);
            let serviceProvider = new server_1.default(downloadProvider, config, serverStatusView);
            let vscodeWrapper = new vscodeWrapper_1.default();
            let statusView = new statusView_1.default(vscodeWrapper);
            this._instance = new SqlToolsServiceClient(config, serviceProvider, logger, statusView, vscodeWrapper);
        }
        return this._instance;
    }
    // initialize the SQL Tools Service Client instance by launching
    // out-of-proc server through the LanguageClient
    initialize(context) {
        this._logger.appendLine(Constants.serviceInitializing);
        this._logPath = context.logPath;
        return platform_1.PlatformInformation.getCurrent().then(platformInfo => {
            return this.initializeForPlatform(platformInfo, context);
        });
    }
    initializeForPlatform(platformInfo, context) {
        return new Promise((resolve, reject) => {
            this._logger.appendLine(Constants.commandsNotAvailableWhileInstallingTheService);
            this._logger.appendLine();
            this._logger.append(`Platform: ${platformInfo.toString()}`);
            if (!platformInfo.isValidRuntime()) {
                Utils.showErrorMsg(Constants.unsupportedPlatformErrorMessage);
                reject('Invalid Platform');
            }
            else {
                if (platformInfo.runtimeId) {
                    this._logger.appendLine(` (${platformInfo.getRuntimeDisplayName()})`);
                }
                else {
                    this._logger.appendLine();
                }
                this._logger.appendLine();
                // For macOS we need to ensure the tools service version is set appropriately
                this.updateServiceVersion(platformInfo);
                this._server.getServerPath(platformInfo.runtimeId).then((serverPath) => __awaiter(this, void 0, void 0, function* () {
                    if (serverPath === undefined) {
                        // Check if the service already installed and if not open the output channel to show the logs
                        if (_channel !== undefined) {
                            _channel.show();
                        }
                        let installedServerPath = yield this._server.downloadServerFiles(platformInfo.runtimeId);
                        this.initializeLanguageClient(installedServerPath, context, platformInfo.isWindows());
                        yield this._client.onReady();
                        resolve(new serverStatus_1.ServerInitializationResult(true, true, installedServerPath));
                    }
                    else {
                        this.initializeLanguageClient(serverPath, context, platformInfo.isWindows());
                        yield this._client.onReady();
                        resolve(new serverStatus_1.ServerInitializationResult(false, true, serverPath));
                    }
                })).catch(err => {
                    Utils.logDebug(Constants.serviceLoadingFailed + ' ' + err);
                    Utils.showErrorMsg(Constants.serviceLoadingFailed);
                    reject(err);
                });
            }
        });
    }
    updateServiceVersion(platformInfo) {
        if (platformInfo.isMacOS() && platformInfo.isMacVersionLessThan('10.12.0')) {
            // Version 1.0 is required as this is the last one supporting downlevel macOS versions
            this._config.useServiceVersion(1);
        }
    }
    /**
     * Gets the known service version of the backing tools service. This can be useful for filtering
     * commands that are not supported if the tools service is below a certain known version
     *
     * @returns {number}
     * @memberof SqlToolsServiceClient
     */
    getServiceVersion() {
        return this._config.getServiceVersion();
    }
    /**
     * Initializes the SQL language configuration
     *
     * @memberOf SqlToolsServiceClient
     */
    initializeLanguageConfiguration() {
        vscode.languages.setLanguageConfiguration('sql', {
            comments: {
                lineComment: '--',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            __characterPairSupport: {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] }
                ]
            }
        });
    }
    initializeLanguageClient(serverPath, context, isWindows) {
        if (serverPath === undefined) {
            Utils.logDebug(Constants.invalidServiceFilePath);
            throw new Error(Constants.invalidServiceFilePath);
        }
        else {
            let self = this;
            self.initializeLanguageConfiguration();
            let serverOptions = this.createServerOptions(serverPath);
            this.client = this.createLanguageClient(serverOptions);
            let executablePath = isWindows ? Constants.windowsResourceClientPath : Constants.unixResourceClientPath;
            let resourcePath = path.join(path.dirname(serverPath), executablePath);
            this._resourceClient = this.createResourceClient(resourcePath);
            if (context !== undefined) {
                // Create the language client and start the client.
                let disposable = this.client.start();
                // Start the resource client
                let resourceDisposable = this._resourceClient.start();
                // Push the disposable to the context's subscriptions so that the
                // client can be deactivated on extension deactivation
                context.subscriptions.push(disposable);
                context.subscriptions.push(resourceDisposable);
            }
        }
    }
    createLanguageClient(serverOptions) {
        // Options to control the language client
        let clientOptions = {
            documentSelector: ['sql'],
            diagnosticCollectionName: 'mssql',
            synchronize: {
                configurationSection: 'mssql'
            },
            errorHandler: new LanguageClientErrorHandler(this._vscodeWrapper)
        };
        // cache the client instance for later use
        let client = new vscode_languageclient_1.LanguageClient(Constants.sqlToolsServiceName, serverOptions, clientOptions);
        client.onReady().then(() => {
            this.checkServiceCompatibility();
            client.onNotification(LanguageServiceContracts.StatusChangedNotification.type, this.handleLanguageServiceStatusNotification());
        });
        return client;
    }
    generateResourceServiceServerOptions(executablePath) {
        let launchArgs = Utils.getCommonLaunchArgsAndCleanupOldLogFiles(this._logPath, 'resourceprovider.log', executablePath);
        return { command: executablePath, args: launchArgs, transport: vscode_languageclient_1.TransportKind.stdio };
    }
    createResourceClient(resourcePath) {
        // add resource provider path here
        let serverOptions = this.generateResourceServiceServerOptions(resourcePath);
        // client options are undefined since we don't want to send language events to the
        // server, since it's handled by the main client
        let client = new vscode_languageclient_1.LanguageClient(Constants.resourceServiceName, serverOptions, undefined);
        return client;
    }
    /**
     * Public for testing purposes only.
     */
    handleLanguageServiceStatusNotification() {
        return (event) => {
            this._statusView.languageServiceStatusChanged(event.ownerUri, event.status);
        };
    }
    createServerOptions(servicePath) {
        let serverArgs = [];
        let serverCommand = servicePath;
        if (servicePath.endsWith('.dll')) {
            serverArgs = [servicePath];
            serverCommand = 'dotnet';
        }
        // Get the extenion's configuration
        let config = vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
        if (config) {
            // Enable diagnostic logging in the service if it is configured
            let logDebugInfo = config[Constants.configLogDebugInfo];
            if (logDebugInfo) {
                serverArgs.push('--enable-logging');
            }
            // Send Locale for sqltoolsservice localization
            let applyLocalization = config[Constants.configApplyLocalization];
            if (applyLocalization) {
                let locale = vscode.env.language;
                serverArgs.push('--locale');
                serverArgs.push(locale);
            }
        }
        // run the service host using dotnet.exe from the path
        let serverOptions = { command: serverCommand, args: serverArgs, transport: vscode_languageclient_1.TransportKind.stdio };
        return serverOptions;
    }
    /**
     * Send a request to the service client
     * @param type The of the request to make
     * @param params The params to pass with the request
     * @returns A thenable object for when the request receives a response
     */
    // tslint:disable-next-line:no-unused-variable
    sendRequest(type, params) {
        if (this.client !== undefined) {
            return this.client.sendRequest(type, params);
        }
    }
    /**
     * Send a request to the service client
     * @param type The of the request to make
     * @param params The params to pass with the request
     * @returns A thenable object for when the request receives a response
     */
    // tslint:disable-next-line:no-unused-variable
    sendResourceRequest(type, params) {
        if (this._resourceClient !== undefined) {
            return this._resourceClient.sendRequest(type, params);
        }
    }
    /**
     * Send a notification to the service client
     * @param params The params to pass with the notification
     */
    // tslint:disable-next-line:no-unused-variable
    sendNotification(type, params) {
        if (this.client !== undefined) {
            this.client.sendNotification(type, params);
        }
    }
    /**
     * Register a handler for a notification type
     * @param type The notification type to register the handler for
     * @param handler The handler to register
     */
    // tslint:disable-next-line:no-unused-variable
    onNotification(type, handler) {
        if (this._client !== undefined) {
            return this.client.onNotification(type, handler);
        }
    }
    checkServiceCompatibility() {
        return new Promise((resolve, reject) => {
            this._client.sendRequest(contracts_1.VersionRequest.type, undefined).then((result) => {
                Utils.logDebug('sqlserverclient version: ' + result);
                if (result === undefined || !result.startsWith(Constants.serviceCompatibleVersion)) {
                    Utils.showErrorMsg(Constants.serviceNotCompatibleError);
                    Utils.logDebug(Constants.serviceNotCompatibleError);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
}
// singleton instance
SqlToolsServiceClient._instance = undefined;
exports.default = SqlToolsServiceClient;

//# sourceMappingURL=serviceclient.js.map
