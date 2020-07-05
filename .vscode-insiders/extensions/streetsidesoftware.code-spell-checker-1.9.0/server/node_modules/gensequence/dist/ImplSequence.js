"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("./operators");
const util_1 = require("./util/util");
class ImplSequence {
    constructor(i) {
        this.i = i;
    }
    get iter() {
        return (typeof this.i === "function") ? this.i() : this.i;
    }
    get iterator() {
        if (!this._iterator) {
            this._iterator = this.iter[Symbol.iterator]();
        }
        return this._iterator;
    }
    inject(fn) {
        const iter = this.i;
        return () => fn(typeof iter === "function" ? iter() : iter);
    }
    chain(fn) {
        return new ImplSequence(this.inject(fn));
    }
    [Symbol.iterator]() {
        return this.iter[Symbol.iterator]();
    }
    next() {
        return this.iterator.next();
    }
    //// Filters
    filter(fnFilter) {
        return this.chain(operators_1.filter(fnFilter));
    }
    skip(n) {
        return this.chain(operators_1.skip(n));
    }
    take(n) {
        return this.chain(operators_1.take(n));
    }
    //// Extenders
    concat(j) {
        return this.chain(operators_1.concat(j));
    }
    concatMap(fn) {
        return this.chain(operators_1.concatMap(fn));
    }
    //// Mappers
    combine(fn, j) {
        return this.chain(operators_1.combine(fn, j));
    }
    map(fn) {
        return this.chain(operators_1.map(fn));
    }
    scan(fnReduce, initValue) {
        return this.chain(operators_1.scan(fnReduce, initValue));
    }
    pipe(...fns) {
        if (!fns.length)
            return this;
        // Casting workaround due to the spread operator not working See: https://github.com/microsoft/TypeScript/issues/28010
        return this.chain(operators_1.pipe.apply(null, fns));
    }
    // Reducers
    all(fnFilter) {
        return operators_1.all(fnFilter)(this.iter);
    }
    any(fnFilter) {
        return operators_1.any(fnFilter)(this.iter);
    }
    count() {
        return operators_1.count()(this.iter);
    }
    first(fnFilter, defaultValue) {
        return operators_1.first(fnFilter, defaultValue)(this.iter);
    }
    forEach(fn) {
        return operators_1.forEach(fn)(this.iter);
    }
    max(fnSelector) {
        return operators_1.max(fnSelector)(this.iter);
    }
    min(fnSelector) {
        return operators_1.min(fnSelector)(this.iter);
    }
    reduce(fnReduce, initValue) {
        return operators_1.reduce(fnReduce, initValue)(this.iter);
    }
    reduceAsync(fnReduceAsync, initialValue) {
        return operators_1.reduceAsync(fnReduceAsync, initialValue)(this.iter);
    }
    reduceToSequence(fnReduce, initialValue) {
        return this.chain(operators_1.reduce(fnReduce, initialValue));
    }
    //// Cast
    toArray() {
        return [...this.iter];
    }
    toIterable() {
        return util_1.toIterableIterator(this.iter);
    }
}
exports.ImplSequence = ImplSequence;
//# sourceMappingURL=ImplSequence.js.map