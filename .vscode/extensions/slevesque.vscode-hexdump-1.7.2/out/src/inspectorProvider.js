'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var hexdump = require('hexy');
class HexInspectorContentProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        if (HexInspectorContentProvider.s_instance) {
            HexInspectorContentProvider.s_instance.dispose();
        }
        HexInspectorContentProvider.s_instance = this;
    }
    static get instance() {
        return HexInspectorContentProvider.s_instance;
    }
    dispose() {
        this._onDidChange.dispose();
        if (HexInspectorContentProvider.s_instance) {
            HexInspectorContentProvider.s_instance.dispose();
            HexInspectorContentProvider.s_instance = null;
        }
    }
    provideTextDocumentContent(uri) {
    }
}
HexInspectorContentProvider.s_instance = null;
exports.default = HexInspectorContentProvider;
//# sourceMappingURL=inspectorProvider.js.map