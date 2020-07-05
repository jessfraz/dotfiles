"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const discovery_1 = require("./discovery");
/**
 * Service to discover all available QL packs in a workspace folder.
 */
class QLPackDiscovery extends discovery_1.Discovery {
    constructor(workspaceFolder, cliServer) {
        super();
        this.workspaceFolder = workspaceFolder;
        this.cliServer = cliServer;
        this._onDidChangeQLPacks = this.push(new vscode_1.EventEmitter());
        this.watcher = this.push(new semmle_vscode_utils_1.MultiFileSystemWatcher());
        this._qlPacks = [];
        // Watch for any changes to `qlpack.yml` files in this workspace folder.
        // TODO: The CLI server should tell us what paths to watch for.
        this.watcher.addWatch(new vscode_1.RelativePattern(this.workspaceFolder, '**/qlpack.yml'));
        this.watcher.addWatch(new vscode_1.RelativePattern(this.workspaceFolder, '**/.codeqlmanifest.json'));
        this.push(this.watcher.onDidChange(this.handleQLPackFileChanged, this));
        this.refresh();
    }
    get onDidChangeQLPacks() { return this._onDidChangeQLPacks.event; }
    get qlPacks() { return this._qlPacks; }
    handleQLPackFileChanged(_uri) {
        this.refresh();
    }
    discover() {
        // Only look for QL packs in this workspace folder.
        return this.cliServer.resolveQlpacks([this.workspaceFolder.uri.fsPath], []);
    }
    update(results) {
        const qlPacks = [];
        for (const id in results) {
            qlPacks.push(...results[id].map(fsPath => {
                return {
                    name: id,
                    uri: vscode_1.Uri.file(fsPath)
                };
            }));
        }
        this._qlPacks = qlPacks;
        this._onDidChangeQLPacks.fire();
    }
}
exports.QLPackDiscovery = QLPackDiscovery;

//# sourceMappingURL=qlpack-discovery.js.map
