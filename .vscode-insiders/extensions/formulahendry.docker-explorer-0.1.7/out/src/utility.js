"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Utility {
    static getConfiguration() {
        return vscode.workspace.getConfiguration("docker-explorer");
    }
    static isArrayEqual(a, b) {
        return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
    }
}
exports.Utility = Utility;
//# sourceMappingURL=utility.js.map