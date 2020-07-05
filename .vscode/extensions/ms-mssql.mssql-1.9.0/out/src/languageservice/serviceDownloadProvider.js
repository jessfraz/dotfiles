/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const tmp = require("tmp");
const platform_1 = require("../models/platform");
const interfaces_1 = require("./interfaces");
const Constants = require("../constants/constants");
let fse = require('fs-extra');
/*
* Service Download Provider class which handles downloading the SQL Tools service.
*/
class ServiceDownloadProvider {
    constructor(_config, _logger, _statusView, _httpClient, _decompressProvider) {
        this._config = _config;
        this._logger = _logger;
        this._statusView = _statusView;
        this._httpClient = _httpClient;
        this._decompressProvider = _decompressProvider;
        // Ensure our temp files get cleaned up in case of error.
        tmp.setGracefulCleanup();
    }
    /**
     * Returns the download url for given platform
     */
    getDownloadFileName(platform) {
        let fileNamesJson = this._config.getSqlToolsConfigValue('downloadFileNames');
        let fileName = fileNamesJson[platform.toString()];
        if (fileName === undefined) {
            if (process.platform === 'linux') {
                throw new Error('Unsupported linux distribution');
            }
            else {
                throw new Error(`Unsupported platform: ${process.platform}`);
            }
        }
        return fileName;
    }
    /**
     * Returns SQL tools service installed folder.
     */
    getInstallDirectory(platform) {
        let basePath = this.getInstallDirectoryRoot();
        let versionFromConfig = this._config.getSqlToolsPackageVersion();
        basePath = basePath.replace('{#version#}', versionFromConfig);
        basePath = basePath.replace('{#platform#}', platform_1.getRuntimeDisplayName(platform));
        if (!fse.existsSync(basePath)) {
            fse.mkdirsSync(basePath);
        }
        return basePath;
    }
    /**
     * Returns SQL tools service installed folder root.
     */
    getInstallDirectoryRoot() {
        let installDirFromConfig = this._config.getSqlToolsInstallDirectory();
        let basePath;
        if (path.isAbsolute(installDirFromConfig)) {
            basePath = installDirFromConfig;
        }
        else {
            // The path from config is relative to the out folder
            basePath = path.join(__dirname, '../../' + installDirFromConfig);
        }
        return basePath;
    }
    getGetDownloadUrl(fileName) {
        let baseDownloadUrl = this._config.getSqlToolsServiceDownloadUrl();
        let version = this._config.getSqlToolsPackageVersion();
        baseDownloadUrl = baseDownloadUrl.replace('{#version#}', version);
        baseDownloadUrl = baseDownloadUrl.replace('{#fileName#}', fileName);
        return baseDownloadUrl;
    }
    /**
     * Downloads the SQL tools service and decompress it in the install folder.
     */
    installSQLToolsService(platform) {
        const proxy = this._config.getWorkspaceConfig('http.proxy');
        const strictSSL = this._config.getWorkspaceConfig('http.proxyStrictSSL', true);
        const authorization = this._config.getWorkspaceConfig('http.proxyAuthorization');
        return new Promise((resolve, reject) => {
            const fileName = this.getDownloadFileName(platform);
            const installDirectory = this.getInstallDirectory(platform);
            this._logger.appendLine(`${Constants.serviceInstallingTo} ${installDirectory}.`);
            const urlString = this.getGetDownloadUrl(fileName);
            this._logger.appendLine(`${Constants.serviceDownloading} ${urlString}`);
            let pkg = {
                installPath: installDirectory,
                url: urlString,
                tmpFile: undefined
            };
            this.createTempFile(pkg).then(tmpResult => {
                pkg.tmpFile = tmpResult;
                this._httpClient.downloadFile(pkg.url, pkg, this._logger, this._statusView, proxy, strictSSL, authorization).then(_ => {
                    this._logger.logDebug(`Downloaded to ${pkg.tmpFile.name}...`);
                    this._logger.appendLine(' Done!');
                    this.install(pkg).then(result => {
                        resolve(true);
                    }).catch(installError => {
                        reject(installError);
                    });
                }).catch(downloadError => {
                    this._logger.appendLine(`[ERROR] ${downloadError}`);
                    reject(downloadError);
                });
            });
        });
    }
    createTempFile(pkg) {
        return new Promise((resolve, reject) => {
            tmp.file({ prefix: 'package-' }, (err, filePath, fd, cleanupCallback) => {
                if (err) {
                    return reject(new interfaces_1.PackageError('Error from tmp.file', pkg, err));
                }
                resolve({ name: filePath, fd: fd, removeCallback: cleanupCallback });
            });
        });
    }
    install(pkg) {
        this._logger.appendLine('Installing ...');
        this._statusView.installingService();
        return new Promise((resolve, reject) => {
            this._decompressProvider.decompress(pkg, this._logger).then(_ => {
                this._statusView.serviceInstalled();
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
}
exports.default = ServiceDownloadProvider;

//# sourceMappingURL=serviceDownloadProvider.js.map
