"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const appInsightsClient_1 = require("./appInsightsClient");
const dockerTreeBase_1 = require("./dockerTreeBase");
const executor_1 = require("./executor");
const DockerHubRepo_1 = require("./Model/DockerHubRepo");
class SuggestedDockerImages extends dockerTreeBase_1.DockerTreeBase {
    constructor(context) {
        super(context);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (vscode.window.activeTextEditor) {
            const document = vscode.window.activeTextEditor.document;
            if (document && document.languageId !== "plaintext") {
                const images = this.suggestImage(document.languageId, document.fileName);
                return Promise.resolve(images);
            }
        }
    }
    suggestImage(languageId, fileName) {
        const images = [];
        try {
            const searchQuery = this.getSearchQuery(languageId, fileName);
            let imageStrings = executor_1.Executor.execSync(`docker search ${searchQuery} --limit 5`)
                .split(/[\r\n]+/g);
            imageStrings = imageStrings.slice(1, imageStrings.length - 1);
            imageStrings.forEach((imageString) => {
                const repoName = imageString.split(" ")[0];
                let user;
                let repository;
                // Unofficial repos (such as "kaggle/python") have a "/" in their name separating user and repository,
                // while official ones (such as "python") don't.
                if (repoName.indexOf("/") >= 0) {
                    user = repoName.split("/")[0];
                    repository = repoName.split("/")[1];
                }
                else {
                    user = null;
                    repository = repoName;
                }
                images.push(new DockerHubRepo_1.DockerHubRepo(user, repository, this.context.asAbsolutePath(path.join("resources", "image.png"))));
            });
        }
        catch (error) {
            if (!dockerTreeBase_1.DockerTreeBase.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Images] ${error.stderr}`);
                dockerTreeBase_1.DockerTreeBase.isErrorMessageShown = true;
            }
        }
        return images;
    }
    pullFromHub(user, repository) {
        executor_1.Executor.runInTerminal(`docker pull ${user == null ? repository : user + "/" + repository}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("pullSuggestedImageFromHub");
    }
    getSearchQuery(languageId, fileName) {
        switch (languageId) {
            case "csharp": {
            }
            case "fsharp": {
            }
            case "vb": {
                return `\"${languageId} dotnet\"`;
            }
        }
        return languageId;
    }
}
exports.SuggestedDockerImages = SuggestedDockerImages;
//# sourceMappingURL=suggestedDockerImages.js.map