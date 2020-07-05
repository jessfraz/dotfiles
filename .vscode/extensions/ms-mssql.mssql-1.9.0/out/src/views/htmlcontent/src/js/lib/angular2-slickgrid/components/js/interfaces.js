"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const Rx_1 = require('rxjs/Rx');
(function (NotificationType) {
    NotificationType[NotificationType["Error"] = 0] = "Error";
    NotificationType[NotificationType["UpdateAvailable"] = 1] = "UpdateAvailable";
    NotificationType[NotificationType["UpdateDownloaded"] = 2] = "UpdateDownloaded";
})(exports.NotificationType || (exports.NotificationType = {}));
var NotificationType = exports.NotificationType;
(function (CollectionChange) {
    CollectionChange[CollectionChange["ItemsReplaced"] = 0] = "ItemsReplaced";
})(exports.CollectionChange || (exports.CollectionChange = {}));
var CollectionChange = exports.CollectionChange;
class CancellationToken {
    constructor() {
        this._isCanceled = false;
        this._canceled = new Rx_1.Subject();
    }
    cancel() {
        this._isCanceled = true;
        this._canceled.next(undefined);
    }
    get isCanceled() {
        return this._isCanceled;
    }
    get canceled() {
        return this._canceled;
    }
}
exports.CancellationToken = CancellationToken;
(function (FieldType) {
    FieldType[FieldType["String"] = 0] = "String";
    FieldType[FieldType["Boolean"] = 1] = "Boolean";
    FieldType[FieldType["Integer"] = 2] = "Integer";
    FieldType[FieldType["Decimal"] = 3] = "Decimal";
    FieldType[FieldType["Date"] = 4] = "Date";
    FieldType[FieldType["Unknown"] = 5] = "Unknown";
})(exports.FieldType || (exports.FieldType = {}));
var FieldType = exports.FieldType;
