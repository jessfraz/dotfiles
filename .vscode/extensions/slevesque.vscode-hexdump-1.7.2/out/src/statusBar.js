'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
class HexdumpStatusBar {
    constructor() {
        this._disposables = [];
        if (HexdumpStatusBar.s_instance) {
            HexdumpStatusBar.s_instance.dispose();
        }
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        vscode.window.onDidChangeActiveTextEditor((e) => {
            if (e && e.document.languageId === 'hexdump') {
                this._statusBarItem.show();
            }
            else {
                this._statusBarItem.hide();
            }
        }, null, this._disposables);
        HexdumpStatusBar.s_instance = this;
    }
    static get instance() {
        return HexdumpStatusBar.s_instance;
    }
    dispose() {
        this._statusBarItem.dispose;
        if (HexdumpStatusBar.s_instance) {
            HexdumpStatusBar.s_instance.dispose();
            HexdumpStatusBar.s_instance = null;
        }
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
    get Item() {
        return this._statusBarItem;
    }
    update() {
        let littleEndian = vscode.workspace.getConfiguration('hexdump').get('littleEndian');
        this._statusBarItem.text = littleEndian ? 'hex' : 'HEX';
        this._statusBarItem.tooltip = littleEndian ? 'Little Endian' : 'Big Endian';
        let e = vscode.window.activeTextEditor;
        // check if hexdump document
        if (e && e.document.uri.scheme === 'hexdump') {
            if (util_1.getEntry(e.document.uri).isDirty) {
                this._statusBarItem.text += ' (modified)';
            }
        }
    }
}
HexdumpStatusBar.s_instance = null;
exports.default = HexdumpStatusBar;
//# sourceMappingURL=statusBar.js.map