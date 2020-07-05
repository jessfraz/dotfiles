/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Constants = require("../constants/constants");
/*
* The status class which includes the service initialization result.
*/
class ServerInitializationResult {
    constructor(installedBeforeInitializing = false, isRunning = false, serverPath = undefined) {
        this.installedBeforeInitializing = installedBeforeInitializing;
        this.isRunning = isRunning;
        this.serverPath = serverPath;
    }
    clone() {
        return new ServerInitializationResult(this.installedBeforeInitializing, this.isRunning, this.serverPath);
    }
    withRunning(isRunning) {
        return new ServerInitializationResult(this.installedBeforeInitializing, isRunning, this.serverPath);
    }
}
exports.ServerInitializationResult = ServerInitializationResult;
/*
* The status class shows service installing progress in UI
*/
class ServerStatusView {
    constructor() {
        this._numberOfSecondsBeforeHidingMessage = 5000;
        this._statusBarItem = undefined;
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this._onDidChangeActiveTextEditorEvent = vscode.window.onDidChangeActiveTextEditor((params) => this.onDidChangeActiveTextEditor(params));
        this._onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument((params) => this.onDidCloseTextDocument(params));
    }
    installingService() {
        this._statusBarItem.command = undefined;
        this._statusBarItem.show();
        this.showProgress('$(desktop-download) ' + Constants.serviceInstalling);
    }
    updateServiceDownloadingProgress(downloadPercentage) {
        this._statusBarItem.text = '$(cloud-download) ' + `${Constants.serviceDownloading} ... ${downloadPercentage}%`;
        this._statusBarItem.show();
    }
    serviceInstalled() {
        this._statusBarItem.command = undefined;
        this._statusBarItem.text = Constants.serviceInstalled;
        this._statusBarItem.show();
        // Cleat the status bar after 2 seconds
        setTimeout(() => {
            this._statusBarItem.hide();
        }, this._numberOfSecondsBeforeHidingMessage);
    }
    serviceInstallationFailed() {
        this._statusBarItem.command = undefined;
        this._statusBarItem.text = Constants.serviceInstallationFailed;
        this._statusBarItem.show();
    }
    showProgress(statusText) {
        let index = 0;
        let progressTicks = ['|', '/', '-', '\\'];
        setInterval(() => {
            index++;
            if (index > 3) {
                index = 0;
            }
            let progressTick = progressTicks[index];
            if (this._statusBarItem.text !== Constants.serviceInstalled) {
                this._statusBarItem.text = statusText + ' ' + progressTick;
                this._statusBarItem.show();
            }
        }, 200);
    }
    dispose() {
        this.destroyStatusBar();
        this._onDidChangeActiveTextEditorEvent.dispose();
        this._onDidCloseTextDocument.dispose();
    }
    hideLastShownStatusBar() {
        if (typeof this._statusBarItem !== 'undefined') {
            this._statusBarItem.hide();
        }
    }
    onDidChangeActiveTextEditor(editor) {
        // Hide the most recently shown status bar
        this.hideLastShownStatusBar();
    }
    onDidCloseTextDocument(doc) {
        // Remove the status bar associated with the document
        this.destroyStatusBar();
    }
    destroyStatusBar() {
        if (typeof this._statusBarItem !== 'undefined') {
            this._statusBarItem.dispose();
        }
    }
    /**
     * For testing purposes
     */
    get statusBarItem() {
        return this._statusBarItem;
    }
}
exports.ServerStatusView = ServerStatusView;

//# sourceMappingURL=serverStatus.js.map
