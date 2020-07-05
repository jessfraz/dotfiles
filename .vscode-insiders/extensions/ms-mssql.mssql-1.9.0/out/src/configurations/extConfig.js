/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const vscode_1 = require("vscode");
const Constants = require("../constants/constants");
/*
* ExtConfig class handles getting values from workspace config or config.json.
*/
class ExtConfig {
    constructor(_config, _extensionConfig, _workspaceConfig) {
        this._config = _config;
        this._extensionConfig = _extensionConfig;
        this._workspaceConfig = _workspaceConfig;
        if (this._config === undefined) {
            this._config = new config_1.default();
        }
        if (this._extensionConfig === undefined) {
            this._extensionConfig = vscode_1.workspace.getConfiguration(Constants.extensionConfigSectionName);
        }
        if (this._workspaceConfig === undefined) {
            this._workspaceConfig = vscode_1.workspace.getConfiguration();
        }
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
        return this._config.useServiceVersion(version);
    }
    getServiceVersion() {
        return this._config.getServiceVersion();
    }
    getSqlToolsConfigValue(configKey) {
        let configValue = this.getExtensionConfig(`${Constants.sqlToolsServiceConfigKey}.${configKey}`);
        if (!configValue) {
            configValue = this._config.getSqlToolsConfigValue(configKey);
        }
        return configValue;
    }
    getExtensionConfig(key, defaultValue) {
        let configValue = this._extensionConfig.get(key);
        if (configValue === undefined) {
            configValue = defaultValue;
        }
        return configValue;
    }
    getWorkspaceConfig(key, defaultValue) {
        let configValue = this._workspaceConfig.get(key);
        if (configValue === undefined) {
            configValue = defaultValue;
        }
        return configValue;
    }
}
exports.default = ExtConfig;

//# sourceMappingURL=extConfig.js.map
