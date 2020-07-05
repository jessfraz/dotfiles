"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const vscode = require("vscode");
class Executor {
    static runInTerminal(command, addNewLine = true, terminal = "Docker Explorer") {
        if (this.terminals[terminal] === undefined) {
            this.terminals[terminal] = vscode.window.createTerminal(terminal);
        }
        this.terminals[terminal].show();
        this.terminals[terminal].sendText(command, addNewLine);
    }
    static exec(command) {
        return child_process_1.exec(command);
    }
    static execSync(command) {
        return child_process_1.execSync(command, { encoding: "utf8" });
    }
    static onDidCloseTerminal(closedTerminal) {
        delete this.terminals[closedTerminal.name];
    }
}
Executor.terminals = {};
exports.Executor = Executor;
//# sourceMappingURL=executor.js.map