/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < Resource Events > ------------------------------------
var CreateFirewallRuleRequest;
(function (CreateFirewallRuleRequest) {
    CreateFirewallRuleRequest.type = new vscode_languageclient_1.RequestType('resource/createFirewallRule');
})(CreateFirewallRuleRequest = exports.CreateFirewallRuleRequest || (exports.CreateFirewallRuleRequest = {}));
var HandleFirewallRuleRequest;
(function (HandleFirewallRuleRequest) {
    HandleFirewallRuleRequest.type = new vscode_languageclient_1.RequestType('resource/handleFirewallRule');
})(HandleFirewallRuleRequest = exports.HandleFirewallRuleRequest || (exports.HandleFirewallRuleRequest = {}));

//# sourceMappingURL=firewallRequest.js.map
