"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Logger {
    constructor() {
        this.channel = vscode.window.createOutputChannel('Git Graph');
    }
    dispose() {
        this.channel.dispose();
    }
    log(message) {
        const date = new Date();
        const timestamp = date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds()) + '.' + pad3(date.getMilliseconds());
        this.channel.appendLine('[' + timestamp + '] ' + message);
    }
    logCmd(cmd, args) {
        this.log('> ' + cmd + ' ' + args.map((arg) => {
            return arg.startsWith('--format=')
                ? '--format=...'
                : arg.includes(' ') ? '"' + arg.replace(/"/g, '\\"') + '"' : arg;
        }).join(' '));
    }
    logError(message) {
        this.log('ERROR: ' + message);
    }
}
exports.Logger = Logger;
function pad2(n) {
    return (n > 9 ? '' : '0') + n;
}
function pad3(n) {
    return (n > 99 ? '' : n > 9 ? '0' : '00') + n;
}
function maskEmail(email) {
    return email.substring(0, email.indexOf('@')) + '@*****';
}
exports.maskEmail = maskEmail;
//# sourceMappingURL=logger.js.map