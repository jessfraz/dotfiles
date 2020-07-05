"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cli = require("./cli");
const logging_1 = require("./logging");
/**
 * Managing the language server for CodeQL.
 */
/** Starts a new CodeQL language server process, sending progress messages to the status bar. */
async function spawnIdeServer(config) {
    return vscode_1.window.withProgress({ title: 'CodeQL language server', location: vscode_1.ProgressLocation.Window }, async (progressReporter, _) => {
        const child = cli.spawnServer(config.codeQlPath, 'CodeQL language server', ['execute', 'language-server'], ['--check-errors', 'ON_CHANGE'], logging_1.ideServerLogger, data => logging_1.ideServerLogger.log(data.toString(), { trailingNewline: false }), data => logging_1.ideServerLogger.log(data.toString(), { trailingNewline: false }), progressReporter);
        return { writer: child.stdin, reader: child.stdout };
    });
}
exports.spawnIdeServer = spawnIdeServer;

//# sourceMappingURL=ide-server.js.map
