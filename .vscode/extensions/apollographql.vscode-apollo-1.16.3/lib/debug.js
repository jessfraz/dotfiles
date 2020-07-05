"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createAndTrimStackTrace = () => {
    let stack = new Error().stack;
    return stack && stack.split("\n").length > 2
        ? stack
            .split("\n")
            .slice(3, 7)
            .join("\n")
        : stack;
};
class Debug {
    static SetOutputConsole(outputConsole) {
        this.outputConsole = outputConsole;
    }
    static info(message, _stack) {
        if (!this.outputConsole)
            return;
        this.outputConsole.appendLine(`[INFO] ${message}`);
    }
    static error(message, stack) {
        if (!this.outputConsole)
            return;
        const stackTrace = stack || createAndTrimStackTrace();
        Debug.showConsole();
        this.outputConsole.appendLine(`[ERROR] ${message}`);
        stackTrace && this.outputConsole.appendLine(stackTrace);
    }
    static warning(message, _stack) {
        if (!this.outputConsole)
            return;
        this.outputConsole.appendLine(`[WARN] ${message}`);
    }
    static clear() {
        if (!this.outputConsole)
            return;
        this.outputConsole.clear();
        this.outputConsole.dispose();
    }
    static showConsole() {
        if (!this.outputConsole)
            return;
        this.outputConsole.show();
    }
}
exports.Debug = Debug;
//# sourceMappingURL=debug.js.map