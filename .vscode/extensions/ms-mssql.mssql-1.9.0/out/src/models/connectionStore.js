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
const ConnInfo = require("./connectionInfo");
const Utils = require("../models/utils");
const validationException_1 = require("../utils/validationException");
const connectionCredentials_1 = require("../models/connectionCredentials");
const interfaces_1 = require("../models/interfaces");
const credentialstore_1 = require("../credentialstore/credentialstore");
const connectionconfig_1 = require("../connectionconfig/connectionconfig");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
/**
 * Manages the connections list including saved profiles and the most recently used connections
 *
 * @export
 * @class ConnectionStore
 */
class ConnectionStore {
    constructor(_context, _credentialStore, _connectionConfig, _vscodeWrapper) {
        this._context = _context;
        this._credentialStore = _credentialStore;
        this._connectionConfig = _connectionConfig;
        this._vscodeWrapper = _vscodeWrapper;
        if (!this._credentialStore) {
            this._credentialStore = new credentialstore_1.CredentialStore();
        }
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
        if (!this._connectionConfig) {
            this._connectionConfig = new connectionconfig_1.ConnectionConfig();
        }
    }
    static get CRED_PREFIX() { return 'Microsoft.SqlTools'; }
    static get CRED_SEPARATOR() { return '|'; }
    static get CRED_SERVER_PREFIX() { return 'server:'; }
    static get CRED_DB_PREFIX() { return 'db:'; }
    static get CRED_USER_PREFIX() { return 'user:'; }
    static get CRED_ITEMTYPE_PREFIX() { return 'itemtype:'; }
    static get CRED_CONNECTION_STRING_PREFIX() { return 'isConnectionString:'; }
    static get CRED_PROFILE_USER() { return interfaces_1.CredentialsQuickPickItemType[interfaces_1.CredentialsQuickPickItemType.Profile]; }
    static get CRED_MRU_USER() { return interfaces_1.CredentialsQuickPickItemType[interfaces_1.CredentialsQuickPickItemType.Mru]; }
    static formatCredentialIdForCred(creds, itemType) {
        if (Utils.isEmpty(creds)) {
            throw new validationException_1.default('Missing Connection which is required');
        }
        let itemTypeString = ConnectionStore.CRED_PROFILE_USER;
        if (itemType) {
            itemTypeString = interfaces_1.CredentialsQuickPickItemType[itemType];
        }
        return ConnectionStore.formatCredentialId(creds.server, creds.database, creds.user, itemTypeString);
    }
    /**
     * Creates a formatted credential usable for uniquely identifying a SQL Connection.
     * This string can be decoded but is not optimized for this.
     * @static
     * @param {string} server name of the server - required
     * @param {string} database name of the database - optional
     * @param {string} user name of the user - optional
     * @param {string} itemType type of the item (MRU or Profile) - optional
     * @returns {string} formatted string with server, DB and username
     */
    static formatCredentialId(server, database, user, itemType, isConnectionString) {
        if (Utils.isEmpty(server)) {
            throw new validationException_1.default('Missing Server Name, which is required');
        }
        let cred = [ConnectionStore.CRED_PREFIX];
        if (!itemType) {
            itemType = ConnectionStore.CRED_PROFILE_USER;
        }
        ConnectionStore.pushIfNonEmpty(itemType, ConnectionStore.CRED_ITEMTYPE_PREFIX, cred);
        ConnectionStore.pushIfNonEmpty(server, ConnectionStore.CRED_SERVER_PREFIX, cred);
        ConnectionStore.pushIfNonEmpty(database, ConnectionStore.CRED_DB_PREFIX, cred);
        ConnectionStore.pushIfNonEmpty(user, ConnectionStore.CRED_USER_PREFIX, cred);
        if (isConnectionString) {
            ConnectionStore.pushIfNonEmpty('true', ConnectionStore.CRED_CONNECTION_STRING_PREFIX, cred);
        }
        return cred.join(ConnectionStore.CRED_SEPARATOR);
    }
    static pushIfNonEmpty(value, prefix, arr) {
        if (Utils.isNotEmpty(value)) {
            arr.push(prefix.concat(value));
        }
    }
    get vscodeWrapper() {
        return this._vscodeWrapper;
    }
    set vscodeWrapper(value) {
        this._vscodeWrapper = value;
    }
    /**
     * Load connections from MRU and profile list and return them as a formatted picklist.
     * Note: connections will not include password value
     *
     * @returns {Promise<IConnectionCredentialsQuickPickItem[]>}
     */
    getPickListItems() {
        let pickListItems = this.loadAllConnections(true);
        pickListItems.push({
            label: LocalizedConstants.CreateProfileFromConnectionsListLabel,
            connectionCreds: undefined,
            quickPickItemType: interfaces_1.CredentialsQuickPickItemType.NewConnection
        });
        return pickListItems;
    }
    /**
     * Gets all connection profiles stored in the user settings
     * Note: connections will not include password value
     *
     * @returns {IConnectionCredentialsQuickPickItem[]}
     */
    getProfilePickListItems(getWorkspaceProfiles) {
        return this.loadProfiles(getWorkspaceProfiles);
    }
    addSavedPassword(credentialsItem) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (typeof (credentialsItem.connectionCreds['savePassword']) === 'undefined' ||
                credentialsItem.connectionCreds['savePassword'] === false) {
                // Don't try to lookup a saved password if savePassword is set to false for the credential
                resolve(credentialsItem);
                // Note that 'emptyPasswordInput' property is only present for connection profiles
            }
            else if (self.shouldLookupSavedPassword(credentialsItem.connectionCreds)) {
                let credentialId = ConnectionStore.formatCredentialIdForCred(credentialsItem.connectionCreds, credentialsItem.quickPickItemType);
                self._credentialStore.readCredential(credentialId)
                    .then(savedCred => {
                    if (savedCred) {
                        credentialsItem.connectionCreds.password = savedCred.password;
                    }
                    resolve(credentialsItem);
                })
                    .catch(err => reject(err));
            }
            else {
                // Already have a password, no need to look up
                resolve(credentialsItem);
            }
        });
    }
    /**
     * Lookup credential store
     * @param connectionCredentials Connection credentials of profile for password lookup
     */
    lookupPassword(connectionCredentials, isConnectionString = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentialId = ConnectionStore.formatCredentialId(connectionCredentials.server, connectionCredentials.database, connectionCredentials.user, ConnectionStore.CRED_PROFILE_USER, isConnectionString);
            const savedCredential = yield this._credentialStore.readCredential(credentialId);
            if (savedCredential && savedCredential.password) {
                return savedCredential.password;
            }
            else {
                return undefined;
            }
        });
    }
    /**
     * public for testing purposes. Validates whether a password should be looked up from the credential store or not
     *
     * @param {IConnectionProfile} connectionCreds
     * @returns {boolean}
     * @memberof ConnectionStore
     */
    shouldLookupSavedPassword(connectionCreds) {
        if (connectionCredentials_1.ConnectionCredentials.isPasswordBasedCredential(connectionCreds)) {
            // Only lookup if password isn't saved in the profile, and if it was not explicitly defined
            // as a blank password
            return Utils.isEmpty(connectionCreds.password) && !connectionCreds.emptyPasswordInput;
        }
        return false;
    }
    /**
     * Saves a connection profile to the user settings.
     * Password values are stored to a separate credential store if the "savePassword" option is true
     *
     * @param {IConnectionProfile} profile the profile to save
     * @param {forceWritePlaintextPassword} whether the plaintext password should be written to the settings file
     * @returns {Promise<IConnectionProfile>} a Promise that returns the original profile, for help in chaining calls
     */
    saveProfile(profile, forceWritePlaintextPassword) {
        const self = this;
        return new Promise((resolve, reject) => {
            // Add the profile to the saved list, taking care to clear out the password field if necessary
            let savedProfile;
            if (forceWritePlaintextPassword) {
                savedProfile = Object.assign({}, profile);
            }
            else {
                savedProfile = Object.assign({}, profile, { password: '' });
            }
            self._connectionConfig.addConnection(savedProfile)
                .then(() => {
                // Only save if we successfully added the profile
                return self.saveProfilePasswordIfNeeded(profile);
                // And resolve / reject at the end of the process
            }, err => {
                reject(err);
            }).then(resolved => {
                // Add necessary default properties before returning
                // this is needed to support immediate connections
                ConnInfo.fixupConnectionCredentials(profile);
                resolve(profile);
            }, err => {
                reject(err);
            });
        });
    }
    /**
     * Gets the list of recently used connections. These will not include the password - a separate call to
     * {addSavedPassword} is needed to fill that before connecting
     *
     * @returns {IConnectionCredentials[]} the array of connections, empty if none are found
     */
    getRecentlyUsedConnections() {
        let configValues = this._context.globalState.get(Constants.configRecentConnections);
        if (!configValues) {
            configValues = [];
        }
        return configValues;
    }
    /**
     * Adds a connection to the recently used list.
     * Password values are stored to a separate credential store if the "savePassword" option is true
     *
     * @param {IConnectionCredentials} conn the connection to add
     * @returns {Promise<void>} a Promise that returns when the connection was saved
     */
    addRecentlyUsed(conn) {
        const self = this;
        return new Promise((resolve, reject) => {
            // Get all profiles
            let configValues = self.getRecentlyUsedConnections();
            let maxConnections = self.getMaxRecentConnectionsCount();
            // Remove the connection from the list if it already exists
            configValues = configValues.filter(value => !Utils.isSameProfile(value, conn));
            // Add the connection to the front of the list, taking care to clear out the password field
            let savedConn = Object.assign({}, conn, { password: '' });
            configValues.unshift(savedConn);
            // Remove last element if needed
            if (configValues.length > maxConnections) {
                configValues = configValues.slice(0, maxConnections);
            }
            self._context.globalState.update(Constants.configRecentConnections, configValues)
                .then(() => {
                // Only save if we successfully added the profile and if savePassword
                if (conn.savePassword) {
                    self.doSaveCredential(conn, interfaces_1.CredentialsQuickPickItemType.Mru);
                }
                // And resolve / reject at the end of the process
                resolve(undefined);
            }, err => {
                reject(err);
            });
        });
    }
    /**
     * Clear all recently used connections from the MRU list.
     */
    clearRecentlyUsed() {
        return __awaiter(this, void 0, void 0, function* () {
            // Update the MRU list to be empty
            try {
                yield this._context.globalState.update(Constants.configRecentConnections, []);
            }
            catch (error) {
                Promise.reject(error);
            }
        });
    }
    /**
     * Remove a connection profile from the recently used list.
     */
    removeRecentlyUsed(conn, keepCredentialStore = false) {
        const self = this;
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            // Get all profiles
            let configValues = self.getRecentlyUsedConnections();
            // Remove the connection from the list if it already exists
            configValues = configValues.filter(value => !Utils.isSameProfile(value, conn));
            // Remove any saved password
            if (conn.savePassword && !keepCredentialStore) {
                let credentialId = ConnectionStore.formatCredentialId(conn.server, conn.database, conn.user, ConnectionStore.CRED_MRU_USER);
                yield self._credentialStore.deleteCredential(credentialId);
            }
            // Update the MRU list
            self._context.globalState.update(Constants.configRecentConnections, configValues)
                .then(() => {
                // And resolve / reject at the end of the process
                resolve(undefined);
            }, err => {
                reject(err);
            });
        }));
    }
    saveProfilePasswordIfNeeded(profile) {
        if (!profile.savePassword) {
            return Promise.resolve(true);
        }
        return this.doSaveCredential(profile, interfaces_1.CredentialsQuickPickItemType.Profile);
    }
    saveProfileWithConnectionString(profile) {
        if (!profile.connectionString) {
            return Promise.resolve(true);
        }
        return this.doSaveCredential(profile, interfaces_1.CredentialsQuickPickItemType.Profile, true);
    }
    doSaveCredential(conn, type, isConnectionString = false) {
        let self = this;
        let password = isConnectionString ? conn.connectionString : conn.password;
        return new Promise((resolve, reject) => {
            if (Utils.isNotEmpty(password)) {
                let credType = type === interfaces_1.CredentialsQuickPickItemType.Mru ? ConnectionStore.CRED_MRU_USER : ConnectionStore.CRED_PROFILE_USER;
                let credentialId = ConnectionStore.formatCredentialId(conn.server, conn.database, conn.user, credType, isConnectionString);
                self._credentialStore.saveCredential(credentialId, password)
                    .then((result) => {
                    resolve(result);
                }).catch(err => {
                    // Bubble up error if there was a problem executing the set command
                    reject(err);
                });
            }
            else {
                resolve(true);
            }
        });
    }
    /**
     * Removes a profile from the user settings and deletes any related password information
     * from the credential store
     *
     * @param {IConnectionProfile} profile the profile to be removed
     * @param {Boolean} keepCredentialStore optional value to keep the credential store after a profile removal
     * @returns {Promise<boolean>} true if successful
     */
    removeProfile(profile, keepCredentialStore = false) {
        const self = this;
        return new Promise((resolve, reject) => {
            self._connectionConfig.removeConnection(profile).then(profileFound => {
                resolve(profileFound);
            }).catch(err => {
                reject(err);
            });
        }).then(profileFound => {
            // Remove the profile from the recently used list if necessary
            return new Promise((resolve, reject) => {
                self.removeRecentlyUsed(profile, keepCredentialStore).then(() => {
                    resolve(profileFound);
                }).catch(err => {
                    reject(err);
                });
            });
        }).then(profileFound => {
            // Now remove password from credential store. Currently do not care about status unless an error occurred
            if (profile.savePassword === true && !keepCredentialStore) {
                let credentialId = ConnectionStore.formatCredentialId(profile.server, profile.database, profile.user, ConnectionStore.CRED_PROFILE_USER);
                self._credentialStore.deleteCredential(credentialId).then(undefined, rejected => {
                    throw new Error(rejected);
                });
            }
            return profileFound;
        });
    }
    createQuickPickItem(item, itemType) {
        return {
            label: ConnInfo.getPicklistLabel(item, itemType),
            description: ConnInfo.getPicklistDescription(item),
            detail: ConnInfo.getPicklistDetails(item),
            connectionCreds: item,
            quickPickItemType: itemType
        };
    }
    /**
     * Deletes the password for a connection from the credential store
     * @param connectionCredential
     */
    deleteCredential(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            let credentialId = ConnectionStore.formatCredentialId(profile.server, profile.database, profile.user, ConnectionStore.CRED_PROFILE_USER);
            let result = yield this._credentialStore.deleteCredential(credentialId);
            return result;
        });
    }
    /**
     * Removes password from a saved profile and credential store
     */
    removeProfilePassword(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            // if the password is saved in the credential store, remove it
            let profile = connection;
            profile.password = '';
            yield this.saveProfile(profile);
        });
    }
    // Load connections from user preferences
    loadAllConnections(addRecentConnections = false) {
        let quickPickItems = [];
        // Read recently used items from a memento
        let recentConnections = [];
        if (addRecentConnections) {
            recentConnections = this.getConnectionsFromGlobalState(Constants.configRecentConnections);
        }
        // Load connections from user preferences
        // Per this https://code.visualstudio.com/Docs/customization/userandworkspace
        // Connections defined in workspace scope are unioned with the Connections defined in user scope
        let profilesInConfiguration = this._connectionConfig.getConnections(true);
        // Remove any duplicates that are in both recent connections and the user settings
        let profilesInRecentConnectionsList = [];
        profilesInConfiguration = profilesInConfiguration.filter(profile => {
            for (let index = 0; index < recentConnections.length; index++) {
                if (Utils.isSameProfile(profile, recentConnections[index])) {
                    if (Utils.isSameConnection(profile, recentConnections[index])) {
                        // The MRU item should reflect the current profile's settings from user preferences if it is still the same database
                        ConnInfo.fixupConnectionCredentials(profile);
                        recentConnections[index] = Object.assign({}, profile);
                        profilesInRecentConnectionsList.push(index);
                    }
                    return false;
                }
            }
            return true;
        });
        // Ensure that MRU items which are actually profiles are labeled as such
        let recentConnectionsItems = this.mapToQuickPickItems(recentConnections, interfaces_1.CredentialsQuickPickItemType.Mru);
        for (let index of profilesInRecentConnectionsList) {
            recentConnectionsItems[index].quickPickItemType = interfaces_1.CredentialsQuickPickItemType.Profile;
        }
        quickPickItems = quickPickItems.concat(recentConnectionsItems);
        quickPickItems = quickPickItems.concat(this.mapToQuickPickItems(profilesInConfiguration, interfaces_1.CredentialsQuickPickItemType.Profile));
        // Return all connections
        return quickPickItems;
    }
    getConnectionsFromGlobalState(configName) {
        let connections = [];
        // read from the global state
        let configValues = this._context.globalState.get(configName);
        this.addConnections(connections, configValues);
        return connections;
    }
    mapToQuickPickItems(connections, itemType) {
        return connections.map(c => this.createQuickPickItem(c, itemType));
    }
    loadProfiles(loadWorkspaceProfiles) {
        let connections = this._connectionConfig.getConnections(loadWorkspaceProfiles);
        let quickPickItems = connections.map(c => this.createQuickPickItem(c, interfaces_1.CredentialsQuickPickItemType.Profile));
        return quickPickItems;
    }
    addConnections(connections, configValues) {
        if (configValues) {
            for (let index = 0; index < configValues.length; index++) {
                let element = configValues[index];
                if (element.server && element.server.trim() && !element.server.trim().startsWith('{{')) {
                    let connection = ConnInfo.fixupConnectionCredentials(element);
                    connections.push(connection);
                }
                else {
                    Utils.logDebug(`Missing server name in user preferences connection: index ( ${index} ): ${element.toString()}`);
                }
            }
        }
    }
    getMaxRecentConnectionsCount() {
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let maxConnections = config[Constants.configMaxRecentConnections];
        if (typeof (maxConnections) !== 'number' || maxConnections <= 0) {
            maxConnections = 5;
        }
        return maxConnections;
    }
}
exports.ConnectionStore = ConnectionStore;

//# sourceMappingURL=connectionStore.js.map
