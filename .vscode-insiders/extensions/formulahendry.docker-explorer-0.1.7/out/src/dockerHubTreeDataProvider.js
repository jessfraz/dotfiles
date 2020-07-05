"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const appInsightsClient_1 = require("./appInsightsClient");
const DockerHubManager_1 = require("./DockerHub/DockerHubManager");
const dockerTreeBase_1 = require("./dockerTreeBase");
const executor_1 = require("./executor");
class DockerHubTreeDataProvider extends dockerTreeBase_1.DockerTreeBase {
    constructor(context) {
        super(context);
    }
    getTreeItem(element) {
        const item = {
            label: element.name,
            collapsibleState: element.isImage ? void 0 : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isImage ? "image" : "repo",
            iconPath: this.context.asAbsolutePath(path.join("resources", "image.png")),
        };
        return item;
    }
    getChildren(element) {
        if (!element) {
            return DockerHubManager_1.DockerHubManager.Instance.listRepositories();
        }
        return DockerHubManager_1.DockerHubManager.Instance.getTagsForRepo(element);
    }
    login() {
        let user = "";
        let pwd = "";
        this.getUserCredential()
            .then((credential) => {
            user = credential[0];
            pwd = credential[1];
            return DockerHubManager_1.DockerHubManager.Instance.login(user, pwd);
        })
            .then(() => {
            executor_1.Executor.exec(`docker login -u ${user} -p ${pwd}`);
            return this._onDidChangeTreeData.fire();
        })
            .catch((error) => {
            vscode.window.showErrorMessage(error);
        });
        appInsightsClient_1.AppInsightsClient.sendEvent("loginDockerHub");
    }
    logout() {
        DockerHubManager_1.DockerHubManager.Instance.logout();
        this._onDidChangeTreeData.fire();
        appInsightsClient_1.AppInsightsClient.sendEvent("logoutDockerHub");
    }
    refresh() {
        this._onDidChangeTreeData.fire();
        appInsightsClient_1.AppInsightsClient.sendEvent("refreshDockerHub");
    }
    pullFromHub(repo, tag) {
        executor_1.Executor.runInTerminal(`docker pull ${repo}:${tag}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("pullFromHub");
    }
    getUserCredential() {
        const userAndPassword = [];
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox({ prompt: "Enter user name." })
                .then((val) => {
                if (!val || val.trim().length === 0) {
                    reject("Invalid user name.");
                    return;
                }
                userAndPassword.push(val);
                return vscode.window.showInputBox({
                    prompt: "Enter password.",
                    password: true,
                    placeHolder: "Password",
                });
            })
                .then((val) => {
                if (!val || val.trim().length === 0) {
                    return reject("Invalid password.");
                }
                userAndPassword.push(val);
                return resolve(userAndPassword);
            });
        });
    }
}
exports.DockerHubTreeDataProvider = DockerHubTreeDataProvider;
//# sourceMappingURL=dockerHubTreeDataProvider.js.map