"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function activate(context) {
    let NEXT_TERM_ID = 1;
    let disposable = vscode.commands.registerCommand("extension.jbavsc.gen", () => {
        vscode.window.showInformationMessage("Generating your jBPM Business Application");
        const terminal = vscode.window.createTerminal(`jBA Terminal #${NEXT_TERM_ID++}`);
        terminal.show(true);
        terminal.sendText("npm install -g jba-cli");
        terminal.sendText("jba gen --quick");
        //   vscode.window.showInformationMessage(
        //     "Done...."
        //   );
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=old_extension.js.map