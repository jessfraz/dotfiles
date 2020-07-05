"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("./operators");
const ImplSequence_1 = require("./ImplSequence");
class ImplSequenceBuilder {
    constructor(operators = []) {
        this.operators = [];
        this.operators = operators;
    }
    build(i) {
        return new ImplSequence_1.ImplSequence(i).pipe(operators_1.pipe.apply(null, this.operators));
    }
    pipe(...fns) {
        return new ImplSequenceBuilder([...this.operators, ...fns]);
    }
    //// Filters
    /** keep values where the fnFilter(t) returns true */
    filter(fnFilter) {
        return this.pipe(operators_1.filter(fnFilter));
    }
    skip(n) {
        return this.pipe(operators_1.skip(n));
    }
    take(n) {
        return this.pipe(operators_1.take(n));
    }
    //// Extenders
    concat(j) {
        return this.pipe(operators_1.concat(j));
    }
    concatMap(fn) {
        return this.pipe(operators_1.concatMap(fn));
    }
    //// Mappers
    combine(fn, j) {
        return this.pipe(operators_1.combine(fn, j));
    }
    /** map values from type T to type U */
    map(fnMap) {
        return this.pipe(operators_1.map(fnMap));
    }
    scan(fnReduce, initialValue) {
        return this.pipe(operators_1.scan(fnReduce, initialValue));
    }
}
exports.ImplSequenceBuilder = ImplSequenceBuilder;
//# sourceMappingURL=ImplSequenceBuilder.js.map