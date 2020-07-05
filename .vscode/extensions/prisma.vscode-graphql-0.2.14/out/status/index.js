"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
var Status;
(function (Status) {
    Status[Status["INIT"] = 1] = "INIT";
    Status[Status["RUNNING"] = 2] = "RUNNING";
    Status[Status["ERROR"] = 3] = "ERROR";
})(Status || (Status = {}));
const statusBarText = "GraphQL";
const statusBarUIElements = {
    [Status.INIT]: {
        icon: "sync",
        color: "white",
        tooltip: "GraphQL language server is initializing"
    },
    [Status.RUNNING]: {
        icon: "plug",
        color: "white",
        tooltip: "GraphQL language server is running"
    },
    [Status.ERROR]: {
        icon: "stop",
        color: "red",
        tooltip: "GraphQL language server has stopped"
    }
};
const statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
exports.statusBarItem = statusBarItem;
let extensionStatus = Status.RUNNING;
let serverRunning = true; // TODO: See comment with client.onNotification("init".....
const statusBarActivationLanguageIds = [
    "graphql",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
];
function initStatusBar(statusBarItem, client, editor) {
    extensionStatus = Status.INIT;
    // TODO: Make graphql-language-service-server throw relevant
    // notifications. Currently, it does not throw "init" or "exit"
    // and status bar is hard coded to all greens.
    client.onNotification("init", params => {
        extensionStatus = Status.RUNNING;
        serverRunning = true;
        updateStatusBar(statusBarItem, editor);
    });
    client.onNotification("exit", params => {
        extensionStatus = Status.ERROR;
        serverRunning = false;
        updateStatusBar(statusBarItem, editor);
    });
    client.onDidChangeState(event => {
        if (event.newState === vscode_languageclient_1.State.Running) {
            extensionStatus = Status.RUNNING;
            serverRunning = true;
        }
        else {
            extensionStatus = Status.ERROR;
            client.info("The graphql server has stopped running");
            serverRunning = false;
        }
        updateStatusBar(statusBarItem, editor);
    });
    updateStatusBar(statusBarItem, editor);
    vscode_1.window.onDidChangeActiveTextEditor((editor) => {
        // update the status if the server is running
        updateStatusBar(statusBarItem, editor);
    });
}
exports.initStatusBar = initStatusBar;
function updateStatusBar(statusBarItem, editor) {
    extensionStatus = serverRunning ? Status.RUNNING : Status.ERROR;
    const statusUI = statusBarUIElements[extensionStatus];
    statusBarItem.text = `$(${statusUI.icon}) ${statusBarText}`;
    statusBarItem.tooltip = statusUI.tooltip;
    statusBarItem.command = "extension.isDebugging";
    statusBarItem.color = statusUI.color;
    if (editor &&
        statusBarActivationLanguageIds.indexOf(editor.document.languageId) > -1) {
        statusBarItem.show();
    }
    else {
        statusBarItem.hide();
    }
}
exports.updateStatusBar = updateStatusBar;
exports.default = statusBarItem;
//# sourceMappingURL=index.js.map