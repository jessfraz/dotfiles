"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const appInsightsClient_1 = require("./appInsightsClient");
const dockerTreeBase_1 = require("./dockerTreeBase");
const executor_1 = require("./executor");
const DockerContainer_1 = require("./Model/DockerContainer");
const utility_1 = require("./utility");
class DockerContainers extends dockerTreeBase_1.DockerTreeBase {
    constructor(context) {
        super(context);
        this.cachedContainerStrings = [];
    }
    searchContainer() {
        appInsightsClient_1.AppInsightsClient.sendEvent("searchContainer");
        const interval = utility_1.Utility.getConfiguration().get("autoRefreshInterval");
        let containerStrings = [];
        if (interval > 0 && this.cachedContainerStrings.length > 0) {
            this.cachedContainerStrings.forEach((containerString) => {
                const items = containerString.split(" ");
                containerStrings.push(`${items[1]} (${items[2]})`);
            });
        }
        else {
            containerStrings = executor_1.Executor.execSync("docker ps -a --format \"{{.Names}} ({{.Image}})\"").split(/[\r\n]+/g).filter((item) => item);
        }
        vscode.window.showQuickPick(containerStrings, { placeHolder: "Search Docker Container" }).then((containerString) => {
            if (containerString !== undefined) {
                const items = containerString.split(" ");
                this.getContainer(items[0]);
            }
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        const containers = [];
        try {
            this.cachedContainerStrings = this.getContainerStrings();
            this.cachedContainerStrings.forEach((containerString) => {
                const items = containerString.split(" ");
                const image = items[3] === "Up" ? "container-on.png" : "container-off.png";
                containers.push(new DockerContainer_1.DockerContainer(items[0], items[1], items[2], this.context.asAbsolutePath(path.join("resources", image)), {
                    command: "docker-explorer.getContainer",
                    title: "",
                    arguments: [items[1]],
                }));
            });
        }
        catch (error) {
            if (!dockerTreeBase_1.DockerTreeBase.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Containers] ${error.stderr}`);
                dockerTreeBase_1.DockerTreeBase.isErrorMessageShown = true;
            }
        }
        finally {
            this.setAutoRefresh(this.cachedContainerStrings, this.getContainerStrings);
        }
        return Promise.resolve(containers);
    }
    getContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker ps -a --filter "name=${containerName}"`);
        appInsightsClient_1.AppInsightsClient.sendEvent("getContainer");
    }
    startContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker start ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("startContainer");
    }
    attachContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker attach ${containerName}`, true, `attach ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("attachContainer");
    }
    stopContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker stop ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("stopContainer");
    }
    restartContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker restart ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("restartContainer");
    }
    showContainerStatistics(containerName) {
        executor_1.Executor.runInTerminal(`docker stats ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("showContainerStatistics");
    }
    showContainerLogs(containerName) {
        const containerLogsOptions = utility_1.Utility.getConfiguration().get("containerLogsOptions");
        executor_1.Executor.runInTerminal(`docker logs ${containerName} ${containerLogsOptions}`, true, `logs ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("showContainerLogs");
    }
    inspectContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker inspect ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("inspectContainer");
    }
    removeContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker rm ${containerName}`);
        appInsightsClient_1.AppInsightsClient.sendEvent("removeContainer");
    }
    executeCommandInContainer(containerName) {
        const command = utility_1.Utility.getConfiguration().get("executionCommand");
        if (command) {
            executor_1.Executor.runInTerminal(`docker exec ${containerName} ${command}`);
        }
        else {
            executor_1.Executor.runInTerminal(`docker exec ${containerName} `, false);
        }
        appInsightsClient_1.AppInsightsClient.sendEvent("executeCommandInContainer", command ? { executionCommand: command } : {});
    }
    executeInBashInContainer(containerName) {
        executor_1.Executor.runInTerminal(`docker exec -it ${containerName} bash`, true, containerName);
        appInsightsClient_1.AppInsightsClient.sendEvent("executeInBashInContainer");
    }
    getContainerStrings() {
        return executor_1.Executor.execSync("docker ps -a --format \"{{.ID}} {{.Names}} {{.Image}} {{.Status}}\"")
            .split(/[\r\n]+/g).filter((item) => item);
    }
}
exports.DockerContainers = DockerContainers;
//# sourceMappingURL=dockerContainers.js.map