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
const metadataRequest_1 = require("../models/contracts/metadata/metadataRequest");
class MetadataService {
    constructor(_connectionManager) {
        this._connectionManager = _connectionManager;
        this._client = this._connectionManager.client;
    }
    getMetadata(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            let metadataParams = {
                ownerUri: uri
            };
            let result = yield this._client.sendRequest(metadataRequest_1.MetadataQueryRequest.type, metadataParams);
            return result.metadata;
        });
    }
}
exports.MetadataService = MetadataService;

//# sourceMappingURL=metadataService.js.map
