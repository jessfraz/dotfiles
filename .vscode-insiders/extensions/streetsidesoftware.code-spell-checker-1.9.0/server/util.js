"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDefined = exports.uniqueFilter = void 0;
function uniqueFilter(extractFn) {
    const values = new Set();
    const extractor = extractFn || (a => a);
    return (v) => {
        const vv = extractor(v);
        const ret = !values.has(vv);
        values.add(vv);
        return ret;
    };
}
exports.uniqueFilter = uniqueFilter;
function isDefined(v) {
    return v !== undefined && v !== null;
}
exports.isDefined = isDefined;
//# sourceMappingURL=util.js.map