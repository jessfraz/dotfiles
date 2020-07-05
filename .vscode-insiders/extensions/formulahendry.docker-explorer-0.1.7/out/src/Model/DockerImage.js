"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DockerImage extends vscode_1.TreeItem {
    constructor(id, repository, tag, iconPath, command) {
        super(`${repository}:${tag}`);
        this.id = id;
        this.repository = repository;
        this.tag = tag;
        this.iconPath = iconPath;
        this.command = command;
    }
}
exports.DockerImage = DockerImage;
//# sourceMappingURL=DockerImage.js.map