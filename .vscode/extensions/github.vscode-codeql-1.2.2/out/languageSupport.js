"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
/**
 * OnEnterRules are available in language-configurations, but you cannot specify them in the language-configuration.json.
 * They can only be specified programmatically.
 *
 * Also, we should keep the language-configuration.json as a json file and register it in the package.json because
 * it is registered first, before the extension is activated, so language features are available quicker.
 *
 * See https://github.com/microsoft/vscode/issues/11514
 * See https://github.com/microsoft/vscode/blob/master/src/vs/editor/test/common/modes/supports/javascriptOnEnterRules.ts
 */
function install() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const langConfig = require('../language-configuration.json');
    // setLanguageConfiguration requires a regexp for the wordpattern, not a string
    langConfig.wordPattern = new RegExp(langConfig.wordPattern);
    langConfig.onEnterRules = onEnterRules;
    langConfig.indentationRules = {
        decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]].*$/,
        increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
    };
    vscode_1.languages.setLanguageConfiguration('ql', langConfig);
    vscode_1.languages.setLanguageConfiguration('qll', langConfig);
    vscode_1.languages.setLanguageConfiguration('dbscheme', langConfig);
}
exports.install = install;
const onEnterRules = [
    {
        // e.g. /** | */
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        afterText: /^\s*\*\/$/,
        action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
    }, {
        // e.g. /** ...|
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
    }, {
        // e.g.  * ...|
        beforeText: /^(\t|[ ])*[ ]\*([ ]([^\*]|\*(?!\/))*)?$/,
        oneLineAboveText: /^(\s*(\/\*\*|\*)).*/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
    }, {
        // e.g.  */|
        beforeText: /^(\t|[ ])*[ ]\*\/\s*$/,
        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
    },
    {
        // e.g.  *-----*/|
        beforeText: /^(\t|[ ])*[ ]\*[^/]*\*\/\s*$/,
        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
    }
];

//# sourceMappingURL=languageSupport.js.map
