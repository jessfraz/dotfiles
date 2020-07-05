"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// NOTE same as vscode.ExtensionExecutionContext
// this const can be replaced when we drop support of vscode <=1.35
const EXTENSION_EXECUTION_CONTEXT = {
    Local: 1,
    Remote: 2,
};
function isExtensionRunningLocally(context) {
    // NOTE: executionContext is present in >=1.35 (when remote support added)
    // so using local as default value
    const executionContext = context.executionContext || EXTENSION_EXECUTION_CONTEXT.Local;
    return executionContext === EXTENSION_EXECUTION_CONTEXT.Local;
}
exports.isExtensionRunningLocally = isExtensionRunningLocally;
//# sourceMappingURL=utils.js.map