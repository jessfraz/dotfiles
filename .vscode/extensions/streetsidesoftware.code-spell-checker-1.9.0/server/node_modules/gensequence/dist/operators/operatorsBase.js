"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Operators used by Sequence
 */
//// Filters
function* filter(i, fnFilter) {
    for (const v of i) {
        if (fnFilter(v)) {
            yield v;
        }
    }
}
exports.filter = filter;
function* skip(i, n) {
    let a = 0;
    for (const t of i) {
        if (a >= n) {
            yield t;
        }
        a += 1;
    }
}
exports.skip = skip;
function* take(i, n) {
    let a = 0;
    if (n) {
        for (const t of i) {
            if (a >= n) {
                break;
            }
            yield t;
            a += 1;
        }
    }
}
exports.take = take;
//// Extenders
/**
 * Concat two iterables together
 */
function* concat(i, j) {
    yield* i;
    yield* j;
}
exports.concat = concat;
function* concatMap(i, fn) {
    for (const t of i) {
        yield* fn(t);
    }
}
exports.concatMap = concatMap;
//// Mappers
/**
 * Combine two iterables together using fnMap function.
 */
function* combine(i, j, fnMap) {
    const jit = j[Symbol.iterator]();
    for (const r of i) {
        const s = jit.next().value;
        yield fnMap(r, s);
    }
}
exports.combine = combine;
/**
 * apply a mapping function to an Iterable.
 */
function map(i, fnMap) {
    function* fn(i, fnMap) {
        for (const v of i) {
            yield fnMap(v);
        }
    }
    return fn(i, fnMap);
}
exports.map = map;
function* scan(i, fnReduce, initValue) {
    let index = 0;
    if (initValue === undefined) {
        // We need to create a new iterable to prevent for...of from restarting an array.
        index = 1;
        const iter = i[Symbol.iterator]();
        let r = iter.next();
        if (!r.done)
            yield r.value;
        initValue = r.value;
        i = makeIterable(iter);
    }
    let prevValue = initValue;
    for (const t of i) {
        const nextValue = fnReduce(prevValue, t, index);
        yield nextValue;
        prevValue = nextValue;
        index += 1;
    }
}
exports.scan = scan;
//// Reducers
function all(i, fn) {
    for (const t of i) {
        if (!fn(t)) {
            return false;
        }
    }
    return true;
}
exports.all = all;
function any(i, fn) {
    for (const t of i) {
        if (fn(t)) {
            return true;
        }
    }
    return false;
}
exports.any = any;
function count(i) {
    return reduce(i, p => p + 1, 0);
}
exports.count = count;
function first(i, fn, defaultValue) {
    fn = fn || (() => true);
    for (const t of i) {
        if (fn(t)) {
            return t;
        }
    }
    return defaultValue;
}
exports.first = first;
function forEach(i, fn) {
    let index = 0;
    for (const t of i) {
        fn(t, index);
        index += 1;
    }
}
exports.forEach = forEach;
function max(i, selector = (t => t)) {
    return reduce(i, (p, c) => selector(c) > selector(p) ? c : p, undefined);
}
exports.max = max;
function min(i, selector = (t => t)) {
    return reduce(i, (p, c) => selector(c) < selector(p) ? c : p, undefined);
}
exports.min = min;
function reduce(i, fnReduce, initialValue) {
    // We need to create a new iterable to prevent for...of from restarting an array.
    const iter = makeIterable(i[Symbol.iterator]());
    let index = 0;
    if (initialValue === undefined) {
        index = 1;
        const r = iter.next();
        initialValue = r.value;
    }
    let prevValue = initialValue;
    for (const t of iter) {
        const nextValue = fnReduce(prevValue, t, index);
        prevValue = nextValue;
        index += 1;
    }
    return prevValue;
}
exports.reduce = reduce;
function reduceAsync(i, fnReduce, initialValue) {
    return __awaiter(this, void 0, void 0, function* () {
        // We need to create a new iterable to prevent for...of from restarting an array.
        const iter = makeIterable(i[Symbol.iterator]());
        let index = 0;
        if (initialValue === undefined) {
            index = 1;
            const r = iter.next();
            initialValue = r.value;
        }
        let previousValue = yield initialValue;
        for (const p of iter) {
            const t = yield p;
            const nextValue = yield fnReduce(previousValue, t, index);
            previousValue = nextValue;
            index += 1;
        }
        return previousValue;
    });
}
exports.reduceAsync = reduceAsync;
function reduceAsyncForAsyncIterator(i, fnReduce, initialValue) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const iter = makeAsyncIterable(i[Symbol.asyncIterator]());
        let index = 0;
        if (initialValue === undefined) {
            index = 1;
            const r = yield iter.next();
            initialValue = r.value;
        }
        let previousValue = yield initialValue;
        try {
            for (var iter_1 = __asyncValues(iter), iter_1_1; iter_1_1 = yield iter_1.next(), !iter_1_1.done;) {
                const t = iter_1_1.value;
                const nextValue = yield fnReduce(previousValue, t, index);
                previousValue = nextValue;
                index += 1;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iter_1_1 && !iter_1_1.done && (_a = iter_1.return)) yield _a.call(iter_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return previousValue;
    });
}
exports.reduceAsyncForAsyncIterator = reduceAsyncForAsyncIterator;
//// Utilities
/**
 * Convert an Iterator into an IterableIterator
 */
function makeIterable(i) {
    function* fromIterator(i) {
        for (let r = i.next(); !r.done; r = i.next()) {
            yield r.value;
        }
    }
    function* fromIterable(i) {
        yield* i;
    }
    return isIterable(i) ? (isIterableIterator(i) ? i : fromIterable(i)) : fromIterator(i);
}
exports.makeIterable = makeIterable;
function isIterable(i) {
    return !!i[Symbol.iterator];
}
exports.isIterable = isIterable;
function isIterableIterator(i) {
    return typeof i.next == 'function';
}
exports.isIterableIterator = isIterableIterator;
function makeAsyncIterable(i) {
    function fromIterable(i) {
        return __asyncGenerator(this, arguments, function* fromIterable_1() {
            for (const v of i) {
                yield yield __await(v);
            }
        });
    }
    function fromIterator(i) {
        return __asyncGenerator(this, arguments, function* fromIterator_1() {
            for (let r = yield __await(i.next()); !r.done; r = yield __await(i.next())) {
                yield yield __await(r.value);
            }
        });
    }
    function fromAsyncIterable(i) {
        return __asyncGenerator(this, arguments, function* fromAsyncIterable_1() {
            yield __await(yield* __asyncDelegator(__asyncValues(i)));
        });
    }
    return isAsyncIterable(i) ? (isAsyncIterableIterator(i) ? i : fromAsyncIterable(i)) :
        isIterable(i) ? fromIterable(i) :
            fromIterator(i);
}
exports.makeAsyncIterable = makeAsyncIterable;
function isAsyncIterable(i) {
    return !!i[Symbol.asyncIterator];
}
exports.isAsyncIterable = isAsyncIterable;
function isAsyncIterableIterator(i) {
    return typeof i.next == 'function';
}
exports.isAsyncIterableIterator = isAsyncIterableIterator;
function scanMap(accFn, init) {
    let acc = init;
    let first = true;
    return function (value) {
        if (first && acc === undefined) {
            first = false;
            acc = value;
            return acc;
        }
        acc = accFn(acc, value);
        return acc;
    };
}
exports.scanMap = scanMap;
//# sourceMappingURL=operatorsBase.js.map