"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageCodes_1 = require("./languageCodes");
const langCodes = new Map(languageCodes_1.codes
    .map((parts) => {
    const [code, lang, country = ''] = parts;
    return [code, { code, lang, country }];
}));
const regExReplace = /^([a-z]{2})[-_]?([a-z]{0,2})$/i;
// const regExValidate = /^([a-z]{2})(-[A-Z]{2})?$/;
function normalizeCode(code) {
    return code.replace(regExReplace, (match, p1, p2) => {
        const lang = p1.toLowerCase();
        const locale = p2.toUpperCase();
        return locale ? `${lang}-${locale}` : lang;
    });
}
exports.normalizeCode = normalizeCode;
function isValidCode(code) {
    return langCodes.has(code);
}
exports.isValidCode = isValidCode;
function lookupCode(code) {
    return langCodes.get(code);
}
exports.lookupCode = lookupCode;
//# sourceMappingURL=index.js.map