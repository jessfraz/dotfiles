"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firewallRequest_1 = require("../models/contracts/firewall/firewallRequest");
const Constants = require("../constants/constants");
const protocol_1 = require("../protocol");
class FirewallService {
    constructor(_client, _vscodeWrapper) {
        this._client = _client;
        this._vscodeWrapper = _vscodeWrapper;
        this._isSignedIn = false;
        this._session = undefined;
        this._account = undefined;
        this._token = undefined;
    }
    get isSignedIn() {
        return this._isSignedIn;
    }
    get account() {
        return this._account;
    }
    /**
     * Public for testing purposes only
     */
    set token(value) {
        this._token = value;
    }
    convertToAzureAccount(azureSession) {
        let tenant = {
            displayName: Constants.tenantDisplayName,
            id: azureSession.tenantId,
            userId: azureSession.userId
        };
        let key = {
            providerId: Constants.resourceProviderId,
            accountId: azureSession.userId
        };
        let account = {
            key: key,
            displayInfo: {
                userId: azureSession.userId,
                contextualDisplayName: undefined,
                displayName: undefined,
                accountType: undefined
            },
            properties: {
                tenants: [tenant]
            },
            isStale: this._isStale
        };
        return account;
    }
    createSecurityTokenMapping() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._token) {
                let promise = new protocol_1.Deferred();
                this._token = this._session.credentials.getToken((error, result) => {
                    if (result) {
                        this._isStale = false;
                        this._token = result;
                    }
                    if (error) {
                        this._isStale = true;
                    }
                    promise.resolve();
                });
                yield promise;
            }
            let mapping = {};
            mapping[this._session.tenantId] = {
                expiresOn: this._token.expiresOn.toISOString(),
                resource: this._token.resource,
                tokenType: this._token.tokenType,
                token: this._token.accessToken
            };
            return mapping;
        });
    }
    asCreateFirewallRuleParams(serverName, startIpAddress, endIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                account: this._account,
                serverName: serverName,
                startIpAddress: startIpAddress,
                endIpAddress: endIpAddress ? endIpAddress : startIpAddress,
                securityTokenMappings: yield this.createSecurityTokenMapping()
            };
            return params;
        });
    }
    set isSignedIn(value) {
        this._isSignedIn = value;
        if (value) {
            this._session = this._vscodeWrapper.azureAccountExtension.exports.sessions[0];
            this._account = this.convertToAzureAccount(this._session);
        }
    }
    createFirewallRule(serverName, startIpAddress, endIpAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = yield this.asCreateFirewallRuleParams(serverName, startIpAddress, endIpAddress);
            let result = yield this._client.sendResourceRequest(firewallRequest_1.CreateFirewallRuleRequest.type, params);
            return result;
        });
    }
    handleFirewallRule(errorCode, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { errorCode: errorCode, errorMessage: errorMessage, connectionTypeId: Constants.mssqlProviderName };
            let result = yield this._client.sendResourceRequest(firewallRequest_1.HandleFirewallRuleRequest.type, params);
            return result;
        });
    }
}
exports.FirewallService = FirewallService;

//# sourceMappingURL=firewallService.js.map
