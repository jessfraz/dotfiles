"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < IntelliSense Ready Event > ------------------------------------
/**
 * Event sent when the language service is finished updating after a connection
 */
var IntelliSenseReadyNotification;
(function (IntelliSenseReadyNotification) {
    IntelliSenseReadyNotification.type = new vscode_languageclient_1.NotificationType('textDocument/intelliSenseReady');
})(IntelliSenseReadyNotification = exports.IntelliSenseReadyNotification || (exports.IntelliSenseReadyNotification = {}));
/**
 * Update event parameters
 */
class IntelliSenseReadyParams {
}
exports.IntelliSenseReadyParams = IntelliSenseReadyParams;
/**
 * Notification sent when the an IntelliSense cache invalidation is requested
 */
var RebuildIntelliSenseNotification;
(function (RebuildIntelliSenseNotification) {
    RebuildIntelliSenseNotification.type = new vscode_languageclient_1.NotificationType('textDocument/rebuildIntelliSense');
})(RebuildIntelliSenseNotification = exports.RebuildIntelliSenseNotification || (exports.RebuildIntelliSenseNotification = {}));
/**
 * Rebuild IntelliSense notification parameters
 */
class RebuildIntelliSenseParams {
}
exports.RebuildIntelliSenseParams = RebuildIntelliSenseParams;
// ------------------------------- </ IntelliSense Ready Event > ----------------------------------
// ------------------------------- < Status Event > ------------------------------------
/**
 * Event sent when the language service send a status change event
 */
var StatusChangedNotification;
(function (StatusChangedNotification) {
    StatusChangedNotification.type = new vscode_languageclient_1.NotificationType('textDocument/statusChanged');
})(StatusChangedNotification = exports.StatusChangedNotification || (exports.StatusChangedNotification = {}));
/**
 * Update event parameters
 */
class StatusChangeParams {
}
exports.StatusChangeParams = StatusChangeParams;
// ------------------------------- </ Status Sent Event > ----------------------------------
// ------------------------------- < Language Flavor Changed Event > ------------------------------------
/**
 * Language flavor change event parameters
 */
class DidChangeLanguageFlavorParams {
}
exports.DidChangeLanguageFlavorParams = DidChangeLanguageFlavorParams;
/**
 * Notification sent when the language flavor is changed
 */
var LanguageFlavorChangedNotification;
(function (LanguageFlavorChangedNotification) {
    LanguageFlavorChangedNotification.type = new vscode_languageclient_1.NotificationType('connection/languageflavorchanged');
})(LanguageFlavorChangedNotification = exports.LanguageFlavorChangedNotification || (exports.LanguageFlavorChangedNotification = {}));
// ------------------------------- < Load Completion Extension Request > ------------------------------------
/**
 * Completion extension load parameters
 */
class CompletionExtensionParams {
}
exports.CompletionExtensionParams = CompletionExtensionParams;
var CompletionExtLoadRequest;
(function (CompletionExtLoadRequest) {
    CompletionExtLoadRequest.type = new vscode_languageclient_1.RequestType('completion/extLoad');
})(CompletionExtLoadRequest = exports.CompletionExtLoadRequest || (exports.CompletionExtLoadRequest = {}));

//# sourceMappingURL=languageService.js.map
