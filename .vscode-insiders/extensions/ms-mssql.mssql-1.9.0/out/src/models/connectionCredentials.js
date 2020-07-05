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
const LocalizedConstants = require("../constants/localizedConstants");
const connection_1 = require("./contracts/connection");
const interfaces_1 = require("./interfaces");
const utils = require("./utils");
const question_1 = require("../prompts/question");
const serviceclient_1 = require("../languageservice/serviceclient");
// Concrete implementation of the IConnectionCredentials interface
class ConnectionCredentials {
    /**
     * Create a connection details contract from connection credentials.
     */
    static createConnectionDetails(credentials) {
        let details = new connection_1.ConnectionDetails();
        details.options['connectionString'] = credentials.connectionString;
        details.options['server'] = credentials.server;
        if (credentials.port && details.options['server'].indexOf(',') === -1) {
            // Port is appended to the server name in a connection string
            details.options['server'] += (',' + credentials.port);
        }
        details.options['database'] = credentials.database;
        details.options['databaseDisplayName'] = credentials.database;
        details.options['user'] = credentials.user;
        details.options['password'] = credentials.password;
        details.options['authenticationType'] = credentials.authenticationType;
        details.options['encrypt'] = credentials.encrypt;
        details.options['trustServerCertificate'] = credentials.trustServerCertificate;
        details.options['persistSecurityInfo'] = credentials.persistSecurityInfo;
        details.options['connectTimeout'] = credentials.connectTimeout;
        details.options['connectRetryCount'] = credentials.connectRetryCount;
        details.options['connectRetryInterval'] = credentials.connectRetryInterval;
        details.options['applicationName'] = credentials.applicationName;
        details.options['workstationId'] = credentials.workstationId;
        details.options['applicationIntent'] = credentials.applicationIntent;
        details.options['currentLanguage'] = credentials.currentLanguage;
        details.options['pooling'] = credentials.pooling;
        details.options['maxPoolSize'] = credentials.maxPoolSize;
        details.options['minPoolSize'] = credentials.minPoolSize;
        details.options['loadBalanceTimeout'] = credentials.loadBalanceTimeout;
        details.options['replication'] = credentials.replication;
        details.options['attachDbFilename'] = credentials.attachDbFilename;
        details.options['failoverPartner'] = credentials.failoverPartner;
        details.options['multiSubnetFailover'] = credentials.multiSubnetFailover;
        details.options['multipleActiveResultSets'] = credentials.multipleActiveResultSets;
        details.options['packetSize'] = credentials.packetSize;
        details.options['typeSystemVersion'] = credentials.typeSystemVersion;
        return details;
    }
    static ensureRequiredPropertiesSet(credentials, isProfile, isPasswordRequired, wasPasswordEmptyInConfigFile, prompter, connectionStore, defaultProfileValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let questions = yield ConnectionCredentials.getRequiredCredentialValuesQuestions(credentials, false, isPasswordRequired, connectionStore, defaultProfileValues);
            let unprocessedCredentials = Object.assign({}, credentials);
            // Potentially ask to save password
            questions.push({
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgSavePassword,
                message: LocalizedConstants.msgSavePassword,
                shouldPrompt: (answers) => {
                    if (credentials.connectionString) {
                        return false;
                    }
                    if (isProfile) {
                        // For profiles, ask to save password if we are using SQL authentication and the user just entered their password for the first time
                        return ConnectionCredentials.isPasswordBasedCredential(credentials) &&
                            typeof (credentials.savePassword) === 'undefined' &&
                            wasPasswordEmptyInConfigFile;
                    }
                    else {
                        // For MRU list items, ask to save password if we are using SQL authentication and the user has not been asked before
                        return ConnectionCredentials.isPasswordBasedCredential(credentials) &&
                            typeof (credentials.savePassword) === 'undefined';
                    }
                },
                onAnswered: (value) => {
                    credentials.savePassword = value;
                }
            });
            return prompter.prompt(questions).then(answers => {
                if (answers) {
                    if (isProfile) {
                        let profile = credentials;
                        // If this is a profile, and the user has set save password to true and either
                        // stored the password in the config file or purposefully set an empty password,
                        // then transfer the password to the credential store
                        if (profile.savePassword && (!wasPasswordEmptyInConfigFile || profile.emptyPasswordInput)) {
                            // Remove profile, then save profile without plain text password
                            connectionStore.removeProfile(profile).then(() => {
                                connectionStore.saveProfile(profile);
                            });
                            // Or, if the user answered any additional questions for the profile, be sure to save it
                        }
                        else if (profile.authenticationType !== unprocessedCredentials.authenticationType ||
                            profile.savePassword !== unprocessedCredentials.savePassword ||
                            profile.password !== unprocessedCredentials.password) {
                            connectionStore.removeProfile(profile).then(() => {
                                connectionStore.saveProfile(profile);
                            });
                        }
                    }
                    return credentials;
                }
                else {
                    return undefined;
                }
            });
        });
    }
    // gets a set of questions that ensure all required and core values are set
    static getRequiredCredentialValuesQuestions(credentials, promptForDbName, isPasswordRequired, connectionStore, defaultProfileValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let authenticationChoices = ConnectionCredentials.getAuthenticationTypesChoice();
            let connectionStringSet = () => Boolean(credentials.connectionString);
            let questions = [
                // Server or connection string must be present
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.serverPrompt,
                    message: LocalizedConstants.serverPrompt,
                    placeHolder: LocalizedConstants.serverPlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.server : undefined,
                    shouldPrompt: (answers) => utils.isEmpty(credentials.server),
                    validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.serverPrompt, value),
                    onAnswered: (value) => ConnectionCredentials.processServerOrConnectionString(value, credentials)
                },
                // Database name is not required, prompt is optional
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.databasePrompt,
                    message: LocalizedConstants.databasePrompt,
                    placeHolder: LocalizedConstants.databasePlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.database : undefined,
                    shouldPrompt: (answers) => !connectionStringSet() && promptForDbName,
                    onAnswered: (value) => credentials.database = value
                },
                // AuthenticationType is required if there is more than 1 option on this platform
                {
                    type: question_1.QuestionTypes.expand,
                    name: LocalizedConstants.authTypePrompt,
                    message: LocalizedConstants.authTypePrompt,
                    choices: authenticationChoices,
                    shouldPrompt: (answers) => !connectionStringSet() && utils.isEmpty(credentials.authenticationType) && authenticationChoices.length > 1,
                    validate: (value) => {
                        if (value === utils.authTypeToString(interfaces_1.AuthenticationTypes.Integrated)
                            && serviceclient_1.default.instance.getServiceVersion() === 1) {
                            return LocalizedConstants.macSierraRequiredErrorMessage;
                        }
                        return undefined;
                    },
                    onAnswered: (value) => {
                        credentials.authenticationType = value;
                    }
                },
                // Username must be present
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.usernamePrompt,
                    message: LocalizedConstants.usernamePrompt,
                    placeHolder: LocalizedConstants.usernamePlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.user : undefined,
                    shouldPrompt: (answers) => !connectionStringSet() && ConnectionCredentials.shouldPromptForUser(credentials),
                    validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.usernamePrompt, value),
                    onAnswered: (value) => credentials.user = value
                },
                // Password may or may not be necessary
                {
                    type: question_1.QuestionTypes.password,
                    name: LocalizedConstants.passwordPrompt,
                    message: LocalizedConstants.passwordPrompt,
                    placeHolder: LocalizedConstants.passwordPlaceholder,
                    shouldPrompt: (answers) => !connectionStringSet() && ConnectionCredentials.shouldPromptForPassword(credentials),
                    validate: (value) => {
                        if (isPasswordRequired) {
                            return ConnectionCredentials.validateRequiredString(LocalizedConstants.passwordPrompt, value);
                        }
                        return undefined;
                    },
                    onAnswered: (value) => {
                        if (credentials) {
                            credentials.password = value;
                            if (typeof credentials !== 'undefined') {
                                credentials.emptyPasswordInput = utils.isEmpty(credentials.password);
                            }
                        }
                    },
                    default: defaultProfileValues ? yield connectionStore.lookupPassword(defaultProfileValues) : undefined
                }
            ];
            return questions;
        });
    }
    // Detect if a given value is a server name or a connection string, and assign the result accordingly
    static processServerOrConnectionString(value, credentials) {
        // If the value contains a connection string server name key, assume it is a connection string
        const dataSourceKeys = ['data source=', 'server=', 'address=', 'addr=', 'network address='];
        let isConnectionString = dataSourceKeys.some(key => value.toLowerCase().indexOf(key) !== -1);
        if (isConnectionString) {
            credentials.connectionString = value;
        }
        else {
            credentials.server = value;
        }
    }
    static shouldPromptForUser(credentials) {
        return utils.isEmpty(credentials.user) && ConnectionCredentials.isPasswordBasedCredential(credentials);
    }
    // Prompt for password if this is a password based credential and the password for the profile was empty
    // and not explicitly set as empty. If it was explicitly set as empty, only prompt if pw not saved
    static shouldPromptForPassword(credentials) {
        let isSavedEmptyPassword = credentials.emptyPasswordInput
            && credentials.savePassword;
        return utils.isEmpty(credentials.password)
            && ConnectionCredentials.isPasswordBasedCredential(credentials)
            && !isSavedEmptyPassword;
    }
    static isPasswordBasedCredential(credentials) {
        // TODO consider enum based verification and handling of AD auth here in the future
        let authenticationType = credentials.authenticationType;
        if (typeof credentials.authenticationType === 'undefined') {
            authenticationType = utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
        }
        return authenticationType === utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
    }
    static isPasswordBasedConnectionString(connectionString) {
        const connString = connectionString.toLowerCase();
        return connString.includes('user') &&
            connString.includes('password') &&
            !connString.includes('Integrated Security');
    }
    // Validates a string is not empty, returning undefined if true and an error message if not
    static validateRequiredString(property, value) {
        if (utils.isEmpty(value)) {
            return property + LocalizedConstants.msgIsRequired;
        }
        return undefined;
    }
    static getAuthenticationTypesChoice() {
        let choices = [
            { name: LocalizedConstants.authTypeSql, value: utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin) },
            { name: LocalizedConstants.authTypeIntegrated, value: utils.authTypeToString(interfaces_1.AuthenticationTypes.Integrated) }
        ]; // TODO When Azure Active Directory is supported, add this here
        return choices;
    }
}
exports.ConnectionCredentials = ConnectionCredentials;

//# sourceMappingURL=connectionCredentials.js.map
