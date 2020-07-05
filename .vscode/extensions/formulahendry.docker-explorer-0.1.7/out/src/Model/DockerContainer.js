"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DockerContainer extends vscode_1.TreeItem {
    constructor(id, name, image, iconPath, command) {
        super(`${name} (${image})`);
        this.id = id;
        this.name = name;
        this.image = image;
        this.iconPath = iconPath;
        this.command = command;
    }
}
exports.DockerContainer = DockerContainer;
//# sourceMappingURL=DockerContainer.js.map