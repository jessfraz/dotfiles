"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
var ScriptOperation;
(function (ScriptOperation) {
    ScriptOperation[ScriptOperation["Select"] = 0] = "Select";
    ScriptOperation[ScriptOperation["Create"] = 1] = "Create";
    ScriptOperation[ScriptOperation["Insert"] = 2] = "Insert";
    ScriptOperation[ScriptOperation["Update"] = 3] = "Update";
    ScriptOperation[ScriptOperation["Delete"] = 4] = "Delete";
    ScriptOperation[ScriptOperation["Execute"] = 5] = "Execute";
    ScriptOperation[ScriptOperation["Alter"] = 6] = "Alter";
})(ScriptOperation = exports.ScriptOperation || (exports.ScriptOperation = {}));
// ------------------------------- < Scripting Request > ----------------------------------------------
var ScriptingRequest;
(function (ScriptingRequest) {
    /**
     * Returns children of a given node as a NodeInfo array.
     */
    ScriptingRequest.type = new vscode_jsonrpc_1.RequestType('scripting/script');
})(ScriptingRequest = exports.ScriptingRequest || (exports.ScriptingRequest = {}));

//# sourceMappingURL=scriptingRequest.js.map
