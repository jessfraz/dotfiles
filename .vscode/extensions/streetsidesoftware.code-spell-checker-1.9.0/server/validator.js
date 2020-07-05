"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTextDocumentAsync = exports.validateTextDocument = exports.defaultCheckLimit = exports.diagSource = exports.diagnosticCollectionName = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const cspell_lib_1 = require("cspell-lib");
const gensequence_1 = require("gensequence");
var cspell_lib_2 = require("cspell-lib");
Object.defineProperty(exports, "validateText", { enumerable: true, get: function () { return cspell_lib_2.validateText; } });
exports.diagnosticCollectionName = 'cSpell';
exports.diagSource = exports.diagnosticCollectionName;
exports.defaultCheckLimit = 500;
const diagSeverityMap = new Map([
    ['error', vscode_languageserver_1.DiagnosticSeverity.Error],
    ['warning', vscode_languageserver_1.DiagnosticSeverity.Warning],
    ['information', vscode_languageserver_1.DiagnosticSeverity.Information],
    ['hint', vscode_languageserver_1.DiagnosticSeverity.Hint],
]);
async function validateTextDocument(textDocument, options) {
    return (await validateTextDocumentAsync(textDocument, options)).toArray();
}
exports.validateTextDocument = validateTextDocument;
async function validateTextDocumentAsync(textDocument, options) {
    const { diagnosticLevel = vscode_languageserver_1.DiagnosticSeverity.Information.toString() } = options;
    const severity = diagSeverityMap.get(diagnosticLevel.toLowerCase()) || vscode_languageserver_1.DiagnosticSeverity.Information;
    const limit = (options.checkLimit || exports.defaultCheckLimit) * 1024;
    const text = textDocument.getText().slice(0, limit);
    const diags = gensequence_1.genSequence(await cspell_lib_1.validateText(text, options))
        // Convert the offset into a position
        .map(offsetWord => (Object.assign(Object.assign({}, offsetWord), { position: textDocument.positionAt(offsetWord.offset) })))
        // Calculate the range
        .map(word => (Object.assign(Object.assign({}, word), { range: {
            start: word.position,
            end: (Object.assign(Object.assign({}, word.position), { character: word.position.character + word.text.length }))
        } })))
        // Convert it to a Diagnostic
        .map(({ text, range }) => ({
        severity,
        range: range,
        message: `"${text}": Unknown word.`,
        source: exports.diagSource
    }));
    return diags;
}
exports.validateTextDocumentAsync = validateTextDocumentAsync;
//# sourceMappingURL=validator.js.map