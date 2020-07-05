'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("./prompt");
const EscapeException_1 = require("../utils/EscapeException");
const figures = require('figures');
class ExpandPrompt extends prompt_1.default {
    constructor(question, vscodeWrapper, ignoreFocusOut) {
        super(question, vscodeWrapper, ignoreFocusOut);
    }
    render() {
        // label indicates this is a quickpick item. Otherwise it's a name-value pair
        if (this._question.choices[0].label) {
            return this.renderQuickPick(this._question.choices);
        }
        else {
            return this.renderNameValueChoice(this._question.choices);
        }
    }
    renderQuickPick(choices) {
        let options = this.defaultQuickPickOptions;
        options.placeHolder = this._question.message;
        return this._vscodeWrapper.showQuickPick(choices, options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            return this.validateAndReturn(result || false);
        });
    }
    renderNameValueChoice(choices) {
        const choiceMap = this._question.choices.reduce((result, choice) => {
            result[choice.name] = choice.value;
            return result;
        }, {});
        let options = this.defaultQuickPickOptions;
        options.placeHolder = this._question.message;
        return this._vscodeWrapper.showQuickPickStrings(Object.keys(choiceMap), options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            // Note: cannot be used with 0 or false responses
            let returnVal = choiceMap[result] || false;
            return this.validateAndReturn(returnVal);
        });
    }
    validateAndReturn(value) {
        if (!this.validate(value)) {
            return this.render();
        }
        return value;
    }
    validate(value) {
        const validationError = this._question.validate ? this._question.validate(value || '') : undefined;
        if (validationError) {
            this._question.message = `${figures.warning} ${validationError}`;
            return false;
        }
        return true;
    }
}
exports.default = ExpandPrompt;

//# sourceMappingURL=expand.js.map
