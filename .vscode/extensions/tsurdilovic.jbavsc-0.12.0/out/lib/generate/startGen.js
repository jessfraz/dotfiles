"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const genApp_1 = require("./genApp");
const genConfigureApp_1 = require("./genConfigureApp");
const confirmAndGen_1 = require("./confirmAndGen");
function startGen(context) {
    const quickPick = vscode_1.window.createQuickPick();
    const items = [
        {
            label: "Generate default Business App",
            description: "Uses default settings to generate"
        },
        {
            label: "Configure Business App",
            description: "Configure app settings before generating"
        }
    ];
    quickPick.items = items;
    quickPick.title = "Select generation option";
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            if (selection[0].label === items[0].label) {
                quickPick.dispose();
                confirmAndGen_1.confirmAndGen(genApp_1.runDefaultApp, context);
            }
            else if (selection[0].label === items[1].label) {
                genConfigureApp_1.genConfigureApp(context);
            }
            else {
                vscode_1.window.showInformationMessage(`Invalid command ${selection[0]}`);
            }
        }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}
exports.startGen = startGen;
//# sourceMappingURL=startGen.js.map