"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const platform_1 = require("../models/platform");
const config_1 = require("../configurations/config");
const serviceDownloadProvider_1 = require("./serviceDownloadProvider");
const decompressProvider_1 = require("./decompressProvider");
const httpClient_1 = require("./httpClient");
const server_1 = require("./server");
class StubStatusView {
    installingService() {
        console.log('...');
    }
    serviceInstalled() {
        console.log('Service installed');
    }
    serviceInstallationFailed() {
        console.log('Service installation failed');
    }
    updateServiceDownloadingProgress(downloadPercentage) {
        if (downloadPercentage === 100) {
            process.stdout.write('100%');
        }
    }
}
exports.StubStatusView = StubStatusView;
class StubLogger {
    logDebug(message) {
        console.log(message);
    }
    increaseIndent() {
        console.log('increaseIndent');
    }
    decreaseIndent() {
        console.log('decreaseIndent');
    }
    append(message) {
        process.stdout.write(message);
    }
    appendLine(message) {
        console.log(message);
    }
}
exports.StubLogger = StubLogger;
const config = new config_1.default();
const logger = new StubLogger();
const statusView = new StubStatusView();
const httpClient = new httpClient_1.default();
const decompressProvider = new decompressProvider_1.default();
let downloadProvider = new serviceDownloadProvider_1.default(config, logger, statusView, httpClient, decompressProvider);
let serverProvider = new server_1.default(downloadProvider, config, statusView);
/*
* Installs the service for the given platform if it's not already installed.
*/
function installService(runtime) {
    if (runtime === undefined) {
        return platform_1.PlatformInformation.getCurrent().then(platformInfo => {
            if (platformInfo.isValidRuntime()) {
                return serverProvider.getOrDownloadServer(platformInfo.runtimeId);
            }
            else {
                throw new Error('unsupported runtime');
            }
        });
    }
    else {
        return serverProvider.getOrDownloadServer(runtime);
    }
}
exports.installService = installService;
/*
* Returns the install folder path for given platform.
*/
function getServiceInstallDirectory(runtime) {
    return new Promise((resolve, reject) => {
        if (runtime === undefined) {
            platform_1.PlatformInformation.getCurrent().then(platformInfo => {
                if (platformInfo.isValidRuntime()) {
                    resolve(downloadProvider.getInstallDirectory(platformInfo.runtimeId));
                }
                else {
                    reject('unsupported runtime');
                }
            }).catch(error => {
                reject(error);
            });
        }
        else {
            resolve(downloadProvider.getInstallDirectory(runtime));
        }
    });
}
exports.getServiceInstallDirectory = getServiceInstallDirectory;
/*
* Returns the path to the root folder of service install location.
*/
function getServiceInstallDirectoryRoot() {
    let directoryPath = downloadProvider.getInstallDirectoryRoot();
    directoryPath = directoryPath.replace('\\{#version#}\\{#platform#}', '');
    directoryPath = directoryPath.replace('/{#version#}/{#platform#}', '');
    return directoryPath;
}
exports.getServiceInstallDirectoryRoot = getServiceInstallDirectoryRoot;

//# sourceMappingURL=serviceInstallerUtil.js.map
