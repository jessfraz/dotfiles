"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const LocalizedConstants = require("../constants/localizedConstants");
const Constants = require("../constants/constants");
class AccountSignInTreeNode extends vscode.TreeItem {
    constructor(_parentNode) {
        super(LocalizedConstants.msgConnect, vscode.TreeItemCollapsibleState.None);
        this._parentNode = _parentNode;
        this.command = {
            title: LocalizedConstants.msgConnect,
            command: Constants.cmdObjectExplorerNodeSignIn,
            arguments: [this]
        };
    }
    get parentNode() {
        return this._parentNode;
    }
}
exports.AccountSignInTreeNode = AccountSignInTreeNode;

//# sourceMappingURL=accountSignInTreeNode.js.map
