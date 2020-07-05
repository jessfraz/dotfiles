"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const op = require("./operatorsBase");
/**
 * Operators used by Sequence
 */
//// Filters
function filter(fnFilter) {
    return (i) => op.filter(i, fnFilter);
}
exports.filter = filter;
function skip(n) {
    return (i) => op.skip(i, n);
}
exports.skip = skip;
function take(n) {
    return (i) => op.take(i, n);
}
exports.take = take;
//// Extenders
/**
 * Concat two iterables together
 */
function concat(j) {
    return (i) => op.concat(i, j);
}
exports.concat = concat;
function concatMap(fn) {
    return (i) => op.concatMap(i, fn);
}
exports.concatMap = concatMap;
//// Mappers
/**
 * Combine two iterables together using fnMap function.
 */
function combine(fnMap, j) {
    return (i) => op.combine(i, j, fnMap);
}
exports.combine = combine;
/**
 * apply a mapping function to an Iterable.
 */
function map(fnMap) {
    return (i) => op.map(i, fnMap);
}
exports.map = map;
function scan(fnReduce, initValue) {
    return (i) => op.scan(i, fnReduce, initValue);
}
exports.scan = scan;
//// Reducers
function all(fn) {
    return (i) => op.all(i, fn);
}
exports.all = all;
function any(fn) {
    return (i) => op.any(i, fn);
}
exports.any = any;
function count() {
    return (i) => op.count(i);
}
exports.count = count;
function first(fn, defaultValue) {
    return (i) => op.first(i, fn, defaultValue);
}
exports.first = first;
function forEach(fn) {
    return (i) => op.forEach(i, fn);
}
exports.forEach = forEach;
function max(selector) {
    return (i) => op.max(i, selector);
}
exports.max = max;
function min(selector) {
    return (i) => op.min(i, selector);
}
exports.min = min;
function reduce(fnReduce, initialValue) {
    return (i) => op.reduce(i, fnReduce, initialValue);
}
exports.reduce = reduce;
function reduceAsync(fnReduceAsync, initialValue) {
    return (i) => op.reduceAsync(i, fnReduceAsync, initialValue);
}
exports.reduceAsync = reduceAsync;
function reduceAsyncForAsyncIterator(fnReduceAsync, initialValue) {
    return (i) => op.reduceAsyncForAsyncIterator(i, fnReduceAsync, initialValue);
}
exports.reduceAsyncForAsyncIterator = reduceAsyncForAsyncIterator;
function pipe(...fns) {
    return (i) => {
        for (const fn of fns) {
            i = fn ? fn(i) : i;
        }
        return i;
    };
}
exports.pipe = pipe;
//# sourceMappingURL=operators.js.map