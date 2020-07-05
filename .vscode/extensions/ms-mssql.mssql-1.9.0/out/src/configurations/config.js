/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require("path");
const Constants = require("../constants/constants");
/*
* Config class handles getting values from config.json.
*/
class Config {
    constructor() {
        this._sqlToolsServiceConfigKey = Constants.sqlToolsServiceConfigKey;
        this.version = 2;
    }
    static get configJsonContent() {
        if (this._configJsonContent === undefined) {
            this._configJsonContent = this.loadConfig();
        }
        return this._configJsonContent;
    }
    getSqlToolsServiceDownloadUrl() {
        return this.getSqlToolsConfigValue(Constants.sqlToolsServiceDownloadUrlConfigKey);
    }
    getSqlToolsInstallDirectory() {
        return this.getSqlToolsConfigValue(Constants.sqlToolsServiceInstallDirConfigKey);
    }
    getSqlToolsExecutableFiles() {
        return this.getSqlToolsConfigValue(Constants.sqlToolsServiceExecutableFilesConfigKey);
    }
    getSqlToolsPackageVersion() {
        return this.getSqlToolsConfigValue(Constants.sqlToolsServiceVersionConfigKey);
    }
    useServiceVersion(version) {
        switch (version) {
            case 1:
                this._sqlToolsServiceConfigKey = Constants.v1SqlToolsServiceConfigKey;
                break;
            default:
                this._sqlToolsServiceConfigKey = Constants.sqlToolsServiceConfigKey;
        }
        this.version = version;
    }
    getServiceVersion() {
        return this.version;
    }
    getSqlToolsConfigValue(configKey) {
        let json = Config.configJsonContent;
        let toolsConfig = json[this._sqlToolsServiceConfigKey];
        let configValue = undefined;
        if (toolsConfig !== undefined) {
            configValue = toolsConfig[configKey];
        }
        return configValue;
    }
    getExtensionConfig(key, defaultValue) {
        let json = Config.configJsonContent;
        let extensionConfig = json[Constants.extensionConfigSectionName];
        let configValue = extensionConfig[key];
        if (!configValue) {
            configValue = defaultValue;
        }
        return configValue;
    }
    getWorkspaceConfig(key, defaultValue) {
        let json = Config.configJsonContent;
        let configValue = json[key];
        if (!configValue) {
            configValue = defaultValue;
        }
        return configValue;
    }
    static loadConfig() {
        let configContent = fs.readFileSync(path.join(__dirname, '../config.json'));
        return JSON.parse(configContent);
    }
}
Config._configJsonContent = undefined;
exports.default = Config;

//# sourceMappingURL=config.js.map
