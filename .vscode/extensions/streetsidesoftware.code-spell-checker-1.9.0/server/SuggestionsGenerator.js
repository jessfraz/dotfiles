"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionGenerator = exports.maxNumberOfSuggestionsForLongWords = exports.wordLengthForLimitingSuggestions = exports.maxWordLengthForSuggestions = void 0;
const cspell_lib_1 = require("cspell-lib");
const defaultNumSuggestions = 10;
const regexJoinedWords = /[+]/g;
exports.maxWordLengthForSuggestions = 20;
exports.wordLengthForLimitingSuggestions = 15;
exports.maxNumberOfSuggestionsForLongWords = 1;
const maxEdits = 3;
class SuggestionGenerator {
    constructor(getSettings) {
        this.getSettings = getSettings;
    }
    async genSuggestions(doc, word) {
        const { settings, dictionary } = await this.getSettings(doc);
        const { numSuggestions = defaultNumSuggestions } = settings;
        if (word.length > exports.maxWordLengthForSuggestions) {
            return [];
        }
        const numSugs = word.length > exports.wordLengthForLimitingSuggestions ? exports.maxNumberOfSuggestionsForLongWords : numSuggestions;
        const options = {
            numChanges: maxEdits,
            numSuggestions: numSugs,
            // Turn off compound suggestions for now until it works a bit better.
            compoundMethod: cspell_lib_1.CompoundWordsMethod.NONE,
            ignoreCase: !settings.caseSensitive,
        };
        return dictionary.suggest(word, options).map(s => (Object.assign(Object.assign({}, s), { word: s.word.replace(regexJoinedWords, '') })));
    }
    async genWordSuggestions(doc, word) {
        return (await this.genSuggestions(doc, word)).map(sr => sr.word);
    }
}
exports.SuggestionGenerator = SuggestionGenerator;
//# sourceMappingURL=SuggestionsGenerator.js.map