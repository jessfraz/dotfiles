'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
const prompt_1 = require("./prompt");
const LocalizedConstants = require("../constants/localizedConstants");
const EscapeException_1 = require("../utils/EscapeException");
class ConfirmPrompt extends prompt_1.default {
    constructor(question, vscodeWrapper, ignoreFocusOut) {
        super(question, vscodeWrapper, ignoreFocusOut);
    }
    render() {
        let choices = {};
        choices[LocalizedConstants.msgYes] = true;
        choices[LocalizedConstants.msgNo] = false;
        let options = this.defaultQuickPickOptions;
        options.placeHolder = this._question.message;
        return this._vscodeWrapper.showQuickPickStrings(Object.keys(choices), options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            return choices[result] || false;
        });
    }
}
exports.default = ConfirmPrompt;

//# sourceMappingURL=confirm.js.map
