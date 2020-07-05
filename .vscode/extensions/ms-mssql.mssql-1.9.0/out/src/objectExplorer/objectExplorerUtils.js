"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const path = require("path");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
class ObjectExplorerUtils {
    static iconPath(label) {
        if (label) {
            if (label === Constants.disconnectedServerLabel) {
                // if disconnected
                label = `${Constants.serverLabel}_red`;
            }
            else if (label === Constants.serverLabel) {
                // if connected
                label += '_green';
            }
            return path.join(ObjectExplorerUtils.rootPath, `${label}.svg`);
        }
    }
    static getNodeUri(node) {
        const profile = node.connectionCredentials;
        return ObjectExplorerUtils.getNodeUriFromProfile(profile);
    }
    static getNodeUriFromProfile(profile) {
        let uri;
        if (profile.connectionString) {
            let fields = profile.connectionString.split(';').filter(s => !s.toLowerCase().includes('password'));
            uri = fields.join(';');
            return uri;
        }
        if (profile.authenticationType === Constants.sqlAuthentication) {
            uri = `${profile.server}_${profile.database}_${profile.user}_${profile.profileName}`;
        }
        else {
            uri = `${profile.server}_${profile.database}_${profile.profileName}`;
        }
        return uri;
    }
    static getDatabaseName(node) {
        if (node.nodeType === Constants.serverLabel ||
            node.nodeType === Constants.disconnectedServerLabel) {
            return node.connectionCredentials.database;
        }
        while (node) {
            if (node.metadata) {
                if (node.metadata.metadataTypeName === Constants.databaseString) {
                    return node.metadata.name;
                }
            }
            node = node.parentNode;
        }
        return LocalizedConstants.defaultDatabaseLabel;
    }
    static isFirewallError(errorMessage) {
        return errorMessage.includes(Constants.firewallErrorMessage);
    }
}
ObjectExplorerUtils.rootPath = path.join(__dirname, 'objectTypes');
exports.ObjectExplorerUtils = ObjectExplorerUtils;

//# sourceMappingURL=objectExplorerUtils.js.map
