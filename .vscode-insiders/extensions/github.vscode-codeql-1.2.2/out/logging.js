"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const fs = require("fs-extra");
const path = require("path");
/** A logger that writes messages to an output channel in the Output tab. */
class OutputChannelLogger extends semmle_vscode_utils_1.DisposableObject {
    constructor(title) {
        super();
        this.title = title;
        this.additionalLocations = new Map();
        this.outputChannel = vscode_1.window.createOutputChannel(title);
        this.push(this.outputChannel);
    }
    init(storagePath) {
        this.additionalLogLocationPath = path.join(storagePath, this.title);
        // clear out any old state from previous runs
        fs.remove(this.additionalLogLocationPath);
    }
    /**
     * This function is asynchronous and will only resolve once the message is written
     * to the side log (if required). It is not necessary to await the results of this
     * function if you don't need to guarantee that the log writing is complete before
     * continuing.
     */
    async log(message, options = {}) {
        if (options.trailingNewline === undefined) {
            options.trailingNewline = true;
        }
        if (options.trailingNewline) {
            this.outputChannel.appendLine(message);
        }
        else {
            this.outputChannel.append(message);
        }
        if (this.additionalLogLocationPath && options.additionalLogLocation) {
            const logPath = path.join(this.additionalLogLocationPath, options.additionalLogLocation);
            let additional = this.additionalLocations.get(logPath);
            if (!additional) {
                const msg = `| Log being saved to ${logPath} |`;
                const separator = new Array(msg.length).fill('-').join('');
                this.outputChannel.appendLine(separator);
                this.outputChannel.appendLine(msg);
                this.outputChannel.appendLine(separator);
                additional = new AdditionalLogLocation(logPath);
                this.additionalLocations.set(logPath, additional);
                this.track(additional);
            }
            await additional.log(message, options);
        }
    }
    show(preserveFocus) {
        this.outputChannel.show(preserveFocus);
    }
    removeAdditionalLogLocation(location) {
        if (this.additionalLogLocationPath && location) {
            const logPath = location.startsWith(this.additionalLogLocationPath)
                ? location
                : path.join(this.additionalLogLocationPath, location);
            const additional = this.additionalLocations.get(logPath);
            if (additional) {
                this.disposeAndStopTracking(additional);
                this.additionalLocations.delete(logPath);
            }
        }
    }
    getBaseLocation() {
        return this.additionalLogLocationPath;
    }
}
exports.OutputChannelLogger = OutputChannelLogger;
class AdditionalLogLocation extends vscode_1.Disposable {
    constructor(location) {
        super(() => { });
        this.location = location;
    }
    async log(message, options = {}) {
        if (options.trailingNewline === undefined) {
            options.trailingNewline = true;
        }
        await fs.ensureFile(this.location);
        await fs.appendFile(this.location, message + (options.trailingNewline ? '\n' : ''), {
            encoding: 'utf8'
        });
    }
    async dispose() {
        await fs.remove(this.location);
    }
}
/** The global logger for the extension. */
exports.logger = new OutputChannelLogger('CodeQL Extension Log');
/** The logger for messages from the query server. */
exports.queryServerLogger = new OutputChannelLogger('CodeQL Query Server');
/** The logger for messages from the language server. */
exports.ideServerLogger = new OutputChannelLogger('CodeQL Language Server');
/** The logger for messages from tests. */
exports.testLogger = new OutputChannelLogger('CodeQL Tests');

//# sourceMappingURL=logging.js.map
