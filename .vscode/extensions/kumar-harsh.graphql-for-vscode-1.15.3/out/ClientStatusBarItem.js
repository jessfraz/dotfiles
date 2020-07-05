'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
var Status;
(function (Status) {
    Status[Status["init"] = 1] = "init";
    Status[Status["ok"] = 2] = "ok";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
const STATUS_BAR_ITEM_NAME = 'GQL';
const STATUS_BAR_UI = {
    [Status.init]: {
        icon: 'sync',
        color: 'progressBar.background',
        tooltip: 'Graphql language server is initializing.',
    },
    [Status.ok]: {
        icon: 'plug',
        color: 'statusBar.foreground',
        tooltip: 'Graphql language server is running.',
    },
    [Status.error]: {
        icon: 'stop',
        color: 'editorError.foreground',
        tooltip: 'Graphql language server is not running.',
    },
};
class ClientStatusBarItem {
    constructor(client, canUseRelativePattern) {
        this._disposables = [];
        this._updateVisibility = (textEditor) => {
            let hide = true;
            if (textEditor) {
                const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(textEditor.document.uri);
                if (this._client.initializeResult && workspaceFolder) {
                    // if client is initialized then show only for file extensions
                    // defined in .gqlconfig
                    // @TODO: if possible, match against patterns defined in .gqlconfig
                    // instead of extensions.
                    const extensions = this._client.initializeResult.fileExtensions;
                    const pattern = `**/*.{${extensions.join(',')}}`;
                    const score = vscode_1.languages.match({
                        scheme: 'file',
                        pattern: this._canUseRelativePattern
                            ? new vscode_1.RelativePattern(workspaceFolder, pattern)
                            : pattern,
                    }, textEditor.document);
                    hide = score === 0;
                }
                else {
                    // while server is initializing show status bar item
                    // for all files inside worspace
                    hide = false;
                }
            }
            hide ? this._hide() : this._show();
        };
        this._item = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
        this._client = client;
        this._canUseRelativePattern = canUseRelativePattern;
        this._disposables.push(this._item);
        this._disposables.push(this._addOnClickToShowOutputChannel());
        // update status bar depending on client state
        this._setStatus(Status.init);
        this._registerStatusChangeListeners();
        // update visibility of statusBarItem depending on current activeTextEditor
        this._updateVisibility(vscode_1.window.activeTextEditor);
        vscode_1.window.onDidChangeActiveTextEditor(this._updateVisibility);
    }
    dispose() {
        this._disposables.forEach(item => {
            item.dispose();
        });
    }
    _registerStatusChangeListeners() {
        this._client.onDidChangeState(({ oldState, newState }) => {
            if (newState === vscode_languageclient_1.State.Running) {
                this._setStatus(Status.ok);
            }
            else if (newState === vscode_languageclient_1.State.Stopped) {
                this._setStatus(Status.error);
            }
        });
        this._client.onReady().then(() => {
            this._setStatus(Status.ok);
        }, () => {
            this._setStatus(Status.error);
        });
    }
    _addOnClickToShowOutputChannel() {
        const commandName = `showOutputChannel-${this._client.outputChannel.name}`;
        const disposable = vscode_1.commands.registerCommand(commandName, () => {
            this._client.outputChannel.show();
        });
        this._item.command = commandName;
        return disposable;
    }
    _show() {
        this._item.show();
    }
    _hide() {
        this._item.hide();
    }
    _setStatus(status) {
        const ui = STATUS_BAR_UI[status];
        this._item.text = `$(${ui.icon}) ${STATUS_BAR_ITEM_NAME}`;
        this._item.tooltip = ui.tooltip;
        this._item.color = new vscode_1.ThemeColor(ui.color);
    }
}
exports.default = ClientStatusBarItem;
//# sourceMappingURL=ClientStatusBarItem.js.map