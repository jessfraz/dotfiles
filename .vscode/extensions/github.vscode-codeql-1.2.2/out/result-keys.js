"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Alias for `undefined` but more readable in some cases */
exports.none = undefined;
/**
 * Looks up a specific result in a result set.
 */
function getResult(sarif, key) {
    if (sarif.runs.length === 0)
        return undefined;
    if (sarif.runs[0].results === undefined)
        return undefined;
    const results = sarif.runs[0].results;
    return results[key.resultIndex];
}
exports.getResult = getResult;
/**
 * Looks up a specific path in a result set.
 */
function getPath(sarif, key) {
    const result = getResult(sarif, key);
    if (result === undefined)
        return undefined;
    let index = -1;
    if (result.codeFlows === undefined)
        return undefined;
    for (const codeFlows of result.codeFlows) {
        for (const threadFlow of codeFlows.threadFlows) {
            ++index;
            if (index == key.pathIndex)
                return threadFlow;
        }
    }
    return undefined;
}
exports.getPath = getPath;
/**
 * Looks up a specific path node in a result set.
 */
function getPathNode(sarif, key) {
    const path = getPath(sarif, key);
    if (path === undefined)
        return undefined;
    return path.locations[key.pathNodeIndex];
}
exports.getPathNode = getPathNode;
/**
 * Returns true if the two keys are both `undefined` or contain the same set of indices.
 */
function equals(key1, key2) {
    if (key1 === key2)
        return true;
    if (key1 === undefined || key2 === undefined)
        return false;
    return key1.resultIndex === key2.resultIndex && key1.pathIndex === key2.pathIndex && key1.pathNodeIndex === key2.pathNodeIndex;
}
exports.equals = equals;
/**
 * Returns true if the two keys contain the same set of indices and neither are `undefined`.
 */
function equalsNotUndefined(key1, key2) {
    if (key1 === undefined || key2 === undefined)
        return false;
    return key1.resultIndex === key2.resultIndex && key1.pathIndex === key2.pathIndex && key1.pathNodeIndex === key2.pathNodeIndex;
}
exports.equalsNotUndefined = equalsNotUndefined;
/**
 * Returns the list of paths in the given SARIF result.
 *
 * Path nodes indices are relative to this flattened list.
 */
function getAllPaths(result) {
    if (result.codeFlows === undefined)
        return [];
    const paths = [];
    for (const codeFlow of result.codeFlows) {
        for (const threadFlow of codeFlow.threadFlows) {
            paths.push(threadFlow);
        }
    }
    return paths;
}
exports.getAllPaths = getAllPaths;

//# sourceMappingURL=result-keys.js.map
