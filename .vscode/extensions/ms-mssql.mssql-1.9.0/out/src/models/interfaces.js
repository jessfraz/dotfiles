/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Constants = require("../constants/constants");
// interfaces
var ContentType;
(function (ContentType) {
    ContentType[ContentType["Root"] = 0] = "Root";
    ContentType[ContentType["Messages"] = 1] = "Messages";
    ContentType[ContentType["ResultsetsMeta"] = 2] = "ResultsetsMeta";
    ContentType[ContentType["Columns"] = 3] = "Columns";
    ContentType[ContentType["Rows"] = 4] = "Rows";
    ContentType[ContentType["SaveResults"] = 5] = "SaveResults";
    ContentType[ContentType["Copy"] = 6] = "Copy";
    ContentType[ContentType["EditorSelection"] = 7] = "EditorSelection";
    ContentType[ContentType["OpenLink"] = 8] = "OpenLink";
    ContentType[ContentType["ShowError"] = 9] = "ShowError";
    ContentType[ContentType["ShowWarning"] = 10] = "ShowWarning";
    ContentType[ContentType["Config"] = 11] = "Config";
    ContentType[ContentType["LocalizedTexts"] = 12] = "LocalizedTexts";
})(ContentType = exports.ContentType || (exports.ContentType = {}));
var AuthenticationTypes;
(function (AuthenticationTypes) {
    AuthenticationTypes[AuthenticationTypes["Integrated"] = 1] = "Integrated";
    AuthenticationTypes[AuthenticationTypes["SqlLogin"] = 2] = "SqlLogin";
    AuthenticationTypes[AuthenticationTypes["ActiveDirectoryUniversal"] = 3] = "ActiveDirectoryUniversal";
})(AuthenticationTypes = exports.AuthenticationTypes || (exports.AuthenticationTypes = {}));
exports.contentTypes = [
    Constants.outputContentTypeRoot,
    Constants.outputContentTypeMessages,
    Constants.outputContentTypeResultsetMeta,
    Constants.outputContentTypeColumns,
    Constants.outputContentTypeRows,
    Constants.outputContentTypeSaveResults,
    Constants.outputContentTypeCopy,
    Constants.outputContentTypeEditorSelection,
    Constants.outputContentTypeOpenLink,
    Constants.outputContentTypeShowError,
    Constants.outputContentTypeShowWarning,
    Constants.outputContentTypeConfig,
    Constants.localizedTexts
];
var CredentialsQuickPickItemType;
(function (CredentialsQuickPickItemType) {
    CredentialsQuickPickItemType[CredentialsQuickPickItemType["Profile"] = 0] = "Profile";
    CredentialsQuickPickItemType[CredentialsQuickPickItemType["Mru"] = 1] = "Mru";
    CredentialsQuickPickItemType[CredentialsQuickPickItemType["NewConnection"] = 2] = "NewConnection";
})(CredentialsQuickPickItemType = exports.CredentialsQuickPickItemType || (exports.CredentialsQuickPickItemType = {}));
class DbCellValue {
}
exports.DbCellValue = DbCellValue;
class ResultSetSubset {
}
exports.ResultSetSubset = ResultSetSubset;
class ResultSetSummary {
}
exports.ResultSetSummary = ResultSetSummary;
class BatchSummary {
}
exports.BatchSummary = BatchSummary;
class QueryEvent {
}
exports.QueryEvent = QueryEvent;
var FieldType;
(function (FieldType) {
    FieldType[FieldType["String"] = 0] = "String";
    FieldType[FieldType["Boolean"] = 1] = "Boolean";
    FieldType[FieldType["Integer"] = 2] = "Integer";
    FieldType[FieldType["Decimal"] = 3] = "Decimal";
    FieldType[FieldType["Date"] = 4] = "Date";
    FieldType[FieldType["Unknown"] = 5] = "Unknown";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
/** Azure Account Interfaces */
var AzureLoginStatus;
(function (AzureLoginStatus) {
    AzureLoginStatus["Initializing"] = "Initializing";
    AzureLoginStatus["LoggingIn"] = "LoggingIn";
    AzureLoginStatus["LoggedIn"] = "LoggedIn";
    AzureLoginStatus["LoggedOut"] = "LoggedOut";
})(AzureLoginStatus = exports.AzureLoginStatus || (exports.AzureLoginStatus = {}));

//# sourceMappingURL=interfaces.js.map
