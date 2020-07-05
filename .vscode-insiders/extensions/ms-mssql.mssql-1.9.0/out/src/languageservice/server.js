/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
let fs = require('fs-extra-promise');
/*
* Service Provider class finds the SQL tools service executable file or downloads it if doesn't exist.
*/
class ServerProvider {
    constructor(_downloadProvider, _config, _statusView) {
        this._downloadProvider = _downloadProvider;
        this._config = _config;
        this._statusView = _statusView;
    }
    /**
     * Given a file path, returns the path to the SQL Tools service file.
     */
    findServerPath(filePath) {
        return fs.lstatAsync(filePath).then(stats => {
            // If a file path was passed, assume its the launch file.
            if (stats.isFile()) {
                return filePath;
            }
            // Otherwise, search the specified folder.
            let candidate;
            if (this._config !== undefined) {
                let executableFiles = this._config.getSqlToolsExecutableFiles();
                executableFiles.forEach(element => {
                    let executableFile = path.join(filePath, element);
                    if (candidate === undefined && fs.existsSync(executableFile)) {
                        candidate = executableFile;
                        return candidate;
                    }
                });
            }
            return candidate;
        });
    }
    /**
     * Download the SQL tools service if doesn't exist and returns the file path.
     */
    getOrDownloadServer(runtime) {
        // Attempt to find launch file path first from options, and then from the default install location.
        // If SQL tools service can't be found, download it.
        return new Promise((resolve, reject) => {
            return this.getServerPath(runtime).then(result => {
                if (result === undefined) {
                    return this.downloadServerFiles(runtime).then(downloadResult => {
                        resolve(downloadResult);
                    });
                }
                else {
                    return resolve(result);
                }
            }).catch(err => {
                return reject(err);
            });
        }).catch(err => {
            throw err;
        });
    }
    /**
     * Returns the path of the installed service
     */
    getServerPath(runtime) {
        const installDirectory = this._downloadProvider.getInstallDirectory(runtime);
        return this.findServerPath(installDirectory);
    }
    /**
     * Downloads the service and returns the path of the installed service
     */
    downloadServerFiles(runtime) {
        return new Promise((resolve, reject) => {
            const installDirectory = this._downloadProvider.getInstallDirectory(runtime);
            return this._downloadProvider.installSQLToolsService(runtime).then(_ => {
                return this.findServerPath(installDirectory).then(result => {
                    return resolve(result);
                });
            }).catch(err => {
                this._statusView.serviceInstallationFailed();
                reject(err);
            });
        });
    }
}
exports.default = ServerProvider;

//# sourceMappingURL=server.js.map
