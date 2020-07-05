'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const nodeUtil = require("util");
const factory_1 = require("./factory");
const EscapeException_1 = require("../utils/EscapeException");
// Supports simple pattern for prompting for user input and acting on this
class CodeAdapter {
    constructor(vscodeWrapper) {
        this.vscodeWrapper = vscodeWrapper;
        this.messageLevelFormatters = {};
        this.outChannel = this.vscodeWrapper.outputChannel;
    }
    logError(message) {
        let line = `error: ${message.message}\n    Code - ${message.code}`;
        this.outChannel.appendLine(line);
    }
    formatMessage(message) {
        const prefix = `${message.level}: (${message.id}) `;
        return `${prefix}${message.message}`;
    }
    log(message) {
        let line = '';
        if (message && typeof (message.level) === 'string') {
            let formatter = this.formatMessage;
            if (this.messageLevelFormatters[message.level]) {
                formatter = this.messageLevelFormatters[message.level];
            }
            line = formatter(message);
        }
        else {
            line = nodeUtil.format(arguments);
        }
        this.outChannel.appendLine(line);
    }
    clearLog() {
        this.outChannel.clear();
    }
    showLog() {
        this.outChannel.show();
    }
    // TODO define question interface
    fixQuestion(question) {
        if (question.type === 'checkbox' && Array.isArray(question.choices)) {
            // For some reason when there's a choice of checkboxes, they aren't formatted properly
            // Not sure where the issue is
            question.choices = question.choices.map(item => {
                if (typeof (item) === 'string') {
                    return { checked: false, name: item, value: item };
                }
                else {
                    return item;
                }
            });
        }
    }
    promptSingle(question, ignoreFocusOut) {
        let questions = [question];
        return this.prompt(questions, ignoreFocusOut).then(answers => {
            if (answers) {
                return answers[question.name] || undefined;
            }
            return undefined;
        });
    }
    prompt(questions, ignoreFocusOut) {
        let answers = {};
        // Collapse multiple questions into a set of prompt steps
        let promptResult = questions.reduce((promise, question) => {
            this.fixQuestion(question);
            return promise.then(() => {
                return factory_1.default.createPrompt(question, this.vscodeWrapper, ignoreFocusOut);
            }).then(prompt => {
                // Original Code: uses jQuery patterns. Keeping for reference
                // if (!question.when || question.when(answers) === true) {
                //     return prompt.render().then(result => {
                //         answers[question.name] = question.filter ? question.filter(result) : result;
                //     });
                // }
                if (!question.shouldPrompt || question.shouldPrompt(answers) === true) {
                    return prompt.render().then(result => {
                        answers[question.name] = result;
                        if (question.onAnswered) {
                            question.onAnswered(result);
                        }
                        return answers;
                    });
                }
                return answers;
            });
        }, Promise.resolve());
        return promptResult.catch(err => {
            if (err instanceof EscapeException_1.default || err instanceof TypeError) {
                return undefined;
            }
            this.vscodeWrapper.showErrorMessage(err.message);
        });
    }
    // Helper to make it possible to prompt using callback pattern. Generally Promise is a preferred flow
    promptCallback(questions, callback) {
        // Collapse multiple questions into a set of prompt steps
        this.prompt(questions).then(answers => {
            if (callback) {
                callback(answers);
            }
        });
    }
}
exports.default = CodeAdapter;

//# sourceMappingURL=adapter.js.map
