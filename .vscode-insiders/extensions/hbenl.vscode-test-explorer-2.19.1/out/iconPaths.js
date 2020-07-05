"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconPaths = void 0;
class IconPaths {
    constructor(context) {
        this.pending = context.asAbsolutePath('icons/pending.svg');
        this.pendingAutorun = {
            dark: context.asAbsolutePath('icons/pending-autorun-dark.svg'),
            light: context.asAbsolutePath('icons/pending-autorun-light.svg')
        };
        this.scheduled = context.asAbsolutePath('icons/scheduled.svg');
        this.running = context.asAbsolutePath('icons/running.svg');
        this.runningFailed = context.asAbsolutePath('icons/running-failed.svg');
        this.passed = context.asAbsolutePath('icons/passed.svg');
        this.failed = context.asAbsolutePath('icons/failed.svg');
        this.passedFaint = context.asAbsolutePath('icons/passed-faint.svg');
        this.failedFaint = context.asAbsolutePath('icons/failed-faint.svg');
        this.passedAutorun = {
            dark: context.asAbsolutePath('icons/passed-autorun-dark.svg'),
            light: context.asAbsolutePath('icons/passed-autorun-light.svg')
        };
        this.failedAutorun = {
            dark: context.asAbsolutePath('icons/failed-autorun-dark.svg'),
            light: context.asAbsolutePath('icons/failed-autorun-light.svg')
        };
        this.passedFaintAutorun = {
            dark: context.asAbsolutePath('icons/passed-faint-autorun-dark.svg'),
            light: context.asAbsolutePath('icons/passed-faint-autorun-light.svg')
        };
        this.failedFaintAutorun = {
            dark: context.asAbsolutePath('icons/failed-faint-autorun-dark.svg'),
            light: context.asAbsolutePath('icons/failed-faint-autorun-light.svg')
        };
        this.skipped = context.asAbsolutePath('icons/skipped.svg');
        this.duplicate = context.asAbsolutePath('icons/duplicate.svg');
        this.errored = context.asAbsolutePath('icons/errored.svg');
        this.erroredFaint = context.asAbsolutePath('icons/errored-faint.svg');
    }
}
exports.IconPaths = IconPaths;
//# sourceMappingURL=iconPaths.js.map