"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const vscode_1 = require("vscode");
const logging_1 = require("./logging");
/** Helper class to look up a labelled (and possibly nested) setting. */
class Setting {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
    }
    get qualifiedName() {
        if (this.parent === undefined) {
            return this.name;
        }
        else {
            return `${this.parent.qualifiedName}.${this.name}`;
        }
    }
    getValue() {
        if (this.parent === undefined) {
            throw new Error('Cannot get the value of a root setting.');
        }
        return vscode_1.workspace.getConfiguration(this.parent.qualifiedName).get(this.name);
    }
    updateValue(value, target) {
        if (this.parent === undefined) {
            throw new Error('Cannot update the value of a root setting.');
        }
        return vscode_1.workspace.getConfiguration(this.parent.qualifiedName).update(this.name, value, target);
    }
}
const ROOT_SETTING = new Setting('codeQL');
// Enable experimental features
/**
 * Any settings below are deliberately not in package.json so that
 * they do not appear in the settings ui in vscode itself. If users
 * want to enable experimental features, they can add them directly in
 * their vscode settings json file.
 */
/* Advanced setting: used to enable bqrs parsing in the cli instead of in the webview. */
exports.EXPERIMENTAL_BQRS_SETTING = new Setting('experimentalBqrsParsing', ROOT_SETTING);
// Distribution configuration
const DISTRIBUTION_SETTING = new Setting('cli', ROOT_SETTING);
const CUSTOM_CODEQL_PATH_SETTING = new Setting('executablePath', DISTRIBUTION_SETTING);
const INCLUDE_PRERELEASE_SETTING = new Setting('includePrerelease', DISTRIBUTION_SETTING);
const PERSONAL_ACCESS_TOKEN_SETTING = new Setting('personalAccessToken', DISTRIBUTION_SETTING);
const QUERY_HISTORY_SETTING = new Setting('queryHistory', ROOT_SETTING);
const QUERY_HISTORY_FORMAT_SETTING = new Setting('format', QUERY_HISTORY_SETTING);
/** When these settings change, the distribution should be updated. */
const DISTRIBUTION_CHANGE_SETTINGS = [CUSTOM_CODEQL_PATH_SETTING, INCLUDE_PRERELEASE_SETTING, PERSONAL_ACCESS_TOKEN_SETTING];
// Query server configuration
const RUNNING_QUERIES_SETTING = new Setting('runningQueries', ROOT_SETTING);
const NUMBER_OF_THREADS_SETTING = new Setting('numberOfThreads', RUNNING_QUERIES_SETTING);
const TIMEOUT_SETTING = new Setting('timeout', RUNNING_QUERIES_SETTING);
const MEMORY_SETTING = new Setting('memory', RUNNING_QUERIES_SETTING);
const DEBUG_SETTING = new Setting('debug', RUNNING_QUERIES_SETTING);
exports.AUTOSAVE_SETTING = new Setting('autoSave', RUNNING_QUERIES_SETTING);
/** When these settings change, the running query server should be restarted. */
const QUERY_SERVER_RESTARTING_SETTINGS = [NUMBER_OF_THREADS_SETTING, MEMORY_SETTING, DEBUG_SETTING];
/** When these settings change, the query history should be refreshed. */
const QUERY_HISTORY_SETTINGS = [QUERY_HISTORY_FORMAT_SETTING];
class ConfigListener extends semmle_vscode_utils_1.DisposableObject {
    constructor() {
        super();
        this._onDidChangeConfiguration = this.push(new vscode_1.EventEmitter());
        this.updateConfiguration();
        this.push(vscode_1.workspace.onDidChangeConfiguration(this.handleDidChangeConfiguration, this));
    }
    /**
     * Calls `updateConfiguration` if any of the `relevantSettings` have changed.
     */
    handleDidChangeConfigurationForRelevantSettings(relevantSettings, e) {
        // Check whether any options that affect query running were changed.
        for (const option of relevantSettings) {
            // TODO: compare old and new values, only update if there was actually a change?
            if (e.affectsConfiguration(option.qualifiedName)) {
                this.updateConfiguration();
                break; // only need to do this once, if any of the settings have changed
            }
        }
    }
    updateConfiguration() {
        this._onDidChangeConfiguration.fire();
    }
}
class DistributionConfigListener extends ConfigListener {
    get customCodeQlPath() {
        return CUSTOM_CODEQL_PATH_SETTING.getValue() || undefined;
    }
    get includePrerelease() {
        return INCLUDE_PRERELEASE_SETTING.getValue();
    }
    get personalAccessToken() {
        return PERSONAL_ACCESS_TOKEN_SETTING.getValue() || undefined;
    }
    get onDidChangeDistributionConfiguration() {
        return this._onDidChangeConfiguration.event;
    }
    handleDidChangeConfiguration(e) {
        this.handleDidChangeConfigurationForRelevantSettings(DISTRIBUTION_CHANGE_SETTINGS, e);
    }
}
exports.DistributionConfigListener = DistributionConfigListener;
class QueryServerConfigListener extends ConfigListener {
    constructor(_codeQlPath) {
        super();
        this._codeQlPath = _codeQlPath;
    }
    static async createQueryServerConfigListener(distributionManager) {
        const codeQlPath = await distributionManager.getCodeQlPathWithoutVersionCheck();
        const config = new QueryServerConfigListener(codeQlPath);
        if (distributionManager.onDidChangeDistribution) {
            config.push(distributionManager.onDidChangeDistribution(async () => {
                const codeQlPath = await distributionManager.getCodeQlPathWithoutVersionCheck();
                config._codeQlPath = codeQlPath;
                config._onDidChangeConfiguration.fire();
            }));
        }
        return config;
    }
    get codeQlPath() {
        return this._codeQlPath;
    }
    get numThreads() {
        return NUMBER_OF_THREADS_SETTING.getValue();
    }
    /** Gets the configured query timeout, in seconds. This looks up the setting at the time of access. */
    get timeoutSecs() {
        return TIMEOUT_SETTING.getValue() || 0;
    }
    get queryMemoryMb() {
        const memory = MEMORY_SETTING.getValue();
        if (memory === null) {
            return undefined;
        }
        if (memory == 0 || typeof (memory) !== 'number') {
            logging_1.logger.log(`Ignoring value '${memory}' for setting ${MEMORY_SETTING.qualifiedName}`);
            return undefined;
        }
        return memory;
    }
    get debug() {
        return DEBUG_SETTING.getValue();
    }
    get onDidChangeQueryServerConfiguration() {
        return this._onDidChangeConfiguration.event;
    }
    handleDidChangeConfiguration(e) {
        this.handleDidChangeConfigurationForRelevantSettings(QUERY_SERVER_RESTARTING_SETTINGS, e);
    }
}
exports.QueryServerConfigListener = QueryServerConfigListener;
class QueryHistoryConfigListener extends ConfigListener {
    handleDidChangeConfiguration(e) {
        this.handleDidChangeConfigurationForRelevantSettings(QUERY_HISTORY_SETTINGS, e);
    }
    get onDidChangeQueryHistoryConfiguration() {
        return this._onDidChangeConfiguration.event;
    }
    get format() {
        return QUERY_HISTORY_FORMAT_SETTING.getValue();
    }
}
exports.QueryHistoryConfigListener = QueryHistoryConfigListener;

//# sourceMappingURL=config.js.map
