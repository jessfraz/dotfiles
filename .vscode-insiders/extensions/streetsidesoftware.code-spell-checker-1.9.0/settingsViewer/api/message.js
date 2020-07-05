"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isMessage(data) {
    return !!(data
        && typeof data === 'object'
        && data.hasOwnProperty('command')
        && typeof data['command'] === 'string');
}
exports.isMessage = isMessage;
function isA(cmd, fields) {
    return function (msg) {
        const t = msg;
        return msg.command === cmd
            && fields.reduce((success, [key, fn]) => success && fn(t[key]), true);
    };
}
exports.isConfigurationChangeMessage = isA('ConfigurationChangeMessage', [['value', isObject]]);
exports.isEnableLanguageIdMessage = isA('EnableLanguageIdMessage', [['value', isObject]]);
exports.isEnableLocaleMessage = isA('EnableLocaleMessage', [['value', isObject]]);
exports.isRequestConfigurationMessage = isA('RequestConfigurationMessage', []);
exports.isSelectFileMessage = isA('SelectFileMessage', [['value', isString]]);
exports.isSelectFolderMessage = isA('SelectFolderMessage', [['value', isString]]);
exports.isSelectTabMessage = isA('SelectTabMessage', [['value', isString]]);
function isObject(v) { return typeof v === 'object' && v !== null; }
function isString(v) { return typeof v === 'string'; }
//# sourceMappingURL=message.js.map