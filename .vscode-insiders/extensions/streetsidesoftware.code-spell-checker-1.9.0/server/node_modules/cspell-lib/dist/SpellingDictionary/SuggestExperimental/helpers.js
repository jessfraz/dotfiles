"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Comparison function to return the best (highest score) results first.
 * @param a Result A
 * @param b Result B
 */
function compareResults(a, b) {
    return b.score - a.score || a.word.localeCompare(b.word);
}
exports.compareResults = compareResults;
function wordToFeatures(word) {
    const map = new FeatureMap();
    mergeFeatures(map, wordToSingleLetterFeatures(word));
    mergeFeatures(map, wordToTwoLetterFeatures(word));
    return map;
}
exports.wordToFeatures = wordToFeatures;
function mergeFeatures(map, features) {
    map.append(features);
}
exports.mergeFeatures = mergeFeatures;
function wordToSingleLetterFeatures(word) {
    return word.split('').map(a => [a, 1]);
}
exports.wordToSingleLetterFeatures = wordToSingleLetterFeatures;
function wordToTwoLetterFeatures(word) {
    return segmentString(word, 2).map(s => [s, 1]);
}
exports.wordToTwoLetterFeatures = wordToTwoLetterFeatures;
function segmentString(s, segLen) {
    const count = Math.max(0, s.length - segLen + 1);
    const result = new Array(count);
    for (let i = 0; i < count; ++i) {
        result[i] = s.substr(i, segLen);
    }
    return result;
}
exports.segmentString = segmentString;
class FeatureMap extends Map {
    constructor() {
        super();
        this._count = 0;
    }
    get count() {
        return this._count;
    }
    append(features) {
        features.forEach(([k, v]) => {
            this.set(k, (this.get(k) || 0) + v);
            this._count += v;
        });
        return this;
    }
    correlationScore(m) {
        const score = this.intersectionScore(m);
        return score / (this._count + m._count - score);
    }
    intersectionScore(m) {
        let score = 0;
        for (const [k, v] of this) {
            score += Math.min(v, m.get(k) || 0);
        }
        return score;
    }
}
exports.FeatureMap = FeatureMap;
//# sourceMappingURL=helpers.js.map