"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utility_1 = require("./utility");
class DockerTreeBase {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refreshDockerTree() {
        DockerTreeBase.isErrorMessageShown = false;
        this._onDidChangeTreeData.fire();
    }
    setAutoRefresh(cachedItemStrings, getItemStringsCallback) {
        const interval = utility_1.Utility.getConfiguration().get("autoRefreshInterval");
        if (interval > 0) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setInterval(() => {
                try {
                    const itemStrings = getItemStringsCallback();
                    if (!utility_1.Utility.isArrayEqual(itemStrings, cachedItemStrings)) {
                        this._onDidChangeTreeData.fire();
                    }
                }
                catch (e) { }
            }, interval);
        }
    }
}
DockerTreeBase.isErrorMessageShown = false;
exports.DockerTreeBase = DockerTreeBase;
//# sourceMappingURL=dockerTreeBase.js.map