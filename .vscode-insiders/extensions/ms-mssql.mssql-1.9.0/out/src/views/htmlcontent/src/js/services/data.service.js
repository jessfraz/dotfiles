"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const Subject_1 = require("rxjs/Subject");
const core_1 = require("@angular/core");
const Constants = require("./../constants");
const protocol_1 = require("../../../../../protocol");
exports.vscodeApi = acquireVsCodeApi();
function createMessageProtocol() {
    return {
        onMessage: listener => {
            const windowListener = (event) => {
                const message = event.data;
                listener(message);
            };
            window.addEventListener('message', windowListener);
            return {
                dispose: () => window.removeEventListener('message', windowListener)
            };
        },
        sendMessage: message => exports.vscodeApi.postMessage(message)
    };
}
/**
 * Service which performs the http requests to get the data resultsets from the server.
 */
let DataService = class DataService {
    constructor() {
        this.dataEventObs = new Subject_1.Subject();
        this._proxy = protocol_1.createProxy(createMessageProtocol(), {
            sendEvent: (type, args) => this.sendEvent(type, args),
            dispose: () => void (0)
        }, true);
        this.getLocalizedTextsRequest().then(result => {
            Object.keys(result).forEach(key => {
                Constants.loadLocalizedConstant(key, result[key]);
            });
        });
    }
    ngOnDestroy() {
        this.dataEventObs.dispose();
        this._proxy.dispose();
    }
    sendEvent(type, arg) {
        this.dataEventObs.next({ type, data: arg });
    }
    /**
     * Get a specified number of rows starting at a specified row for
     * the current results set
     * @param start The starting row or the requested rows
     * @param numberOfRows The amount of rows to return
     * @param batchId The batch id of the batch you are querying
     * @param resultId The id of the result you want to get the rows for
     */
    getRows(start, numberOfRows, batchId, resultId) {
        return this._proxy.getRows(batchId, resultId, start, numberOfRows);
    }
    /**
     * send request to save the selected result set as csv, json or excel
     * @param batchIndex The batch id of the batch with the result to save
     * @param resultSetNumber The id of the result to save
     * @param format The format to save in - csv, json, excel
     * @param selection The range inside the result set to save, or empty if all results should be saved
     */
    sendSaveRequest(batchIndex, resultSetNumber, format, selection) {
        this._proxy.saveResults(batchIndex, resultSetNumber, format, selection);
    }
    /**
     * send ready event to server to show that
     * the angular app has loaded
     */
    sendReadyEvent(uri) {
        this._proxy.sendReadyEvent(uri);
    }
    /**
     * send request to get all the localized texts
     */
    getLocalizedTextsRequest() {
        return this._proxy.getLocalizedTexts();
    }
    /**
     * send request to open content in new editor
     * @param content The content to be opened
     * @param columnName The column name of the content
     */
    openLink(content, columnName, linkType) {
        this._proxy.openLink(content, columnName, linkType);
    }
    /**
     * Sends a copy request
     * @param selection The selection range to copy
     * @param batchId The batch id of the result to copy from
     * @param resultId The result id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection, batchId, resultId, includeHeaders) {
        this._proxy.copyResults(batchId, resultId, selection, includeHeaders);
    }
    /**
     * Sends a request to set the selection in the VScode window
     * @param selection The selection range in the VSCode Window
     */
    setEditorSelection(selection) {
        this._proxy.setEditorSelection(selection);
    }
    showWarning(message) {
        this._proxy.showWarning(message);
    }
    showError(message) {
        this._proxy.showError(message);
    }
    get config() {
        const self = this;
        if (this._config) {
            return Promise.resolve(this._config);
        }
        else {
            return this._proxy.getConfig().then(config => {
                self._shortcuts = config.shortcuts;
                delete config.shortcuts;
                self._config = config;
                return self._config;
            });
        }
    }
    get shortcuts() {
        const self = this;
        if (this._shortcuts) {
            return Promise.resolve(this._shortcuts);
        }
        else {
            return this._proxy.getConfig().then(config => {
                self._shortcuts = config.shortcuts;
                delete config.shortcuts;
                self._config = config;
                return self._shortcuts;
            });
        }
    }
};
DataService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], DataService);
exports.DataService = DataService;

//# sourceMappingURL=data.service.js.map
