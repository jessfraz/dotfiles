"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tf(v) {
    return v === true ? 'true'
        : v === false ? 'false'
            : v ? 'true like'
                : v === undefined ? 'undefined'
                    : v === null ? 'null'
                        : 'false like';
}
exports.tf = tf;
function uniqueFilter() {
    const seen = new Set();
    return (v) => !!(!seen.has(v) && seen.add(v));
}
exports.uniqueFilter = uniqueFilter;
//# sourceMappingURL=index.js.map