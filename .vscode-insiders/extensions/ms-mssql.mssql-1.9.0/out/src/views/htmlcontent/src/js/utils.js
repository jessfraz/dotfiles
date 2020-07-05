"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function formatString(str, ...args) {
    // This is based on code originally from https://github.com/Microsoft/vscode/blob/master/src/vs/nls.js
    // License: https://github.com/Microsoft/vscode/blob/master/LICENSE.txt
    let result;
    if (args.length === 0) {
        result = str;
    }
    else {
        result = str.replace(/\{(\d+)\}/g, (match, rest) => {
            let index = rest[0];
            return typeof args[index] !== 'undefined' ? args[index] : match;
        });
    }
    return result;
}
exports.formatString = formatString;
function isNumber(val) {
    return typeof (val) === 'number';
}
exports.isNumber = isNumber;
/**
 * Converts <, >, &, ", ', and any characters that are outside \u00A0 to numeric HTML entity values
 * like &#123;. Also converts whitespace to &nbsp; to ensure all spaces are respected.
 * (Adapted from http://stackoverflow.com/a/18750001)
 * @param str String to convert
 * @return String with characters replaced.
 */
function htmlEntities(str) {
    if (typeof (str) !== 'string') {
        return undefined;
    }
    let newStr = str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => { return `&#${i.charCodeAt(0)};`; });
    newStr = newStr.replace(/\s/g, '&nbsp;');
    return newStr;
}
exports.htmlEntities = htmlEntities;
/**
 * Determines if an object is a DbCellValue based on the properties it exposes
 * @param object The object to check
 * @returns True if the object is a DbCellValue, false otherwise
 */
function isDbCellValue(object) {
    return object !== undefined
        && object.displayValue !== undefined
        && object.isNull !== undefined;
}
exports.isDbCellValue = isDbCellValue;
/**
 * Determines if an object is a NULL value object based on the properties
 * it exposes
 * @param object The object to check
 * @returns True if the object is a NULL value object, false otherwise
 */
function isNullValueCell(object) {
    return object.isNull || object.displayValue === 'NULL';
}
exports.isNullValueCell = isNullValueCell;

//# sourceMappingURL=utils.js.map
