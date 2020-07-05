"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DockerHubRepo extends vscode_1.TreeItem {
    constructor(user, repository, iconPath) {
        // if the repo is official, user is null
        super(user == null ? `${repository}` : `${user}/${repository}`);
        this.user = user;
        this.repository = repository;
        this.iconPath = iconPath;
    }
}
exports.DockerHubRepo = DockerHubRepo;
//# sourceMappingURL=DockerHubRepo.js.map