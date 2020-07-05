"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCodeActionHandler = void 0;
const LangServer = require("vscode-languageserver");
const cspell_lib_1 = require("cspell-lib");
const Validator = require("./validator");
const cspell = require("cspell-lib");
const documentSettings_1 = require("./documentSettings");
const SuggestionsGenerator_1 = require("./SuggestionsGenerator");
const util_1 = require("./util");
const log_1 = require("./log");
function extractText(textDocument, range) {
    return textDocument.getText(range);
}
function onCodeActionHandler(documents, fnSettings, fnSettingsVersion, documentSettings) {
    const sugGen = new SuggestionsGenerator_1.SuggestionGenerator(getSettings);
    const settingsCache = new Map();
    async function getSettings(doc) {
        const cached = settingsCache.get(doc.uri);
        const settingsVersion = fnSettingsVersion(doc);
        if (!cached || cached.docVersion !== doc.version || cached.settingsVersion !== settingsVersion) {
            const settings = constructSettings(doc);
            settingsCache.set(doc.uri, { docVersion: doc.version, settings, settingsVersion });
        }
        return settingsCache.get(doc.uri).settings;
    }
    async function constructSettings(doc) {
        const settings = cspell.constructSettingsForText(await fnSettings(doc), doc.getText(), doc.languageId);
        const dictionary = await cspell.getDictionary(settings);
        return { settings, dictionary };
    }
    const handler = async (params) => {
        const actions = [];
        const { context, textDocument: { uri } } = params;
        const { diagnostics } = context;
        const spellCheckerDiags = diagnostics.filter(diag => diag.source === Validator.diagSource);
        if (!spellCheckerDiags.length)
            return [];
        const optionalTextDocument = documents.get(uri);
        if (!optionalTextDocument)
            return [];
        log_1.log(`CodeAction Only: ${context.only} Num: ${diagnostics.length}`, uri);
        const textDocument = optionalTextDocument;
        const { settings: docSetting, dictionary } = await getSettings(textDocument);
        if (!documentSettings_1.isUriAllowed(uri, docSetting.allowedSchemas)) {
            log_1.log(`CodeAction Uri Not allowed: ${uri}`);
            return [];
        }
        const folders = await documentSettings.folders;
        const showAddToWorkspace = folders && folders.length > 0;
        const showAddToFolder = folders && folders.length > 1;
        function replaceText(range, text) {
            return LangServer.TextEdit.replace(range, text || '');
        }
        function getSuggestions(word) {
            return sugGen.genWordSuggestions(textDocument, word);
        }
        function createAction(title, command, diags, ...args) {
            const cmd = LangServer.Command.create(title, command, ...args);
            const action = LangServer.CodeAction.create(title, cmd);
            action.diagnostics = diags;
            action.kind = LangServer.CodeActionKind.QuickFix;
            return action;
        }
        async function genCodeActionsForSuggestions(_dictionary) {
            log_1.log('CodeAction generate suggestions');
            let diagWord;
            for (const diag of spellCheckerDiags) {
                const word = extractText(textDocument, diag.range);
                diagWord = diagWord || word;
                const sugs = await getSuggestions(word);
                sugs
                    .map(sug => cspell_lib_1.Text.isLowerCase(sug) ? cspell_lib_1.Text.matchCase(word, sug) : sug)
                    .filter(util_1.uniqueFilter())
                    .forEach(sugWord => {
                    const action = createAction(sugWord, 'cSpell.editText', [diag], uri, textDocument.version, [replaceText(diag.range, sugWord)]);
                    /**
                      * Waiting on [Add isPreferred to the CodeAction protocol. Pull Request #489 · Microsoft/vscode-languageserver-node](https://github.com/Microsoft/vscode-languageserver-node/pull/489)
                      * Note we might want this to be a config setting incase someone has `"editor.codeActionsOnSave": { "source.fixAll": true }`
                      * if (!actions.length) {
                      *     action.isPreferred = true;
                      * }
                      */
                    actions.push(action);
                });
            }
            const word = diagWord || extractText(textDocument, params.range);
            // Only suggest adding if it is our diagnostic and there is a word.
            if (word && spellCheckerDiags.length) {
                actions.push(createAction('Add: "' + word + '" to user dictionary', 'cSpell.addWordToUserDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                if (showAddToFolder) {
                    // Allow the them to add it to the project dictionary.
                    actions.push(createAction('Add: "' + word + '" to folder dictionary', 'cSpell.addWordToDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                }
                if (showAddToWorkspace) {
                    // Allow the them to add it to the workspace dictionary.
                    actions.push(createAction('Add: "' + word + '" to workspace dictionary', 'cSpell.addWordToWorkspaceDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                }
            }
            return actions;
        }
        return genCodeActionsForSuggestions(dictionary);
    };
    return handler;
}
exports.onCodeActionHandler = onCodeActionHandler;
//# sourceMappingURL=codeActions.js.map