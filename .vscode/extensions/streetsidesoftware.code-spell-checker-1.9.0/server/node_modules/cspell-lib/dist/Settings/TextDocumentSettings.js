"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LanguageSettings_1 = require("./LanguageSettings");
const CSpellSettings = require("./CSpellSettingsServer");
const InDocSettings_1 = require("./InDocSettings");
function combineTextAndLanguageSettings(settings, text, languageId) {
    const docSettings = extractSettingsFromText(text);
    const settingsForText = CSpellSettings.mergeSettings(settings, docSettings);
    const langSettings = LanguageSettings_1.calcSettingsForLanguageId(settingsForText, languageId);
    // Merge again, to force In-Doc settings.
    return CSpellSettings.mergeSettings(langSettings, docSettings);
}
exports.combineTextAndLanguageSettings = combineTextAndLanguageSettings;
function extractSettingsFromText(text) {
    return InDocSettings_1.getInDocumentSettings(text);
}
exports.extractSettingsFromText = extractSettingsFromText;
//# sourceMappingURL=TextDocumentSettings.js.map