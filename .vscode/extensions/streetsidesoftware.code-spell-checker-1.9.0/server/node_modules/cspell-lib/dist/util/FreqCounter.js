"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FreqCounter {
    constructor() {
        this._total = 0;
        this._counters = new Map();
    }
    get total() { return this._total; }
    get counters() { return this._counters; }
    getCount(key) {
        return this._counters.get(key);
    }
    getFreq(key) {
        return (this.getCount(key) || 0) / (this._total || 1);
    }
    addKeyCount(key, count) {
        this._total += count;
        this._counters.set(key, (this._counters.get(key) || 0) + count);
        return this;
    }
    addKey(key) {
        return this.addKeyCount(key, 1);
    }
    addKeys(keys) {
        for (const key of keys) {
            this.addKey(key);
        }
    }
    addKeyCounts(values) {
        for (const pair of values) {
            this.addKeyCount(pair[0], pair[1]);
        }
    }
    merge(...freqCounters) {
        for (const fc of freqCounters) {
            this.addKeyCounts(fc._counters);
        }
        return this;
    }
    static create(values) {
        const fc = new FreqCounter();
        fc.addKeys(values || []);
        return fc;
    }
}
exports.FreqCounter = FreqCounter;
//# sourceMappingURL=FreqCounter.js.map