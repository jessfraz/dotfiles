'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
exports.ALIAS = {
    'proto3': 'proto'
};
let languages = [];
for (let l of ['cpp', 'c', 'objective-c', 'objective-cpp', 'java', 'javascript', 'typescript', 'proto', 'proto3', 'apex', 'glsl', 'cuda']) {
    let confKey = `language.${exports.ALIAS[l] || l}.enable`;
    if (vscode.workspace.getConfiguration('clang-format').get(confKey)) {
        languages.push(l);
    }
}
exports.MODES = languages.map((language) => ({ language, scheme: 'file' }));
//# sourceMappingURL=clangMode.js.map