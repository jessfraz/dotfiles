"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toIterator(values) {
    let iter;
    const rangeIterator = {
        next: function () {
            if (!iter) {
                iter = values[Symbol.iterator]();
            }
            return iter.next();
        }
    };
    return rangeIterator;
}
exports.toIterator = toIterator;
function* toIterableIterator(i) {
    yield* i;
}
exports.toIterableIterator = toIterableIterator;
//# sourceMappingURL=util.js.map