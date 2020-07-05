'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class Prompt {
    constructor(question, vscodeWrapper, ignoreFocusOut) {
        this._question = question;
        this._ignoreFocusOut = ignoreFocusOut ? ignoreFocusOut : false;
        this._vscodeWrapper = vscodeWrapper;
    }
    get defaultQuickPickOptions() {
        return {
            ignoreFocusOut: this._ignoreFocusOut
        };
    }
    get defaultInputBoxOptions() {
        return {
            ignoreFocusOut: this._ignoreFocusOut
        };
    }
}
exports.default = Prompt;

//# sourceMappingURL=prompt.js.map
