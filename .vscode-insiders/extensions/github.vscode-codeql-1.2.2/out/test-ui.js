"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const vscode_1 = require("vscode");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const test_adapter_1 = require("./test-adapter");
const logging_1 = require("./logging");
/**
 * Test event listener. Currently unused, but left in to keep the plumbing hooked up for future use.
 */
class QLTestListener extends semmle_vscode_utils_1.DisposableObject {
    constructor(adapter) {
        super();
        this.push(adapter.testStates(this.onTestStatesEvent, this));
    }
    onTestStatesEvent(_e) {
        /**/
    }
}
/**
 * Service that implements all UI and commands for QL tests.
 */
class TestUIService extends semmle_vscode_utils_1.UIService {
    constructor(testHub) {
        super();
        this.testHub = testHub;
        this.listeners = new Map();
        logging_1.logger.log('Registering CodeQL test panel commands.');
        this.registerCommand('codeQLTests.showOutputDifferences', this.showOutputDifferences);
        this.registerCommand('codeQLTests.acceptOutput', this.acceptOutput);
        testHub.registerTestController(this);
    }
    dispose() {
        this.testHub.unregisterTestController(this);
        super.dispose();
    }
    registerTestAdapter(adapter) {
        this.listeners.set(adapter, new QLTestListener(adapter));
    }
    unregisterTestAdapter(adapter) {
        if (adapter instanceof test_adapter_1.QLTestAdapter) {
            this.listeners.delete(adapter);
        }
    }
    async acceptOutput(node) {
        const testId = node.info.id;
        const stat = await fs.lstat(testId);
        if (stat.isFile()) {
            const expectedPath = test_adapter_1.getExpectedFile(testId);
            const actualPath = test_adapter_1.getActualFile(testId);
            await fs.copy(actualPath, expectedPath, { overwrite: true });
        }
    }
    async showOutputDifferences(node) {
        const testId = node.info.id;
        const stat = await fs.lstat(testId);
        if (stat.isFile()) {
            const expectedPath = test_adapter_1.getExpectedFile(testId);
            const expectedUri = vscode_1.Uri.file(expectedPath);
            const actualPath = test_adapter_1.getActualFile(testId);
            const options = {
                preserveFocus: true,
                preview: true
            };
            if (await fs.pathExists(actualPath)) {
                const actualUri = vscode_1.Uri.file(actualPath);
                await vscode_1.commands.executeCommand('vscode.diff', expectedUri, actualUri, `Expected vs. Actual for ${path.basename(testId)}`, options);
            }
            else {
                await vscode_1.window.showTextDocument(expectedUri, options);
            }
        }
    }
}
exports.TestUIService = TestUIService;

//# sourceMappingURL=test-ui.js.map
