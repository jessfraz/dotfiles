"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceFolders = exports.getConfiguration = void 0;
const log_1 = require("./log");
function getConfiguration(connection, params) {
    if (typeof params === 'string') {
        log_1.log(`getConfiguration\t${params}`);
        return connection.workspace.getConfiguration(params);
    }
    if (Array.isArray(params)) {
        const uris = params
            .map(p => {
            if (!p) {
                return '';
            }
            if (typeof p === 'string') {
                return p;
            }
            return p.scopeUri || '';
        })
            .filter(p => !!p);
        log_1.log('getConfiguration', uris);
        return connection.workspace.getConfiguration(params);
    }
    if (params) {
        log_1.log('getConfiguration', params.scopeUri);
        return connection.workspace.getConfiguration(params);
    }
    return connection.workspace.getConfiguration();
}
exports.getConfiguration = getConfiguration;
/**
 * Just a pass through function to `connection.workspace.getWorkspaceFolders`
 * Useful for mocking.
 * @param connection
 */
function getWorkspaceFolders(connection) {
    return connection.workspace.getWorkspaceFolders();
}
exports.getWorkspaceFolders = getWorkspaceFolders;
//# sourceMappingURL=vscode.config.js.map