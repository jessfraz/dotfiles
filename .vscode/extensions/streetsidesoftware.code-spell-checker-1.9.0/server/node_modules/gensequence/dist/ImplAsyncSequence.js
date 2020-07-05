"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("./operators");
class ImplAsyncSequence {
    constructor(i) {
        this.i = i;
    }
    get iter() {
        return (typeof this.i === "function") ? this.i() : this.i;
    }
    [Symbol.asyncIterator]() {
        return this.iter[Symbol.asyncIterator]();
    }
    reduceAsync(fnReduceAsync, initialValue) {
        return operators_1.reduceAsyncForAsyncIterator(fnReduceAsync, initialValue)(this.iter);
    }
}
exports.ImplAsyncSequence = ImplAsyncSequence;
//# sourceMappingURL=ImplAsyncSequence.js.map