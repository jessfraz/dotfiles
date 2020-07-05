"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createMapper(repMap) {
    const filteredMap = repMap
        .filter(([match, _]) => !!match);
    if (!filteredMap.length) {
        return a => a;
    }
    const regExStr = filteredMap
        .map(([from, _]) => from)
        // make sure it compiles into a regex
        .map(s => {
        try {
            // fix up any nested ()
            const r = s.match(/\(/) ? s.replace(/\((?=.*\))/g, '(?:').replace(/\(\?:\?/g, '(?') : s;
            new RegExp(r);
            s = r;
        }
        catch (err) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
        return s;
    })
        .map(s => `(${s})`)
        .join('|');
    const regEx = new RegExp(regExStr, 'g');
    const values = repMap
        .filter(([match, _]) => !!match)
        .map(([_, into]) => into);
    function resolve(m, ...matches) {
        const index = matches.findIndex(a => !!a);
        return 0 <= index && index < values.length ? values[index] : m;
    }
    return function (s) {
        return s.replace(regEx, resolve);
    };
}
exports.createMapper = createMapper;
//# sourceMappingURL=repMap.js.map