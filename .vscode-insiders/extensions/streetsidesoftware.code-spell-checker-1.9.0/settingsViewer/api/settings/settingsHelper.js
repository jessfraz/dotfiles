"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function extractConfig(configs, key) {
    for (let i = exports.configTargets.length - 1; i >= 0; i--) {
        const target = exports.configTargets[i];
        if (configs[target] && configs[target][key]) {
            return {
                target,
                config: configs[target][key],
            };
        }
    }
    return {
        target: 'user',
        config: configs.user[key],
    };
}
exports.extractConfig = extractConfig;
exports.ConfigTargets = Object.freeze({
    user: 'user',
    workspace: 'workspace',
    folder: 'folder',
});
exports.configTargets = Object.freeze(Object.keys(exports.ConfigTargets));
const setOfConfigTargets = new Set(exports.configTargets);
function isConfigTarget(target) {
    return target !== undefined && setOfConfigTargets.has(target);
}
exports.isConfigTarget = isConfigTarget;
// Define the order in which configuration is applied.
exports.configTargetToIndex = Object.freeze({
    user: 0,
    workspace: 1,
    folder: 2,
});
exports.configTargetOrder = Object.freeze(Object.entries(exports.configTargetToIndex).sort((a, b) => a[1] - b[1]).map(a => a[0]));
//# sourceMappingURL=settingsHelper.js.map