"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DockerHubNode extends vscode_1.TreeItem {
    constructor(_entry, _parent) {
        super(_entry.name);
        this._entry = _entry;
        this._parent = _parent;
    }
    get parent() {
        return this._parent;
    }
    get path() {
        return vscode_1.Uri.parse(`${this._parent}/${this.name}`).toString();
    }
    get name() {
        return this._entry.name;
    }
    get isImage() {
        return this._entry.type === "i";
    }
}
exports.DockerHubNode = DockerHubNode;
//# sourceMappingURL=DockerHubNode.js.map