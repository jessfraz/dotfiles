"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const path = require("path");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const serviceclient_1 = require("../languageservice/serviceclient");
const Contracts = require("../models/contracts");
const Utils = require("../models/utils");
let opener = require('opener');
/**
 *  Handles save results request from the context menu of slickGrid
 */
class ResultsSerializer {
    constructor(client, vscodeWrapper) {
        if (client) {
            this._client = client;
        }
        else {
            this._client = serviceclient_1.default.instance;
        }
        if (vscodeWrapper) {
            this._vscodeWrapper = vscodeWrapper;
        }
        else {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    promptForFilepath(format) {
        let defaultUri;
        if (vscode.Uri.parse(this._uri).scheme === 'untitled') {
            defaultUri = undefined;
        }
        else {
            defaultUri = vscode.Uri.parse(path.dirname(this._uri));
        }
        let fileTypeFilter = {};
        if (format === 'csv') {
            fileTypeFilter[LocalizedConstants.fileTypeCSVLabel] = ['csv'];
        }
        else if (format === 'json') {
            fileTypeFilter[LocalizedConstants.fileTypeJSONLabel] = ['json'];
        }
        else if (format === 'excel') {
            fileTypeFilter[LocalizedConstants.fileTypeExcelLabel] = ['xlsx'];
        }
        let options = {
            defaultUri: defaultUri,
            filters: fileTypeFilter
        };
        return this._vscodeWrapper.showSaveDialog(options).then(uri => {
            if (!uri) {
                return undefined;
            }
            return uri.scheme === 'file' ? uri.fsPath : uri.path;
        });
    }
    getConfigForCsv() {
        // get save results config from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this._uri);
        let saveConfig = config[Constants.configSaveAsCsv];
        let saveResultsParams = new Contracts.SaveResultsAsCsvRequestParams();
        // if user entered config, set options
        if (saveConfig) {
            if (saveConfig.includeHeaders !== undefined) {
                saveResultsParams.includeHeaders = saveConfig.includeHeaders;
            }
            if (saveConfig.delimiter !== undefined) {
                saveResultsParams.delimiter = saveConfig.delimiter;
            }
            if (saveConfig.lineSeparator !== undefined) {
                saveResultsParams.lineSeperator = saveConfig.lineSeparator;
            }
            if (saveConfig.textIdentifier !== undefined) {
                saveResultsParams.textIdentifier = saveConfig.textIdentifier;
            }
            if (saveConfig.encoding !== undefined) {
                saveResultsParams.encoding = saveConfig.encoding;
            }
        }
        return saveResultsParams;
    }
    getConfigForJson() {
        // get save results config from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this._uri);
        let saveConfig = config[Constants.configSaveAsJson];
        let saveResultsParams = new Contracts.SaveResultsAsJsonRequestParams();
        if (saveConfig) {
            // TODO: assign config
        }
        return saveResultsParams;
    }
    getConfigForExcel() {
        // get save results config from vscode config
        // Note: we are currently using the configSaveAsCsv setting since it has the option mssql.saveAsCsv.includeHeaders
        // and we want to have just 1 setting that lists this.
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this._uri);
        let saveConfig = config[Constants.configSaveAsCsv];
        let saveResultsParams = new Contracts.SaveResultsAsExcelRequestParams();
        // if user entered config, set options
        if (saveConfig) {
            if (saveConfig.includeHeaders !== undefined) {
                saveResultsParams.includeHeaders = saveConfig.includeHeaders;
            }
        }
        return saveResultsParams;
    }
    getParameters(filePath, batchIndex, resultSetNo, format, selection) {
        const self = this;
        let saveResultsParams;
        this._filePath = filePath;
        if (format === 'csv') {
            saveResultsParams = self.getConfigForCsv();
        }
        else if (format === 'json') {
            saveResultsParams = self.getConfigForJson();
        }
        else if (format === 'excel') {
            saveResultsParams = self.getConfigForExcel();
        }
        saveResultsParams.filePath = this._filePath;
        saveResultsParams.ownerUri = this._uri;
        saveResultsParams.resultSetIndex = resultSetNo;
        saveResultsParams.batchIndex = batchIndex;
        if (this.isSelected(selection)) {
            saveResultsParams.rowStartIndex = selection.fromRow;
            saveResultsParams.rowEndIndex = selection.toRow;
            saveResultsParams.columnStartIndex = selection.fromCell;
            saveResultsParams.columnEndIndex = selection.toCell;
        }
        return saveResultsParams;
    }
    /**
     * Check if a range of cells were selected.
     */
    isSelected(selection) {
        return (selection && !((selection.fromCell === selection.toCell) && (selection.fromRow === selection.toRow)));
    }
    /**
     * Send request to sql tools service to save a result set
     */
    sendRequestToService(filePath, batchIndex, resultSetNo, format, selection) {
        const self = this;
        let saveResultsParams = self.getParameters(filePath, batchIndex, resultSetNo, format, selection);
        let type;
        if (format === 'csv') {
            type = Contracts.SaveResultsAsCsvRequest.type;
        }
        else if (format === 'json') {
            type = Contracts.SaveResultsAsJsonRequest.type;
        }
        else if (format === 'excel') {
            type = Contracts.SaveResultsAsExcelRequest.type;
        }
        self._vscodeWrapper.logToOutputChannel(LocalizedConstants.msgSaveStarted + this._filePath);
        // send message to the sqlserverclient for converting results to the requested format and saving to filepath
        return self._client.sendRequest(type, saveResultsParams).then((result) => {
            if (result.messages) {
                self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgSaveFailed + result.messages);
                self._vscodeWrapper.logToOutputChannel(LocalizedConstants.msgSaveFailed + result.messages);
            }
            else {
                self._vscodeWrapper.showInformationMessage(LocalizedConstants.msgSaveSucceeded + this._filePath);
                self._vscodeWrapper.logToOutputChannel(LocalizedConstants.msgSaveSucceeded + filePath);
                self.openSavedFile(self._filePath, format);
            }
        }, error => {
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgSaveFailed + error.message);
            self._vscodeWrapper.logToOutputChannel(LocalizedConstants.msgSaveFailed + error.message);
        });
    }
    /**
     * Handle save request by getting filename from user and sending request to service
     */
    onSaveResults(uri, batchIndex, resultSetNo, format, selection) {
        const self = this;
        this._uri = uri;
        // prompt for filepath
        return self.promptForFilepath(format).then(function (filePath) {
            if (!Utils.isEmpty(filePath)) {
                self.sendRequestToService(filePath, batchIndex, resultSetNo, format, selection ? selection[0] : undefined);
            }
        }, error => {
            self._vscodeWrapper.showErrorMessage(error.message);
            self._vscodeWrapper.logToOutputChannel(error.message);
        });
    }
    /**
     * Open the saved file in a new vscode editor pane
     */
    openSavedFile(filePath, format) {
        const self = this;
        if (format === 'excel') {
            // This will not open in VSCode as it's treated as binary. Use the native file opener instead
            // Note: must use filePath here, URI does not open correctly
            opener(filePath, undefined, (error, stdout, stderr) => {
                if (error) {
                    self._vscodeWrapper.showErrorMessage(error);
                }
            });
        }
        else {
            let uri = vscode.Uri.file(filePath);
            self._vscodeWrapper.openTextDocument(uri).then((doc) => {
                // Show open document and set focus
                self._vscodeWrapper.showTextDocument(doc, {
                    viewColumn: vscode.ViewColumn.One,
                    preserveFocus: false,
                    preview: false
                }).then(undefined, (error) => {
                    self._vscodeWrapper.showErrorMessage(error);
                });
            }, (error) => {
                self._vscodeWrapper.showErrorMessage(error);
            });
        }
    }
}
exports.default = ResultsSerializer;

//# sourceMappingURL=resultsSerializer.js.map
