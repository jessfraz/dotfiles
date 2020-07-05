"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLazyValue = exports.createAutoLoadCache = void 0;
function createAutoLoadCache(loader) {
    const cache = new Map();
    const getter = ((key) => {
        const found = cache.get(key);
        if (found)
            return found;
        const value = loader(key);
        cache.set(key, value);
        return value;
    });
    getter.get = getter;
    getter.has = (key) => cache.has(key);
    getter.delete = (key) => cache.delete(key);
    getter.clear = () => cache.clear();
    return getter;
}
exports.createAutoLoadCache = createAutoLoadCache;
const notSet = Symbol('Value Not Set');
function createLazyValue(loader) {
    let v = notSet;
    const getter = (() => {
        if (v === notSet) {
            v = loader();
        }
        return v;
    });
    getter.clear = () => v = notSet;
    getter.get = getter;
    return getter;
}
exports.createLazyValue = createLazyValue;
//# sourceMappingURL=autoLoad.js.map