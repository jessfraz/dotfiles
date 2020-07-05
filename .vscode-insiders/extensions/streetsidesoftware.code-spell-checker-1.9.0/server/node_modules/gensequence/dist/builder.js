"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ImplSequenceBuilder_1 = require("./ImplSequenceBuilder");
const operators_1 = require("./operators");
function makeBuilder(fn) {
    return new ImplSequenceBuilder_1.ImplSequenceBuilder([fn]);
}
exports.builder = Object.freeze({
    pipe: (fn) => {
        return makeBuilder(fn);
    },
    //// Filters
    /** keep values where the fnFilter(t) returns true */
    filter: (fnFilter) => {
        return makeBuilder(operators_1.filter(fnFilter));
    },
    skip: (n) => {
        return makeBuilder(operators_1.skip(n));
    },
    take: (n) => {
        return makeBuilder(operators_1.take(n));
    },
    //// Extenders
    concat: (j) => {
        return makeBuilder(operators_1.concat(j));
    },
    concatMap: (fn) => {
        return makeBuilder(operators_1.concatMap(fn));
    },
    //// Mappers
    combine: (fn, j) => {
        return makeBuilder(operators_1.combine(fn, j));
    },
    /** map values from type T to type U */
    map: (fnMap) => {
        return makeBuilder(operators_1.map(fnMap));
    },
    scan: (fnReduce, initialValue) => {
        return makeBuilder(operators_1.scan(fnReduce, initialValue));
    },
});
//# sourceMappingURL=builder.js.map