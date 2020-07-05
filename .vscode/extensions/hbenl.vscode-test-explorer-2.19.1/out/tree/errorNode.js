"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorNode = void 0;
const vscode = require("vscode");
class ErrorNode {
    constructor(collection, id, errorMessage) {
        this.collection = collection;
        this.id = id;
        this.errorMessage = errorMessage;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem('Error while loading tests - click to show', vscode.TreeItemCollapsibleState.None);
        treeItem.id = this.id;
        treeItem.iconPath = this.collection.explorer.iconPaths.errored;
        treeItem.contextValue = 'error';
        treeItem.command = {
            title: '',
            command: 'test-explorer.show-error',
            arguments: [this.errorMessage]
        };
        return treeItem;
    }
    get children() { return []; }
}
exports.ErrorNode = ErrorNode;
//# sourceMappingURL=errorNode.js.map