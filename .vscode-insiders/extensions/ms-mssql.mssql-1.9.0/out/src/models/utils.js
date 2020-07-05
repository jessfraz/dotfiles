/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const getmac = require("getmac");
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const findRemoveSync = require("find-remove");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const interfaces_1 = require("./interfaces");
const LocalizedConstants = require("../constants/localizedConstants");
const fs = require("fs");
// CONSTANTS //////////////////////////////////////////////////////////////////////////////////////
const msInH = 3.6e6;
const msInM = 60000;
const msInS = 1000;
const configTracingLevel = 'tracingLevel';
const configLogRetentionMinutes = 'logRetentionMinutes';
const configLogFilesRemovalLimit = 'logFilesRemovalLimit';
const extensionConfigSectionName = 'mssql';
const configLogDebugInfo = 'logDebugInfo';
// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
// Get information from the extension's package.json file
function getPackageInfo(context) {
    let extensionPackage = require(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
}
exports.getPackageInfo = getPackageInfo;
// Generate a new GUID
function generateGuid() {
    let hexValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    // c.f. rfc4122 (UUID version 4 = xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    let oct = '';
    let tmp;
    /* tslint:disable:no-bitwise */
    for (let a = 0; a < 4; a++) {
        tmp = (4294967296 * Math.random()) | 0;
        oct += hexValues[tmp & 0xF] +
            hexValues[tmp >> 4 & 0xF] +
            hexValues[tmp >> 8 & 0xF] +
            hexValues[tmp >> 12 & 0xF] +
            hexValues[tmp >> 16 & 0xF] +
            hexValues[tmp >> 20 & 0xF] +
            hexValues[tmp >> 24 & 0xF] +
            hexValues[tmp >> 28 & 0xF];
    }
    // 'Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively'
    let clockSequenceHi = hexValues[8 + (Math.random() * 4) | 0];
    return oct.substr(0, 8) + '-' + oct.substr(9, 4) + '-4' + oct.substr(13, 3) + '-' + clockSequenceHi + oct.substr(16, 3) + '-' + oct.substr(19, 12);
    /* tslint:enable:no-bitwise */
}
exports.generateGuid = generateGuid;
// Generate a unique, deterministic ID for the current user of the extension
function generateUserId() {
    return new Promise(resolve => {
        try {
            getmac.getMac((error, macAddress) => {
                if (!error) {
                    resolve(crypto.createHash('sha256').update(macAddress + os.homedir(), 'utf8').digest('hex'));
                }
                else {
                    resolve(generateGuid()); // fallback
                }
            });
        }
        catch (err) {
            resolve(generateGuid()); // fallback
        }
    });
}
exports.generateUserId = generateUserId;
// Return 'true' if the active editor window has a .sql file, false otherwise
function isEditingSqlFile() {
    let sqlFile = false;
    let editor = getActiveTextEditor();
    if (editor) {
        if (editor.document.languageId === Constants.languageId) {
            sqlFile = true;
        }
    }
    return sqlFile;
}
exports.isEditingSqlFile = isEditingSqlFile;
// Return the active text editor if there's one
function getActiveTextEditor() {
    let editor = undefined;
    if (vscode.window && vscode.window.activeTextEditor) {
        editor = vscode.window.activeTextEditor;
    }
    return editor;
}
exports.getActiveTextEditor = getActiveTextEditor;
// Retrieve the URI for the currently open file if there is one; otherwise return the empty string
function getActiveTextEditorUri() {
    if (typeof vscode.window.activeTextEditor !== 'undefined' &&
        typeof vscode.window.activeTextEditor.document !== 'undefined') {
        return vscode.window.activeTextEditor.document.uri.toString(true);
    }
    return '';
}
exports.getActiveTextEditorUri = getActiveTextEditorUri;
// Helper to log messages to "MSSQL" output channel
function logToOutputChannel(msg) {
    let outputChannel = vscode.window.createOutputChannel(Constants.outputChannelName);
    outputChannel.show();
    if (msg instanceof Array) {
        msg.forEach(element => {
            outputChannel.appendLine(element.toString());
        });
    }
    else {
        outputChannel.appendLine(msg.toString());
    }
}
exports.logToOutputChannel = logToOutputChannel;
// Helper to log debug messages
function logDebug(msg) {
    let config = vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
    let logDebugInfo = config.get(Constants.configLogDebugInfo);
    if (logDebugInfo === true) {
        let currentTime = new Date().toLocaleTimeString();
        let outputMsg = '[' + currentTime + ']: ' + msg ? msg.toString() : '';
        console.log(outputMsg);
    }
}
exports.logDebug = logDebug;
// Helper to show an info message
function showInfoMsg(msg) {
    vscode.window.showInformationMessage(Constants.extensionName + ': ' + msg);
}
exports.showInfoMsg = showInfoMsg;
// Helper to show an warn message
function showWarnMsg(msg) {
    vscode.window.showWarningMessage(Constants.extensionName + ': ' + msg);
}
exports.showWarnMsg = showWarnMsg;
// Helper to show an error message
function showErrorMsg(msg) {
    vscode.window.showErrorMessage(Constants.extensionName + ': ' + msg);
}
exports.showErrorMsg = showErrorMsg;
function isEmpty(str) {
    return (!str || '' === str);
}
exports.isEmpty = isEmpty;
function isNotEmpty(str) {
    return (str && '' !== str);
}
exports.isNotEmpty = isNotEmpty;
function authTypeToString(value) {
    return interfaces_1.AuthenticationTypes[value];
}
exports.authTypeToString = authTypeToString;
function escapeClosingBrackets(str) {
    return str.replace(']', ']]');
}
exports.escapeClosingBrackets = escapeClosingBrackets;
/**
 * Format a string. Behaves like C#'s string.Format() function.
 */
function formatString(str, ...args) {
    // This is based on code originally from https://github.com/Microsoft/vscode/blob/master/src/vs/nls.js
    // License: https://github.com/Microsoft/vscode/blob/master/LICENSE.txt
    let result;
    if (args.length === 0) {
        result = str;
    }
    else {
        result = str.replace(/\{(\d+)\}/g, (match, rest) => {
            let index = rest[0];
            return typeof args[index] !== 'undefined' ? args[index] : match;
        });
    }
    return result;
}
exports.formatString = formatString;
/**
 * Compares 2 database names to see if they are the same.
 * If either is undefined or empty, it is assumed to be 'master'
 */
function isSameDatabase(currentDatabase, expectedDatabase) {
    if (isEmpty(currentDatabase)) {
        currentDatabase = Constants.defaultDatabase;
    }
    if (isEmpty(expectedDatabase)) {
        expectedDatabase = Constants.defaultDatabase;
    }
    return currentDatabase === expectedDatabase;
}
/**
 * Compares 2 authentication type strings to see if they are the same.
 * If either is undefined or empty, then it is assumed to be SQL authentication by default.
 */
function isSameAuthenticationType(currentAuthenticationType, expectedAuthenticationType) {
    if (isEmpty(currentAuthenticationType)) {
        currentAuthenticationType = Constants.sqlAuthentication;
    }
    if (isEmpty(expectedAuthenticationType)) {
        expectedAuthenticationType = Constants.sqlAuthentication;
    }
    return currentAuthenticationType === expectedAuthenticationType;
}
/**
 * Compares 2 profiles to see if they match. Logic for matching:
 * If a profile name is used, can simply match on this.
 * If not, match on all key properties (server, db, auth type, user) being identical.
 * Other properties are ignored for this purpose
 *
 * @param {IConnectionProfile} currentProfile the profile to check
 * @param {IConnectionProfile} expectedProfile the profile to try to match
 * @returns boolean that is true if the profiles match
 */
function isSameProfile(currentProfile, expectedProfile) {
    if (currentProfile === undefined) {
        return false;
    }
    if (expectedProfile.profileName) {
        // Can match on profile name
        return expectedProfile.profileName === currentProfile.profileName;
    }
    else if (currentProfile.profileName) {
        // This has a profile name but expected does not - can break early
        return false;
    }
    else if (currentProfile.connectionString || expectedProfile.connectionString) {
        // If either profile uses connection strings, compare them directly
        return currentProfile.connectionString === expectedProfile.connectionString;
    }
    return expectedProfile.server === currentProfile.server
        && isSameDatabase(expectedProfile.database, currentProfile.database)
        && isSameAuthenticationType(expectedProfile.authenticationType, currentProfile.authenticationType)
        && ((isEmpty(expectedProfile.user) && isEmpty(currentProfile.user)) || expectedProfile.user === currentProfile.user);
}
exports.isSameProfile = isSameProfile;
/**
 * Compares 2 connections to see if they match. Logic for matching:
 * match on all key properties (connectionString or server, db, auth type, user) being identical.
 * Other properties are ignored for this purpose
 *
 * @param {IConnectionCredentials} conn the connection to check
 * @param {IConnectionCredentials} expectedConn the connection to try to match
 * @returns boolean that is true if the connections match
 */
function isSameConnection(conn, expectedConn) {
    return (conn.connectionString || expectedConn.connectionString) ? conn.connectionString === expectedConn.connectionString :
        expectedConn.server === conn.server
            && isSameDatabase(expectedConn.database, conn.database)
            && isSameAuthenticationType(expectedConn.authenticationType, conn.authenticationType)
            && (conn.authenticationType === Constants.sqlAuthentication ?
                conn.user === expectedConn.user :
                isEmpty(conn.user) === isEmpty(expectedConn.user))
            && conn.savePassword ===
                expectedConn.savePassword;
}
exports.isSameConnection = isSameConnection;
/**
 * Check if a file exists on disk
 */
function isFileExisting(filePath) {
    try {
        fs.statSync(filePath);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.isFileExisting = isFileExisting;
// One-time use timer for performance testing
class Timer {
    constructor() {
        this.start();
    }
    // Get the duration of time elapsed by the timer, in milliseconds
    getDuration() {
        if (!this._startTime) {
            return -1;
        }
        else if (!this._endTime) {
            let endTime = process.hrtime(this._startTime);
            return endTime[0] * 1000 + endTime[1] / 1000000;
        }
        else {
            return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
        }
    }
    start() {
        this._startTime = process.hrtime();
    }
    end() {
        if (!this._endTime) {
            this._endTime = process.hrtime(this._startTime);
        }
    }
}
exports.Timer = Timer;
/**
 * Takes a string in the format of HH:MM:SS.MS and returns a number representing the time in
 * miliseconds
 * @param value The string to convert to milliseconds
 * @return False is returned if the string is an invalid format,
 *         the number of milliseconds in the time string is returned otherwise.
 */
function parseTimeString(value) {
    if (!value) {
        return false;
    }
    let tempVal = value.split('.');
    if (tempVal.length === 1) {
        // Ideally would handle more cleanly than this but for now handle case where ms not set
        tempVal = [tempVal[0], '0'];
    }
    else if (tempVal.length !== 2) {
        return false;
    }
    let msString = tempVal[1];
    let msStringEnd = msString.length < 3 ? msString.length : 3;
    let ms = parseInt(tempVal[1].substring(0, msStringEnd), 10);
    tempVal = tempVal[0].split(':');
    if (tempVal.length !== 3) {
        return false;
    }
    let h = parseInt(tempVal[0], 10);
    let m = parseInt(tempVal[1], 10);
    let s = parseInt(tempVal[2], 10);
    return ms + (h * msInH) + (m * msInM) + (s * msInS);
}
exports.parseTimeString = parseTimeString;
function isBoolean(obj) {
    return obj === true || obj === false;
}
exports.isBoolean = isBoolean;
/**
 * Takes a number of milliseconds and converts it to a string like HH:MM:SS.fff
 * @param value The number of milliseconds to convert to a timespan string
 * @returns A properly formatted timespan string.
 */
function parseNumAsTimeString(value) {
    let tempVal = value;
    let h = Math.floor(tempVal / msInH);
    tempVal %= msInH;
    let m = Math.floor(tempVal / msInM);
    tempVal %= msInM;
    let s = Math.floor(tempVal / msInS);
    tempVal %= msInS;
    let hs = h < 10 ? '0' + h : '' + h;
    let ms = m < 10 ? '0' + m : '' + m;
    let ss = s < 10 ? '0' + s : '' + s;
    let mss = tempVal < 10 ? '00' + tempVal : tempVal < 100 ? '0' + tempVal : '' + tempVal;
    let rs = hs + ':' + ms + ':' + ss;
    return tempVal > 0 ? rs + '.' + mss : rs;
}
exports.parseNumAsTimeString = parseNumAsTimeString;
function getConfiguration() {
    return vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
}
function getConfigTracingLevel() {
    let config = getConfiguration();
    if (config) {
        return config.get(configTracingLevel);
    }
    else {
        return undefined;
    }
}
exports.getConfigTracingLevel = getConfigTracingLevel;
function getConfigLogFilesRemovalLimit() {
    let config = getConfiguration();
    if (config) {
        return Number((config.get(configLogFilesRemovalLimit, 0).toFixed(0)));
    }
    else {
        return undefined;
    }
}
exports.getConfigLogFilesRemovalLimit = getConfigLogFilesRemovalLimit;
function getConfigLogRetentionSeconds() {
    let config = getConfiguration();
    if (config) {
        return Number((config.get(configLogRetentionMinutes, 0) * 60).toFixed(0));
    }
    else {
        return undefined;
    }
}
exports.getConfigLogRetentionSeconds = getConfigLogRetentionSeconds;
function removeOldLogFiles(logPath, prefix) {
    return findRemoveSync(logPath, { age: { seconds: getConfigLogRetentionSeconds() }, limit: getConfigLogFilesRemovalLimit() });
}
exports.removeOldLogFiles = removeOldLogFiles;
function getCommonLaunchArgsAndCleanupOldLogFiles(logPath, fileName, executablePath) {
    let launchArgs = [];
    launchArgs.push('--log-file');
    let logFile = path.join(logPath, fileName);
    launchArgs.push(logFile);
    console.log(`logFile for ${path.basename(executablePath)} is ${logFile}`);
    console.log(`This process (ui Extenstion Host) is pid: ${process.pid}`);
    // Delete old log files
    let deletedLogFiles = removeOldLogFiles(logPath, fileName);
    console.log(`Old log files deletion report: ${JSON.stringify(deletedLogFiles)}`);
    launchArgs.push('--tracing-level');
    launchArgs.push(getConfigTracingLevel());
    return launchArgs;
}
exports.getCommonLaunchArgsAndCleanupOldLogFiles = getCommonLaunchArgsAndCleanupOldLogFiles;
/**
 * Returns the all the sign in methods as quickpick items
 */
function getSignInQuickPickItems() {
    let signInItem = {
        label: LocalizedConstants.azureSignIn,
        description: LocalizedConstants.azureSignInDescription,
        command: Constants.cmdAzureSignIn
    };
    let signInWithDeviceCode = {
        label: LocalizedConstants.azureSignInWithDeviceCode,
        description: LocalizedConstants.azureSignInWithDeviceCodeDescription,
        command: Constants.cmdAzureSignInWithDeviceCode
    };
    let signInAzureCloud = {
        label: LocalizedConstants.azureSignInToAzureCloud,
        description: LocalizedConstants.azureSignInToAzureCloudDescription,
        command: Constants.cmdAzureSignInToCloud
    };
    return [signInItem, signInWithDeviceCode, signInAzureCloud];
}
exports.getSignInQuickPickItems = getSignInQuickPickItems;
/**
 * Limits the size of a string with ellipses in the middle
 */
function limitStringSize(input, forCommandPalette = false) {
    if (!forCommandPalette) {
        if (input.length > 45) {
            return `${input.substr(0, 20)}...${input.substr(input.length - 20, input.length)}`;
        }
    }
    else {
        if (input.length > 100) {
            return `${input.substr(0, 45)}...${input.substr(input.length - 45, input.length)}`;
        }
    }
    return input;
}
exports.limitStringSize = limitStringSize;

//# sourceMappingURL=utils.js.map
