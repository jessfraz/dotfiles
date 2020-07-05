"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decorator = void 0;
const vscode = require("vscode");
const state_1 = require("./tree/state");
const stateDecorationTypes_1 = require("./stateDecorationTypes");
const util_1 = require("./util");
class Decorator {
    constructor(context, testExplorer) {
        this.testExplorer = testExplorer;
        this.filesWithCurrentDecorations = new Set();
        this.stateDecorationTypes = new stateDecorationTypes_1.StateDecorationTypes(context, this.testExplorer.iconPaths);
        this.errorDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('testExplorer.errorDecorationBackground'),
            isWholeLine: true,
            overviewRulerColor: new vscode.ThemeColor('testExplorer.errorDecorationBackground'),
        });
        context.subscriptions.push(this.errorDecorationType);
        context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(() => {
            this.updateAllDecorations();
        }));
        this.updateDecorationsNow();
    }
    updateDecorationsFor(fileUri) {
        if (!this.filesWithCurrentDecorations.has(fileUri))
            return;
        this.filesWithCurrentDecorations.delete(fileUri);
        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.updateDecorationsNow();
            }, 200);
        }
    }
    updateAllDecorations() {
        this.filesWithCurrentDecorations.clear();
        this.updateDecorationsNow();
    }
    updateDecorationsNow() {
        if (this.timeout !== undefined) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        const newFilesWithCurrentDecorations = new Set();
        for (const textEditor of vscode.window.visibleTextEditors) {
            const fileUri = textEditor.document.uri.toString();
            if (!this.filesWithCurrentDecorations.has(fileUri)) {
                this.setDecorations(textEditor);
            }
            newFilesWithCurrentDecorations.add(fileUri);
        }
        this.filesWithCurrentDecorations = newFilesWithCurrentDecorations;
    }
    setDecorations(textEditor) {
        const fileUri = textEditor.document.uri.toString();
        const decorations = new Map();
        for (const decorationType of this.stateDecorationTypes.all) {
            decorations.set(decorationType, []);
        }
        decorations.set(this.errorDecorationType, []);
        for (const collection of this.testExplorer.collections.values()) {
            this.addStateDecorations(collection, fileUri, decorations);
            this.addErrorDecorations(collection, fileUri, decorations);
        }
        for (const [decorationType, decorationOptions] of decorations) {
            textEditor.setDecorations(decorationType, decorationOptions);
        }
    }
    addStateDecorations(collection, fileUri, decorations) {
        if (collection.shouldShowGutterDecoration()) {
            const locatedNodes = collection.getLocatedNodes(fileUri);
            if (locatedNodes) {
                for (const [line, treeNodes] of locatedNodes) {
                    let stateIconType;
                    if (treeNodes.length === 1) {
                        stateIconType = state_1.stateIcon(treeNodes[0].state);
                    }
                    else {
                        stateIconType = state_1.stateIcon(state_1.parentNodeState(treeNodes));
                    }
                    const decorationType = this.stateDecorationTypes[stateIconType];
                    decorations.get(decorationType).push({
                        range: new vscode.Range(line, 0, line, 0)
                    });
                }
            }
        }
    }
    addErrorDecorations(collection, fileUri, decorations) {
        if (collection.shouldShowErrorDecoration() && collection.suite) {
            for (const testNode of util_1.allTests(collection.suite)) {
                if (testNode.fileUri === fileUri) {
                    for (const decoration of testNode.decorations) {
                        decorations.get(this.errorDecorationType).push({
                            range: new vscode.Range(decoration.line, 0, decoration.line, 0),
                            renderOptions: {
                                after: {
                                    contentText: ` // ${decoration.message}`
                                }
                            }
                        });
                    }
                }
            }
        }
    }
}
exports.Decorator = Decorator;
//# sourceMappingURL=decorator.js.map