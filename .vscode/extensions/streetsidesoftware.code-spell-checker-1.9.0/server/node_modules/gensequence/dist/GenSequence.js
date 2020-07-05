"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util/util");
const ImplSequence_1 = require("./ImplSequence");
var util_2 = require("./util/util");
exports.toIterableIterator = util_2.toIterableIterator;
function genSequence(i) {
    return new ImplSequence_1.ImplSequence(i);
}
exports.genSequence = genSequence;
// Collection of entry points into GenSequence
exports.GenSequence = {
    genSequence,
    sequenceFromRegExpMatch,
    sequenceFromObject,
};
/**
 * alias of toIterableIterator
 */
exports.toIterator = util_1.toIterableIterator;
function* objectIterator(t) {
    const keys = new Set(Object.keys(t));
    for (const k in t) {
        // istanbul ignore else
        if (keys.has(k)) {
            yield [k, t[k]];
        }
    }
}
exports.objectIterator = objectIterator;
function objectToSequence(t) {
    return sequenceFromObject(t);
}
exports.objectToSequence = objectToSequence;
function sequenceFromObject(t) {
    return genSequence(() => objectIterator(t));
}
exports.sequenceFromObject = sequenceFromObject;
function sequenceFromRegExpMatch(pattern, text) {
    function* doMatch() {
        const regex = new RegExp(pattern);
        let match;
        let lastIndex = undefined;
        while (match = regex.exec(text)) {
            // Make sure it stops if the index does not move forward.
            if (match.index === lastIndex) {
                break;
            }
            lastIndex = match.index;
            yield match;
        }
    }
    return genSequence(() => doMatch());
}
exports.sequenceFromRegExpMatch = sequenceFromRegExpMatch;
exports.default = genSequence;
//# sourceMappingURL=GenSequence.js.map