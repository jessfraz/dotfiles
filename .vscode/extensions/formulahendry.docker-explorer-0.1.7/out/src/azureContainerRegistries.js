"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dockerTreeBase_1 = require("./dockerTreeBase");
const executor_1 = require("./executor");
const ACRHierachy_1 = require("./Model/ACRHierachy");
const ACRNode_1 = require("./Model/ACRNode");
const ACRTreeItem_1 = require("./Model/ACRTreeItem");
class AzureContainerRegistries extends dockerTreeBase_1.DockerTreeBase {
    constructor(context) {
        super(context);
    }
    login() {
        executor_1.Executor.runInTerminal(`docker run -it --name azure-cli azuresdk/azure-cli-python`, true, "Azure CLI");
        executor_1.Executor.runInTerminal(`docker exec azure-cli az login`, true, "Azure CLI");
    }
    logout() {
        executor_1.Executor.runInTerminal(`docker exec azure-cli az logout`, true, "Azure CLI");
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            // root
            const ret = [];
            let regs = [];
            ACRHierachy_1.ACRHierachy.root.children.length = 0;
            try {
                regs = JSON.parse(executor_1.Executor.execSync(`docker exec azure-cli az acr list`));
            }
            catch (error) {
                const item = new ACRTreeItem_1.ACRTreeItem(new ACRNode_1.ACRNode("Please Login first.", [], null, "root"), "root");
                ret.push(item);
            }
            for (const reg of regs) {
                const item = new ACRTreeItem_1.ACRTreeItem(new ACRNode_1.ACRNode(reg.name, [], ACRHierachy_1.ACRHierachy.root, "registry"), "registry");
                item.collapsibleState = 1;
                ACRHierachy_1.ACRHierachy.root.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        }
        else if (element.node.type === "registry") {
            const ret = [];
            const images = JSON.parse(executor_1.Executor.execSync(`docker exec azure-cli az acr repository list -n ${element.node.name}`));
            for (const imageName of images) {
                const item = new ACRTreeItem_1.ACRTreeItem(new ACRNode_1.ACRNode(imageName, [], element.node, "repository"), "repository");
                item.collapsibleState = 1;
                element.node.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        }
        else if (element.node.type === "repository") {
            const ret = [];
            const tags = JSON.parse(executor_1.Executor.execSync(`docker exec azure-cli az acr repository show-tags --name \
            ${element.node.parent.name} --repository ${element.node.name}`));
            for (const tag of tags) {
                const item = new ACRTreeItem_1.ACRTreeItem(new ACRNode_1.ACRNode(tag, [], element.node, "tag"), "tag");
                element.node.children.push(item.node);
                ret.push(item);
            }
            return Promise.resolve(ret);
        }
        else if (element.node.type === "tag") {
            return Promise.resolve(null);
        }
    }
    pullImage(tag, repository, registry) {
        if (tag && repository && registry) {
            const credential = executor_1.Executor.execSync(`docker exec azure-cli az acr credential show -n ${registry}`);
            const credentialObj = JSON.parse(credential);
            const password = credentialObj.passwords[0].value;
            const loginResult = executor_1.Executor.execSync(`docker login ${registry}.azurecr.io -u ${registry} -p ${password}`);
            if (loginResult.indexOf("Login Succeeded") >= 0) {
                executor_1.Executor.runInTerminal(`docker pull ${registry}.azurecr.io/${repository}:${tag}`);
            }
        }
    }
    deployToAzure(tag, repository, registry) {
        if (tag && repository && registry) {
            const timestamp = Date.now();
            const appName = `webapponlinux-${timestamp}`;
            const appServicePlan = `AppServiceLinuxDockerPlan${timestamp}`;
            const resourceGroup = `rg-webapp-${timestamp}`;
            const location = "WestUS";
            const serverUrl = `${registry}.azurecr.io`;
            const dockerContainerPath = `${serverUrl}/${repository}:${tag}`;
            const credential = executor_1.Executor.execSync(`az acr credential show -n ${registry}`);
            const credentialObj = JSON.parse(credential);
            const password = credentialObj.passwords[0].value;
            // Create a Resource Group
            executor_1.Executor.runInTerminal(`docker exec azure-cli az group create --name ${resourceGroup} --location ${location}`, true, "Azure CLI");
            // Create an App Service Plan
            executor_1.Executor.runInTerminal(`docker exec azure-cli az appservice plan create --name \
            ${appServicePlan} --resource-group ${resourceGroup} --location ${location} --is-linux --sku S1`, true, "Azure CLI");
            // Create a Web App
            executor_1.Executor.runInTerminal(`docker exec azure-cli az webapp create --name \
            ${appName} --plan ${appServicePlan} --resource-group ${resourceGroup}`, true, "Azure CLI");
            // Configure Web App with a Custom Docker Container from Docker Hub
            executor_1.Executor.runInTerminal(`docker exec azure-cli az webapp config container set --docker-custom-image-name \
            ${dockerContainerPath} --docker-registry-server-password ${password} --docker-registry-server-url \
            ${serverUrl} --docker-registry-server-user ${registry} --name ${appName} --resource-group ${resourceGroup}`, true, "Azure CLI");
            // Sync output Web URL
            executor_1.Executor.runInTerminal(`echo "Web App is deployed to http://${appName}.azurewebsites.net/"`, true, "Azure CLI");
        }
    }
}
exports.AzureContainerRegistries = AzureContainerRegistries;
//# sourceMappingURL=azureContainerRegistries.js.map