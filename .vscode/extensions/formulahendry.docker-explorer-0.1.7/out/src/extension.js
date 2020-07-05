"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appInsightsClient_1 = require("./appInsightsClient");
const azureContainerRegistries_1 = require("./azureContainerRegistries");
const dockerContainers_1 = require("./dockerContainers");
const dockerHubTreeDataProvider_1 = require("./dockerHubTreeDataProvider");
const dockerImages_1 = require("./dockerImages");
const executor_1 = require("./executor");
const suggestedDockerImages_1 = require("./suggestedDockerImages");
function activate(context) {
    const dockerContainers = new dockerContainers_1.DockerContainers(context);
    vscode.window.registerTreeDataProvider("dockerExplorerContainers", dockerContainers);
    const dockerImages = new dockerImages_1.DockerImages(context);
    vscode.window.registerTreeDataProvider("dockerExplorerImages", dockerImages);
    const azureContainerRegistries = new azureContainerRegistries_1.AzureContainerRegistries(context);
    vscode.window.registerTreeDataProvider("azureRegistries", azureContainerRegistries);
    const suggestedDockerImages = new suggestedDockerImages_1.SuggestedDockerImages(context);
    vscode.window.registerTreeDataProvider("suggestedDockerImages", suggestedDockerImages);
    const dockerHubTreeDataProvider = new dockerHubTreeDataProvider_1.DockerHubTreeDataProvider(context);
    vscode.window.registerTreeDataProvider("DockerHubTreeView", dockerHubTreeDataProvider);
    appInsightsClient_1.AppInsightsClient.sendEvent("loadExtension");
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerContainers", () => {
        dockerContainers.refreshDockerTree();
        appInsightsClient_1.AppInsightsClient.sendEvent("refreshDockerContainers");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.searchContainer", () => {
        dockerContainers.searchContainer();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.getContainer", (containerName) => {
        dockerContainers.getContainer(containerName);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.startContainer", (container) => {
        dockerContainers.startContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.attachContainer", (container) => {
        dockerContainers.attachContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.stopContainer", (container) => {
        dockerContainers.stopContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.restartContainer", (container) => {
        dockerContainers.restartContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.showContainerStatistics", (container) => {
        dockerContainers.showContainerStatistics(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.showContainerLogs", (container) => {
        dockerContainers.showContainerLogs(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.inspectContainer", (container) => {
        dockerContainers.inspectContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.removeContainer", (container) => {
        dockerContainers.removeContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.executeCommandInContainer", (container) => {
        dockerContainers.executeCommandInContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.executeInBashInContainer", (container) => {
        dockerContainers.executeInBashInContainer(container.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerImages", () => {
        dockerImages.refreshDockerTree();
        appInsightsClient_1.AppInsightsClient.sendEvent("refreshDockerImages");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.getImage", (repository, tag) => {
        dockerImages.getImage(repository, tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.runFromImage", (image) => {
        dockerImages.runFromImage(image.repository, image.tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.inspectImage", (image) => {
        dockerImages.inspectImage(image.repository, image.tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.removeImage", (image) => {
        dockerImages.removeImage(image.repository, image.tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pushImage", (image) => {
        dockerImages.pushImage(image.repository, image.tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pushImageToACR", (image) => {
        dockerImages.pushImageToACR(image.repository, image.tag);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerHub", () => {
        dockerHubTreeDataProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.loginDockerHub", () => {
        dockerHubTreeDataProvider.login();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.logoutDockerHub", () => {
        dockerHubTreeDataProvider.logout();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullFromDockerHub", (element) => {
        dockerHubTreeDataProvider.pullFromHub(element.parent, element.name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullLatestFromDockerHub", (repo) => {
        suggestedDockerImages.pullFromHub(repo.user, repo.repository);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.openDockerHubPage", (repo) => {
        appInsightsClient_1.AppInsightsClient.sendEvent("openDockerHubPage");
        let urlPrefix = "https://hub.docker.com/r/";
        if (repo.parent == null) {
            // when the context menu is invoked in "Suggested Docker Hub images" tree, repo.parent is null
            if (repo.user == null) {
                // when the context menu is invoked on an official image, repo.user is null
                urlPrefix = "https://hub.docker.com/_/";
            }
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${urlPrefix + repo.label}`));
        }
        else {
            // when the context menu is invoked in "Docker Hub images" tree, repo.parent is {user}/{image}
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${urlPrefix + repo.parent}`));
        }
    }));
    context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal) => {
        executor_1.Executor.onDidCloseTerminal(closedTerminal);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullImage", (tagItem) => {
        azureContainerRegistries.pullImage(tagItem.node.name, tagItem.node.parent.name, tagItem.node.parent.parent.name);
        appInsightsClient_1.AppInsightsClient.sendEvent("pullImageFromACR");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.deployToAzure", (tagItem) => {
        azureContainerRegistries.deployToAzure(tagItem.node.name, tagItem.node.parent.name, tagItem.node.parent.parent.name);
        appInsightsClient_1.AppInsightsClient.sendEvent("deployToAzure");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.loginAzureCli", () => {
        azureContainerRegistries.login();
        appInsightsClient_1.AppInsightsClient.sendEvent("loginAzureCli");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.logoutAzureCli", () => {
        azureContainerRegistries.logout();
        appInsightsClient_1.AppInsightsClient.sendEvent("logoutAzureCli");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshAzureRegistries", () => {
        azureContainerRegistries.refreshDockerTree();
        appInsightsClient_1.AppInsightsClient.sendEvent("refreshAzureRegistry");
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        suggestedDockerImages._onDidChangeTreeData.fire();
    }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map