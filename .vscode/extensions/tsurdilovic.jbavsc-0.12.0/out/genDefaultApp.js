"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const genApp_1 = require("./genApp");
function getDefaultApp(context) {
    try {
        genApp_1.runDefaultApp(context);
        vscode_1.window.showInformationMessage("Successfully generated your jBPM Business Application");
    }
    catch (e) {
        vscode_1.window.showInformationMessage(`Error generating your jBPM Business Application: ${e}`);
    }
}
exports.getDefaultApp = getDefaultApp;
//# sourceMappingURL=genDefaultApp.js.map