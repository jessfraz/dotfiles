"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Config_1 = require("./Config");
function setOrChangeWorkspace() {
    const { workspaceFolders } = vscode_1.workspace;
    const workspaceNames = workspaceFolders.map(e => e.name);
    return vscode_1.window.showQuickPick(workspaceNames, {
        placeHolder: 'choose workspace for Live Server',
        ignoreFocusOut: true
    }).then(workspaceName => {
        if (workspaceName) {
            return Config_1.Config.setMutiRootWorkspaceName(workspaceName).then(() => workspaceName);
        }
    });
}
exports.setOrChangeWorkspace = setOrChangeWorkspace;
function workspaceResolver(fileUri) {
    return new Promise(resolve => {
        const { workspaceFolders } = vscode_1.workspace;
        const workspaceNames = workspaceFolders.map(e => e.name);
        // If only one workspace. No need to check anything.
        if (workspaceNames.length === 1) {
            return resolve(workspaceFolders[0].uri.fsPath);
        }
        // if fileUri is set. Means, user tried to open server by right clicking to a HTML file.
        if (fileUri) {
            const selectedWorkspace = workspaceFolders.find(ws => fileUri.startsWith(ws.uri.fsPath));
            if (selectedWorkspace) {
                return Config_1.Config.setMutiRootWorkspaceName(selectedWorkspace.name)
                    .then(() => resolve(selectedWorkspace.uri.fsPath));
            }
        }
        // If workspace already set by User
        if (Config_1.Config.getMutiRootWorkspaceName) {
            // A small test that the WorkspaceName (set by user) is valid
            const targetWorkspace = workspaceFolders.find(e => e.name === Config_1.Config.getMutiRootWorkspaceName);
            if (targetWorkspace)
                return resolve(targetWorkspace.uri.fsPath);
            // reset whatever user is set.
            Config_1.Config.setMutiRootWorkspaceName(null);
        }
        // Show a quick picker
        setOrChangeWorkspace()
            .then(workspaceName => {
            const workspaceUri = workspaceFolders.find(e => e.name === workspaceName).uri.fsPath;
            return resolve(workspaceUri);
        });
    });
}
exports.workspaceResolver = workspaceResolver;
//# sourceMappingURL=workspaceResolver.js.map