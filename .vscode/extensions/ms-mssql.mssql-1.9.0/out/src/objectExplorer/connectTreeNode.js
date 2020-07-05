"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const LocalizedConstants = require("../constants/localizedConstants");
const Constants = require("../constants/constants");
class ConnectTreeNode extends vscode.TreeItem {
    constructor(_parentNode) {
        super(LocalizedConstants.msgConnect, vscode.TreeItemCollapsibleState.None);
        this._parentNode = _parentNode;
        this.command = {
            title: LocalizedConstants.msgConnect,
            command: Constants.cmdConnectObjectExplorerNode,
            arguments: [this]
        };
    }
    get parentNode() {
        return this._parentNode;
    }
}
exports.ConnectTreeNode = ConnectTreeNode;

//# sourceMappingURL=connectTreeNode.js.map
