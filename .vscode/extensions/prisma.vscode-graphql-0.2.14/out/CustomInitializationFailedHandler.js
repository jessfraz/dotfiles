"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function CustomInitializationFailedHandler(outputChannel) {
    return (error) => {
        outputChannel.appendLine(`Caught the error ${error}`);
        return false;
    };
}
exports.CustomInitializationFailedHandler = CustomInitializationFailedHandler;
//# sourceMappingURL=CustomInitializationFailedHandler.js.map