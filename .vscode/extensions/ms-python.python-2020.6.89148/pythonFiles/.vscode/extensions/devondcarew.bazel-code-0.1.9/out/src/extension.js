'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const which = require("which");
const MISSING_BUILDIFIER_MESSAGE = 'Bazel buildifier was not found; install it or set the "bazel.buildifierPath" setting to use the formatter.';
function activate(context) {
    vscode.languages.registerDocumentFormattingEditProvider('bazel', {
        provideDocumentFormattingEdits(document, options, token) {
            return new Promise((resolve, reject) => {
                document.save().then(() => {
                    let buildifierPath = vscode.workspace.getConfiguration('bazel')['buildifierPath'];
                    if (!buildifierPath) {
                        try {
                            buildifierPath = which.sync('buildifier');
                        }
                        catch (err) { }
                    }
                    if (!buildifierPath) {
                        vscode.window.showInformationMessage(MISSING_BUILDIFIER_MESSAGE);
                        return reject(MISSING_BUILDIFIER_MESSAGE);
                    }
                    cp.execFile(buildifierPath, ["-mode=fix", document.fileName], {}, (err, stdout, stderr) => {
                        if (err && err.code == 'ENOENT') {
                            vscode.window.showInformationMessage(`buildifier path is incorrect: '${buildifierPath}'`);
                            return reject('buildifier path is incorrect.');
                        }
                        if (err) {
                            return reject("Can not format due to syntax errors.");
                        }
                        return resolve(null);
                    });
                });
            });
        }
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map