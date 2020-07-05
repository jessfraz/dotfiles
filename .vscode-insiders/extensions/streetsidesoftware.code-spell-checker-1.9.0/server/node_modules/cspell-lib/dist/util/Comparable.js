"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compareBy(extract, ...extractors) {
    const compareFns = [extract, ...extractors]
        .map(ex => (typeof ex === 'function' ? ex : (t) => t[ex]))
        .map(ex => ((a, b) => _compare(ex(a), ex(b))));
    return compareEach(...compareFns);
}
exports.compareBy = compareBy;
function compareByRev(extract, ...extractors) {
    return reverse(compareBy(extract, ...extractors));
}
exports.compareByRev = compareByRev;
function compareEach(...compareFn) {
    return (a, b) => {
        for (const fn of compareFn) {
            const r = fn(a, b);
            if (r) {
                return r;
            }
        }
        return 0;
    };
}
exports.compareEach = compareEach;
function _compare(a, b) {
    if (a === b)
        return 0;
    if (a === undefined)
        return 1;
    if (b === undefined)
        return -1;
    if (a === null)
        return 1;
    if (b === null)
        return -1;
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
function compare(a, b) {
    return _compare(a, b);
}
exports.compare = compare;
function reverse(fn) {
    return (a, b) => { const r = fn(a, b); return r ? -r : 0; };
}
exports.reverse = reverse;
//# sourceMappingURL=Comparable.js.map