"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ACRTreeItem extends vscode_1.TreeItem {
    constructor(node, contextValue) {
        super(`${node.name}`);
        this.node = node;
        this.contextValue = contextValue;
    }
}
exports.ACRTreeItem = ACRTreeItem;
//# sourceMappingURL=ACRTreeItem.js.map