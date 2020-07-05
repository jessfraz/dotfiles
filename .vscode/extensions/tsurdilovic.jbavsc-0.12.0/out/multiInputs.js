"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function multiStepInput(context) {
    return __awaiter(this, void 0, void 0, function* () {
        class MyButton {
            constructor(iconPath, tooltip) {
                this.iconPath = iconPath;
                this.tooltip = tooltip;
            }
        }
        const createResourceGroupButton = new MyButton({
            dark: vscode_1.Uri.file(context.asAbsolutePath('resources/dark/add.svg')),
            light: vscode_1.Uri.file(context.asAbsolutePath('resources/light/add.svg')),
        }, 'Create Resource Group');
        const resourceGroups = ['vscode-data-function', 'vscode-appservice-microservices', 'vscode-appservice-monitor', 'vscode-appservice-preview', 'vscode-appservice-prod']
            .map(label => ({ label }));
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield MultiStepInput.run(input => pickResourceGroup(input, state));
                return state;
            });
        }
        const title = 'Create Application Service';
        function pickResourceGroup(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 1,
                    totalSteps: 3,
                    placeholder: 'Pick a resource group',
                    items: resourceGroups,
                    activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
                    buttons: [createResourceGroupButton],
                    shouldResume: shouldResume
                });
                if (pick instanceof MyButton) {
                    return (input) => inputResourceGroupName(input, state);
                }
                state.resourceGroup = pick;
                return (input) => inputName(input, state);
            });
        }
        function inputResourceGroupName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.resourceGroup = yield input.showInputBox({
                    title,
                    step: 2,
                    totalSteps: 4,
                    value: typeof state.resourceGroup === 'string' ? state.resourceGroup : '',
                    prompt: 'Choose a unique name for the resource group',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => inputName(input, state);
            });
        }
        function inputName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
                // TODO: Remember current value when navigating back.
                state.name = yield input.showInputBox({
                    title,
                    step: 2 + additionalSteps,
                    totalSteps: 3 + additionalSteps,
                    value: state.name || '',
                    prompt: 'Choose a unique name for the Application Service',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => pickRuntime(input, state);
            });
        }
        function pickRuntime(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
                const runtimes = yield getAvailableRuntimes(state.resourceGroup, undefined /* TODO: token */);
                // TODO: Remember currently active item when navigating back.
                state.runtime = yield input.showQuickPick({
                    title,
                    step: 3 + additionalSteps,
                    totalSteps: 3 + additionalSteps,
                    placeholder: 'Pick a runtime',
                    items: runtimes,
                    activeItem: state.runtime,
                    shouldResume: shouldResume
                });
            });
        }
        function shouldResume() {
            // Could show a notification with the option to resume.
            return new Promise((resolve, reject) => {
            });
        }
        function validateNameIsUnique(name) {
            return __awaiter(this, void 0, void 0, function* () {
                // ...validate...
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return name === 'vscode' ? 'Name not unique' : undefined;
            });
        }
        function getAvailableRuntimes(resourceGroup, token) {
            return __awaiter(this, void 0, void 0, function* () {
                // ...retrieve...
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return ['Node 8.9', 'Node 6.11', 'Node 4.5']
                    .map(label => ({ label }));
            });
        }
        const state = yield collectInputs();
        vscode_1.window.showInformationMessage(`Creating Application Service '${state.name}'`);
    });
}
exports.multiStepInput = multiStepInput;
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class InputFlowAction {
    constructor() { }
}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.back) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.resume) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.cancel) {
                        step = undefined;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
        });
    }
    showQuickPick({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createQuickPick();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.items = items;
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidChangeSelection(items => resolve(items[0])), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
    showInputBox({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || '';
                    input.prompt = prompt;
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    let validating = validate('');
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(yield validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidChangeValue((text) => __awaiter(this, void 0, void 0, function* () {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = yield current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
}
//# sourceMappingURL=multiInputs.js.map