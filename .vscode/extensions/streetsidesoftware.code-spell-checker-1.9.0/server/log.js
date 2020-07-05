"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWorkspaceFolders = exports.setWorkspaceBase = exports.logDebug = exports.logInfo = exports.logError = exports.log = exports.logger = void 0;
const logger_1 = require("./logger");
var logger_2 = require("./logger");
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_2.LogLevel; } });
let workspaceBase = '';
let workspaceFolders = [];
exports.logger = new logger_1.Logger();
function log(msg, uri) {
    exports.logger.log(formatMessage(msg, uri));
}
exports.log = log;
function logError(msg, uri) {
    exports.logger.error(formatMessage(msg, uri));
}
exports.logError = logError;
function logInfo(msg, uri) {
    exports.logger.info(formatMessage(msg, uri));
}
exports.logInfo = logInfo;
function logDebug(msg, uri) {
    exports.logger.debug(formatMessage(msg, uri));
}
exports.logDebug = logDebug;
function setWorkspaceBase(uri) {
    log(`setWorkspaceBase URI: ${uri}`);
    workspaceBase = uri;
}
exports.setWorkspaceBase = setWorkspaceBase;
function setWorkspaceFolders(folders) {
    log(`setWorkspaceFolders folders URI: [${folders.join('\n')}]`);
    workspaceFolders = folders;
    setWorkspaceBase(findCommonBasis(workspaceFolders));
}
exports.setWorkspaceFolders = setWorkspaceFolders;
function formatMessage(msg, uri) {
    const uris = Array.isArray(uri) ? uri : [uri];
    return msg + '\t' + uris.map(normalizeUri).join('\n\t\t\t');
}
function normalizeUri(uri) {
    if (!uri) {
        return '';
    }
    const base = findCommonBase(uri, workspaceBase);
    return base ? uri.replace(base, '...') : uri;
}
function findCommonBasis(folders) {
    return folders.reduce((a, b) => findCommonBase(a || b, b), '');
}
function findCommonBase(a, b) {
    const limit = matchingUriLength(a, b);
    return a.slice(0, limit);
}
function matchingUriLength(a, b) {
    const sep = '/';
    const aParts = a.split(sep);
    const bParts = b.split(sep);
    const limit = Math.min(aParts.length, bParts.length);
    let i = 0;
    for (i = 0; i < limit && aParts[i] === bParts[i]; i += 1) { }
    return aParts.slice(0, i).join(sep).length;
}
//# sourceMappingURL=log.js.map