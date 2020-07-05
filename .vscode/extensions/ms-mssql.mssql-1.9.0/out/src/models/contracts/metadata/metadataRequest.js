"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
class MetadataQueryParams {
}
exports.MetadataQueryParams = MetadataQueryParams;
var MetadataType;
(function (MetadataType) {
    MetadataType[MetadataType["Table"] = 0] = "Table";
    MetadataType[MetadataType["View"] = 1] = "View";
    MetadataType[MetadataType["SProc"] = 2] = "SProc";
    MetadataType[MetadataType["Function"] = 3] = "Function";
})(MetadataType = exports.MetadataType || (exports.MetadataType = {}));
class MetadataQueryResult {
}
exports.MetadataQueryResult = MetadataQueryResult;
// ------------------------------- < Metadata Events > ------------------------------------
var MetadataQueryRequest;
(function (MetadataQueryRequest) {
    MetadataQueryRequest.type = new vscode_languageclient_1.RequestType('metadata/list');
})(MetadataQueryRequest = exports.MetadataQueryRequest || (exports.MetadataQueryRequest = {}));

//# sourceMappingURL=metadataRequest.js.map
