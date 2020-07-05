'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("./prompt");
const EscapeException_1 = require("../utils/EscapeException");
const figures = require('figures');
class InputPrompt extends prompt_1.default {
    constructor(question, vscodeWrapper, ignoreFocusOut) {
        super(question, vscodeWrapper, ignoreFocusOut);
        this._options = this.defaultInputBoxOptions;
        this._options.prompt = this._question.message;
    }
    // Helper for callers to know the right type to get from the type factory
    static get promptType() { return 'input'; }
    render() {
        // Prefer default over the placeHolder, if specified
        let placeHolder = this._question.default ? this._question.default : this._question.placeHolder;
        if (this._question.default instanceof Error) {
            placeHolder = this._question.default.message;
            this._question.default = undefined;
        }
        this._options.placeHolder = placeHolder;
        if (this._question.default) {
            this._options.value = this._question.default;
        }
        return this._vscodeWrapper.showInputBox(this._options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            if (result === '') {
                // Use the default value, if defined
                result = this._question.default || '';
            }
            const validationError = this._question.validate ? this._question.validate(result || '') : undefined;
            if (validationError) {
                this._question.default = new Error(`${figures.warning} ${validationError}`);
                return this.render();
            }
            return result;
        });
    }
}
exports.default = InputPrompt;

//# sourceMappingURL=input.js.map
