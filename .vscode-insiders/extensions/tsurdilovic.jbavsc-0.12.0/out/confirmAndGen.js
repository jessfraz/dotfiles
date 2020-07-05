"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function confirmAndGen(genFunction, context, confState) {
    vscode_1.window
        .showInformationMessage("About to generate your app. Please confirm.", { modal: true }, "Do it!")
        .then(answer => {
        if (answer === "Do it!") {
            try {
                if (confState) {
                    genFunction(context, confState);
                }
                else {
                    genFunction(context);
                }
                vscode_1.window.showInformationMessage("Successfully generated your jBPM Business Application");
            }
            catch (e) {
                vscode_1.window.showInformationMessage(`Error generating your jBPM Business Application: ${e}`);
            }
        }
    });
}
exports.confirmAndGen = confirmAndGen;
//# sourceMappingURL=confirmAndGen.js.map