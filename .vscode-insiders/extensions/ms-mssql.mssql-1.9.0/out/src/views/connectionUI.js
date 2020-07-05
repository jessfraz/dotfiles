/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const connectionCredentials_1 = require("../models/connectionCredentials");
const connectionProfile_1 = require("../models/connectionProfile");
const interfaces_1 = require("../models/interfaces");
const question_1 = require("../prompts/question");
const utils_1 = require("../models/utils");
const Utils = require("../models/utils");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const objectExplorerUtils_1 = require("../objectExplorer/objectExplorerUtils");
/**
 * The different tasks for managing connection profiles.
 */
var ManageProfileTask;
(function (ManageProfileTask) {
    ManageProfileTask[ManageProfileTask["Create"] = 1] = "Create";
    ManageProfileTask[ManageProfileTask["ClearRecentlyUsed"] = 2] = "ClearRecentlyUsed";
    ManageProfileTask[ManageProfileTask["Edit"] = 3] = "Edit";
    ManageProfileTask[ManageProfileTask["Remove"] = 4] = "Remove";
})(ManageProfileTask || (ManageProfileTask = {}));
class ConnectionUI {
    constructor(_connectionManager, _connectionStore, _prompter, _vscodeWrapper) {
        this._connectionManager = _connectionManager;
        this._connectionStore = _connectionStore;
        this._prompter = _prompter;
        this._vscodeWrapper = _vscodeWrapper;
        if (!this._vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._errorOutputChannel = this._vscodeWrapper.createOutputChannel(LocalizedConstants.connectionErrorChannelName);
    }
    get connectionManager() {
        return this._connectionManager;
    }
    /**
     * Exposed for testing purposes
     */
    get vscodeWrapper() {
        return this._vscodeWrapper;
    }
    /**
     * Exposed for testing purposes
     */
    set vscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    // Show connection errors in an output window
    showConnectionErrors(errorMessages) {
        this._errorOutputChannel.clear();
        this._errorOutputChannel.append(errorMessages);
        this._errorOutputChannel.show(true);
    }
    // Helper to let user choose a connection from a picklist
    // Return the ConnectionInfo for the user's choice
    showConnections(showExistingConnections = true) {
        const self = this;
        return new Promise((resolve, reject) => {
            let picklist;
            if (showExistingConnections) {
                picklist = self._connectionStore.getPickListItems();
            }
            else {
                picklist = [];
            }
            if (picklist.length === 0) {
                // No connections - go to the create profile workflow
                self.createAndSaveProfile().then(resolvedProfile => {
                    resolve(resolvedProfile);
                });
            }
            else {
                // We have recent connections - show them in a picklist
                self.promptItemChoice({
                    placeHolder: LocalizedConstants.recentConnectionsPlaceholder,
                    matchOnDescription: true
                }, picklist)
                    .then(selection => {
                    if (selection) {
                        resolve(self.handleSelectedConnection(selection));
                    }
                    else {
                        resolve(undefined);
                    }
                });
            }
        });
    }
    promptLanguageFlavor() {
        const self = this;
        return new Promise((resolve, reject) => {
            let picklist = [
                {
                    label: LocalizedConstants.mssqlProviderName,
                    description: LocalizedConstants.flavorDescriptionMssql,
                    providerId: Constants.mssqlProviderName
                },
                {
                    label: LocalizedConstants.noneProviderName,
                    description: LocalizedConstants.flavorDescriptionNone,
                    providerId: Constants.noneProviderName
                }
            ];
            self.promptItemChoice({
                placeHolder: LocalizedConstants.flavorChooseLanguage,
                matchOnDescription: true
            }, picklist).then(selection => {
                if (selection) {
                    resolve(selection.providerId);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    // requests the user to choose an item from the list
    promptItemChoice(options, choices) {
        let question = {
            type: question_1.QuestionTypes.expand,
            name: 'question',
            message: options.placeHolder,
            matchOptions: options,
            choices: choices
        };
        return this._prompter.promptSingle(question);
    }
    /**
     * Helper for waitForLanguageModeToBeSql() method.
     */
    waitForLanguageModeToBeSqlHelper(resolve, timer) {
        if (timer.getDuration() > Constants.timeToWaitForLanguageModeChange) {
            resolve(false);
        }
        else if (this.vscodeWrapper.isEditingSqlFile) {
            resolve(true);
        }
        else {
            setTimeout(this.waitForLanguageModeToBeSqlHelper.bind(this, resolve, timer), 50);
        }
    }
    /**
     * Wait for up to 10 seconds for the language mode to change to SQL.
     */
    waitForLanguageModeToBeSql() {
        const self = this;
        return new Promise((resolve, reject) => {
            let timer = new utils_1.Timer();
            timer.start();
            self.waitForLanguageModeToBeSqlHelper(resolve, timer);
        });
    }
    /**
     * Prompt the user if they would like to cancel connecting.
     */
    promptToCancelConnection() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgPromptCancelConnect,
                message: LocalizedConstants.msgPromptCancelConnect
            };
            self._prompter.promptSingle(question).then(result => {
                resolve(result ? true : false);
            }).catch(err => {
                resolve(false);
            });
        });
    }
    /**
     * Prompt the user for password
     */
    promptForPassword() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.password,
                name: LocalizedConstants.passwordPrompt,
                message: LocalizedConstants.passwordPrompt,
                placeHolder: LocalizedConstants.passwordPlaceholder
            };
            self._prompter.promptSingle(question).then((result) => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }
    /**
     * Prompt the user to change language mode to SQL.
     * @returns resolves to true if the user changed the language mode to SQL.
     */
    promptToChangeLanguageMode() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgChangeLanguageMode,
                message: LocalizedConstants.msgChangeLanguageMode
            };
            self._prompter.promptSingle(question).then(value => {
                if (value) {
                    this._vscodeWrapper.executeCommand('workbench.action.editor.changeLanguageMode').then(() => {
                        self.waitForLanguageModeToBeSql().then(result => {
                            resolve(result);
                        });
                    });
                }
                else {
                    resolve(false);
                }
            }).catch(err => {
                resolve(false);
            });
        });
    }
    // Helper to let the user choose a database on the current server
    showDatabasesOnCurrentServer(currentCredentials, databaseNames) {
        const self = this;
        return new Promise((resolve, reject) => {
            const pickListItems = databaseNames.map(name => {
                let newCredentials = {};
                Object.assign(newCredentials, currentCredentials);
                if (newCredentials['profileName']) {
                    delete newCredentials['profileName'];
                }
                newCredentials.database = name;
                return {
                    label: name,
                    description: '',
                    detail: '',
                    connectionCreds: newCredentials,
                    quickPickItemType: interfaces_1.CredentialsQuickPickItemType.Mru
                };
            });
            // Add an option to disconnect from the current server
            const disconnectItem = {
                label: LocalizedConstants.disconnectOptionLabel,
                description: LocalizedConstants.disconnectOptionDescription
            };
            pickListItems.push(disconnectItem);
            const pickListOptions = {
                placeHolder: LocalizedConstants.msgChooseDatabasePlaceholder
            };
            // show database picklist, and modify the current connection to switch the active database
            self.vscodeWrapper.showQuickPick(pickListItems, pickListOptions).then(selection => {
                if (selection === disconnectItem) {
                    self.handleDisconnectChoice().then(() => resolve(undefined), err => reject(err));
                }
                else if (typeof selection !== 'undefined') {
                    resolve(selection.connectionCreds);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    handleDisconnectChoice() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.disconnectConfirmationMsg,
                message: LocalizedConstants.disconnectConfirmationMsg
            };
            self._prompter.promptSingle(question).then(result => {
                if (result === true) {
                    self.connectionManager.onDisconnect().then(() => resolve(), err => reject(err));
                }
                else {
                    resolve();
                }
            }, err => reject(err));
        });
    }
    createProfileWithDifferentCredentials(connection) {
        return new Promise((resolve, reject) => {
            this.promptForRetryConnectWithDifferentCredentials().then(result => {
                if (result) {
                    let connectionWithoutCredentials = Object.assign({}, connection, { user: '', password: '', emptyPasswordInput: false });
                    connectionCredentials_1.ConnectionCredentials.ensureRequiredPropertiesSet(connectionWithoutCredentials, // connection profile
                    true, // isProfile
                    false, // isPasswordRequired
                    true, // wasPasswordEmptyInConfigFile
                    this._prompter, this._connectionStore, connection).then(connectionResult => {
                        resolve(connectionResult);
                    }, error => {
                        reject(error);
                    });
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    handleSelectedConnection(selection) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (selection !== undefined) {
                let connectFunc;
                if (selection.quickPickItemType === interfaces_1.CredentialsQuickPickItemType.NewConnection) {
                    // call the workflow to create a new connection
                    connectFunc = self.createAndSaveProfile();
                }
                else {
                    // user chose a connection from picklist. Prompt for mandatory info that's missing (e.g. username and/or password)
                    connectFunc = self.fillOrPromptForMissingInfo(selection);
                }
                connectFunc.then((resolvedConnectionCreds) => {
                    if (!resolvedConnectionCreds) {
                        resolve(undefined);
                    }
                    resolve(resolvedConnectionCreds);
                }, err => reject(err));
            }
            else {
                resolve(undefined);
            }
        });
    }
    promptToClearRecentConnectionsList() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgPromptClearRecentConnections,
                message: LocalizedConstants.msgPromptClearRecentConnections
            };
            self._prompter.promptSingle(question).then(result => {
                resolve(result ? true : false);
            }).catch(err => {
                resolve(false);
            });
        });
    }
    promptToManageProfiles() {
        const self = this;
        return new Promise((resolve, reject) => {
            // Create profile, clear recent connections, edit profiles, or remove profile?
            let choices = [
                { name: LocalizedConstants.CreateProfileLabel, value: ManageProfileTask.Create },
                { name: LocalizedConstants.ClearRecentlyUsedLabel, value: ManageProfileTask.ClearRecentlyUsed },
                { name: LocalizedConstants.EditProfilesLabel, value: ManageProfileTask.Edit },
                { name: LocalizedConstants.RemoveProfileLabel, value: ManageProfileTask.Remove }
            ];
            let question = {
                type: question_1.QuestionTypes.expand,
                name: LocalizedConstants.ManageProfilesPrompt,
                message: LocalizedConstants.ManageProfilesPrompt,
                choices: choices,
                onAnswered: (value) => {
                    switch (value) {
                        case ManageProfileTask.Create:
                            self.connectionManager.onCreateProfile().then(result => {
                                resolve(result);
                            });
                            break;
                        case ManageProfileTask.ClearRecentlyUsed:
                            self.promptToClearRecentConnectionsList().then(result => {
                                if (result) {
                                    self.connectionManager.clearRecentConnectionsList().then(() => {
                                        self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgClearedRecentConnections);
                                        resolve(true);
                                    });
                                }
                                else {
                                    resolve(false);
                                }
                            });
                            break;
                        case ManageProfileTask.Edit:
                            self.vscodeWrapper.executeCommand('workbench.action.openGlobalSettings').then(() => {
                                resolve(true);
                            });
                            break;
                        case ManageProfileTask.Remove:
                            self.connectionManager.onRemoveProfile().then(result => {
                                resolve(result);
                            });
                            break;
                        default:
                            resolve(false);
                            break;
                    }
                }
            };
            this._prompter.promptSingle(question);
        });
    }
    /**
     * Calls the create profile workflow
     * @param validate whether the profile should be connected to and validated before saving
     * @returns undefined if profile creation failed
     */
    createAndSaveProfile(validate = true) {
        let self = this;
        return self.promptForCreateProfile()
            .then(profile => {
            if (profile) {
                if (validate) {
                    // Validate the profile before saving
                    return self.validateAndSaveProfile(profile);
                }
                else {
                    // Save the profile without validation
                    return self.saveProfile(profile);
                }
            }
            return undefined;
        }).then(savedProfile => {
            if (savedProfile) {
                if (validate) {
                    self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgProfileCreatedAndConnected);
                }
                else {
                    self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgProfileCreated);
                }
            }
            return savedProfile;
        });
    }
    /**
     * Validate a connection profile by connecting to it, and save it if we are successful.
     */
    validateAndSaveProfile(profile) {
        const self = this;
        let uri = self.vscodeWrapper.activeTextEditorUri;
        if (!uri || !self.vscodeWrapper.isEditingSqlFile) {
            uri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUriFromProfile(profile);
        }
        return self.connectionManager.connect(uri, profile).then((result) => __awaiter(this, void 0, void 0, function* () {
            if (result) {
                // Success! save it
                return self.saveProfile(profile);
            }
            else {
                // Check whether the error was for firewall rule or not
                if (self.connectionManager.failedUriToFirewallIpMap.has(uri)) {
                    // Firewall rule error
                    const clientIp = this.connectionManager.failedUriToFirewallIpMap.get(uri);
                    let success = yield this.handleFirewallError(uri, profile, clientIp);
                    if (success) {
                        // Retry creating the profile if firewall rule
                        // was successful
                        self.connectionManager.failedUriToFirewallIpMap.delete(uri);
                        return self.validateAndSaveProfile(profile);
                    }
                    return undefined;
                }
                else {
                    // Normal connection error! Let the user try again, prefilling values that they already entered
                    return self.promptToRetryAndSaveProfile(profile);
                }
            }
        }));
    }
    /**
     * Method to handle a firewall error. Returns true if a firewall rule was successfully added, and
     * false otherwise
     */
    handleFirewallError(uri, profile, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check whether the azure account extension is installed and active
            if (this._vscodeWrapper.azureAccountExtensionActive) {
                // Sign in to azure account
                const signedIn = yield this.promptForAccountSignIn();
                if (signedIn) {
                    // Create a firewall rule for the server
                    let success = yield this.createFirewallRule(profile, profile.server, ipAddress);
                    if (success) {
                        this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgPromptFirewallRuleCreated);
                    }
                    return success;
                }
            }
            else {
                // If the extension exists but not active
                if (this._vscodeWrapper.azureAccountExtension) {
                    yield this._vscodeWrapper.azureAccountExtension.activate();
                    return this.handleExtensionActivation();
                }
                else {
                    // Show recommendation to download the azure account extension
                    const selection = yield this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgPromptRetryFirewallRuleExtNotInstalled, LocalizedConstants.downloadAndInstallLabel);
                    if (selection === LocalizedConstants.downloadAndInstallLabel) {
                        yield this._vscodeWrapper.executeCommand(Constants.cmdOpenExtension, Constants.azureAccountExtensionId);
                        this._vscodeWrapper.onDidChangeExtensions((e) => __awaiter(this, void 0, void 0, function* () {
                            // Activate the Azure Account extension and call the function again
                            if (this._vscodeWrapper.azureAccountExtension) {
                                yield this._vscodeWrapper.azureAccountExtension.activate();
                                yield this.handleExtensionActivation();
                            }
                        }));
                    }
                    return false;
                }
            }
        });
    }
    /**
     * Save a connection profile using the connection store
     */
    saveProfile(profile) {
        return this._connectionStore.saveProfile(profile);
    }
    promptForCreateProfile() {
        return connectionProfile_1.ConnectionProfile.createProfile(this._prompter, this._connectionStore);
    }
    promptToRetryAndSaveProfile(profile, isFirewallError = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedProfile = yield this.promptForRetryCreateProfile(profile, isFirewallError);
            if (updatedProfile) {
                return this.validateAndSaveProfile(updatedProfile);
            }
            else {
                return undefined;
            }
        });
    }
    promptForRetryCreateProfile(profile, isFirewallError = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ask if the user would like to fix the profile
            let errorMessage = isFirewallError ? LocalizedConstants.msgPromptRetryFirewallRuleAdded : LocalizedConstants.msgPromptRetryCreateProfile;
            return this._vscodeWrapper.showErrorMessage(errorMessage, LocalizedConstants.retryLabel).then(result => {
                if (result === LocalizedConstants.retryLabel) {
                    return connectionProfile_1.ConnectionProfile.createProfile(this._prompter, this._connectionStore, profile);
                }
                else {
                    return undefined;
                }
            });
        });
    }
    showSignInOptions() {
        return this.promptItemChoice({}, Utils.getSignInQuickPickItems()).then((selection) => {
            if (selection && selection.command) {
                return this._vscodeWrapper.executeCommand(selection.command).then(() => {
                    this.connectionManager.firewallService.isSignedIn = true;
                    return true;
                });
            }
            else {
                return false;
            }
        });
    }
    handleExtensionActivation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._vscodeWrapper.isAccountSignedIn) {
                const result = yield this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgPromptAzureExtensionActivatedNotSignedIn, LocalizedConstants.signInLabel);
                if (result === LocalizedConstants.signInLabel) {
                    return this.showSignInOptions();
                }
                return false;
            }
            else {
                return true;
            }
        });
    }
    promptForAccountSignIn() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._vscodeWrapper.isAccountSignedIn) {
                return this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgPromptRetryFirewallRuleNotSignedIn, LocalizedConstants.signInLabel).then(result => {
                    if (result === LocalizedConstants.signInLabel) {
                        // show firewall dialog with all sign-in options
                        return this.showSignInOptions();
                    }
                    else {
                        return false;
                    }
                });
            }
            else {
                this.connectionManager.firewallService.isSignedIn = true;
                return true;
            }
        });
    }
    promptForIpAddress(startIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let questions = [
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.startIpAddressPrompt,
                    message: LocalizedConstants.startIpAddressPrompt,
                    placeHolder: startIpAddress,
                    default: startIpAddress,
                    validate: (value) => {
                        if (!Number.parseFloat(value) || !value.match(Constants.ipAddressRegex)) {
                            return LocalizedConstants.msgInvalidIpAddress;
                        }
                    },
                },
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.endIpAddressPrompt,
                    message: LocalizedConstants.endIpAddressPrompt,
                    placeHolder: startIpAddress,
                    validate: (value) => {
                        if (!Number.parseFloat(value) || !value.match(Constants.ipAddressRegex) ||
                            (Number.parseFloat(value) > Number.parseFloat(startIpAddress))) {
                            return LocalizedConstants.msgInvalidIpAddress;
                        }
                    },
                    default: startIpAddress
                }
            ];
            // Prompt and return the value if the user confirmed
            return this._prompter.prompt(questions).then((answers) => {
                if (answers) {
                    let result = {
                        startIpAddress: answers[LocalizedConstants.startIpAddressPrompt] ?
                            answers[LocalizedConstants.startIpAddressPrompt] : startIpAddress,
                        endIpAddress: answers[LocalizedConstants.endIpAddressPrompt] ?
                            answers[LocalizedConstants.endIpAddressPrompt] : startIpAddress,
                    };
                    return result;
                }
            });
        });
    }
    createFirewallRule(profile, serverName, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgPromptRetryFirewallRuleSignedIn, LocalizedConstants.createFirewallRuleLabel).then((result) => __awaiter(this, void 0, void 0, function* () {
                if (result === LocalizedConstants.createFirewallRuleLabel) {
                    const firewallService = this.connectionManager.firewallService;
                    let ipRange = yield this.promptForIpAddress(ipAddress);
                    if (ipRange) {
                        let firewallResult = yield firewallService.createFirewallRule(serverName, ipRange.startIpAddress, ipRange.endIpAddress);
                        if (firewallResult.result) {
                            return true;
                        }
                        else {
                            Utils.showErrorMsg(firewallResult.errorMessage);
                            return false;
                        }
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }));
        });
    }
    promptForRetryConnectWithDifferentCredentials() {
        // Ask if the user would like to fix the profile
        return this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgPromptRetryConnectionDifferentCredentials, LocalizedConstants.retryLabel).then(result => {
            if (result === LocalizedConstants.retryLabel) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    fillOrPromptForMissingInfo(selection) {
        // If a connection string is present, don't prompt for any other info
        if (selection.connectionCreds.connectionString) {
            return new Promise((resolve, reject) => {
                resolve(selection.connectionCreds);
            });
        }
        const passwordEmptyInConfigFile = Utils.isEmpty(selection.connectionCreds.password);
        return this._connectionStore.addSavedPassword(selection)
            .then(sel => {
            return connectionCredentials_1.ConnectionCredentials.ensureRequiredPropertiesSet(sel.connectionCreds, selection.quickPickItemType === interfaces_1.CredentialsQuickPickItemType.Profile, false, passwordEmptyInConfigFile, this._prompter, this._connectionStore);
        });
    }
    // Prompts the user to pick a profile for removal, then removes from the global saved state
    removeProfile() {
        let self = this;
        // Flow: Select profile to remove, confirm removal, remove, notify
        let profiles = self._connectionStore.getProfilePickListItems(false);
        return self.selectProfileForRemoval(profiles)
            .then(profile => {
            if (profile) {
                return self._connectionStore.removeProfile(profile);
            }
            return false;
        }).then(result => {
            if (result) {
                // TODO again consider moving information prompts to the prompt package
                this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgProfileRemoved);
            }
            return result;
        });
    }
    selectProfileForRemoval(profiles) {
        let self = this;
        if (!profiles || profiles.length === 0) {
            // Inform the user we have no profiles available for deletion
            // TODO: consider moving to prompter if we separate all UI logic from workflows in the future
            this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgNoProfilesSaved);
            return Promise.resolve(undefined);
        }
        let chooseProfile = 'ChooseProfile';
        let confirm = 'ConfirmRemoval';
        let questions = [
            {
                // 1: what profile should we remove?
                type: question_1.QuestionTypes.expand,
                name: chooseProfile,
                message: LocalizedConstants.msgSelectProfileToRemove,
                matchOptions: { matchOnDescription: true },
                choices: profiles
            },
            {
                // 2: Confirm removal before proceeding
                type: question_1.QuestionTypes.confirm,
                name: confirm,
                message: LocalizedConstants.confirmRemoveProfilePrompt
            }
        ];
        // Prompt and return the value if the user confirmed
        return self._prompter.prompt(questions).then(answers => {
            if (answers && answers[confirm]) {
                let profilePickItem = answers[chooseProfile];
                return profilePickItem.connectionCreds;
            }
            else {
                return undefined;
            }
        });
    }
}
exports.ConnectionUI = ConnectionUI;

//# sourceMappingURL=connectionUI.js.map
