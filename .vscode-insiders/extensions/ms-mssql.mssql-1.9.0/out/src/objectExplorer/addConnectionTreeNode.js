"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const path = require("path");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const objectExplorerUtils_1 = require("./objectExplorerUtils");
class AddConnectionTreeNode extends vscode.TreeItem {
    constructor() {
        super(LocalizedConstants.msgAddConnection, vscode.TreeItemCollapsibleState.None);
        this.command = {
            title: LocalizedConstants.msgAddConnection,
            command: Constants.cmdAddObjectExplorer
        };
        this.iconPath = {
            light: path.join(objectExplorerUtils_1.ObjectExplorerUtils.rootPath, 'add.svg'),
            dark: path.join(objectExplorerUtils_1.ObjectExplorerUtils.rootPath, 'add_inverse.svg')
        };
    }
}
exports.AddConnectionTreeNode = AddConnectionTreeNode;

//# sourceMappingURL=addConnectionTreeNode.js.map
