"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateDecorationTypes = void 0;
const vscode = require("vscode");
class StateDecorationTypes {
    constructor(context, iconPaths) {
        this.pending = toDecorationType(iconPaths.pending);
        this.pendingAutorun = toDecorationType(iconPaths.pendingAutorun);
        this.scheduled = toDecorationType(iconPaths.scheduled);
        this.running = toDecorationType(iconPaths.running);
        this.runningFailed = toDecorationType(iconPaths.runningFailed);
        this.passed = toDecorationType(iconPaths.passed);
        this.failed = toDecorationType(iconPaths.failed);
        this.passedFaint = toDecorationType(iconPaths.passedFaint);
        this.failedFaint = toDecorationType(iconPaths.failedFaint);
        this.passedAutorun = toDecorationType(iconPaths.passedAutorun);
        this.failedAutorun = toDecorationType(iconPaths.failedAutorun);
        this.passedFaintAutorun = toDecorationType(iconPaths.passedFaintAutorun);
        this.failedFaintAutorun = toDecorationType(iconPaths.failedFaintAutorun);
        this.skipped = toDecorationType(iconPaths.skipped);
        this.duplicate = toDecorationType(iconPaths.duplicate);
        this.errored = toDecorationType(iconPaths.errored);
        this.erroredFaint = toDecorationType(iconPaths.erroredFaint);
        this.all = [
            this.pending, this.pendingAutorun, this.scheduled, this.running, this.runningFailed,
            this.passed, this.failed, this.passedFaint, this.failedFaint, this.passedAutorun,
            this.failedAutorun, this.passedFaintAutorun, this.failedFaintAutorun, this.skipped,
            this.duplicate, this.errored, this.erroredFaint
        ];
        for (const decorationType of this.all) {
            context.subscriptions.push(decorationType);
        }
    }
}
exports.StateDecorationTypes = StateDecorationTypes;
function toDecorationType(iconPath) {
    return vscode.window.createTextEditorDecorationType(toDecorationRenderOptions(iconPath));
}
function toDecorationRenderOptions(iconPath) {
    if (typeof iconPath === 'string') {
        return { gutterIconPath: iconPath };
    }
    else {
        return {
            dark: { gutterIconPath: iconPath.dark },
            light: { gutterIconPath: iconPath.light }
        };
    }
}
//# sourceMappingURL=stateDecorationTypes.js.map