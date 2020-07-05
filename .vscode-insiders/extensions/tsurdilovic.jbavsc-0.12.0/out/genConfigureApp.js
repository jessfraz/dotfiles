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
const genApp_1 = require("./genApp");
const confirmAndGen_1 = require("./confirmAndGen");
function genConfigureApp(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const title = "Configure your jBPM Business App";
        const appTypes = [
            {
                label: "Business Automation",
                description: "Process, case, decision management and optimization"
            },
            {
                label: "Decision Management",
                description: "Decision and rules features"
            },
            {
                label: "Business Optimization",
                description: "Planning problems and solutions"
            }
        ];
        const appVersions = [
            { label: "7.17.0-SNAPSHOT" },
            { label: "7.16.0.Final" },
            { label: "7.15.0.Final" },
            { label: "7.14.0.Final" },
            { label: "7.15.0.Final" },
            { label: "7.12.0.Final" }
        ];
        const appComponents = [
            {
                label: "Business Assets",
                description: "Includes Business Assets, Data Model, and Service"
            },
            {
                label: "Dynamic Assets",
                description: "Includes Dynamic Assets (Case Managements), Data Model, and Service"
            }
        ];
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield MultiStepInput.run(input => pickApplicationType(input, state));
                return state;
            });
        }
        function pickApplicationType(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 1,
                    totalSteps: 5,
                    placeholder: "Pick Application Type",
                    items: appTypes,
                    activeItem: typeof state.appType !== "string" ? state.appType : undefined,
                    shouldResume: shouldResume
                });
                state.appType = pick;
                return (input) => inputAppName(input, state);
            });
        }
        function inputAppName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.appName = yield input.showInputBox({
                    title,
                    step: 2,
                    totalSteps: 5,
                    value: typeof state.appName === "string"
                        ? state.appName
                        : "business-application",
                    prompt: "Choose a name for your app",
                    validate: validateAppName,
                    shouldResume: shouldResume
                });
                return (input) => inputAppPackage(input, state);
            });
        }
        function inputAppPackage(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.packageName = yield input.showInputBox({
                    title,
                    step: 3,
                    totalSteps: 5,
                    value: typeof state.packageName === "string"
                        ? state.packageName
                        : "com.company",
                    prompt: "Choose a package name for your app",
                    validate: validateAppName,
                    shouldResume: shouldResume
                });
                return (input) => pickApplicationVersion(input, state);
            });
        }
        function pickApplicationVersion(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 4,
                    totalSteps: 5,
                    placeholder: "Pick Application Version",
                    items: appVersions,
                    activeItem: typeof state.appVersion !== "string"
                        ? state.appVersion
                        : undefined,
                    shouldResume: shouldResume
                });
                state.appVersion = pick;
                return (input) => pickAppComponents(input, state);
            });
        }
        function pickAppComponents(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const pick = yield input.showQuickPick({
                    title,
                    step: 5,
                    totalSteps: 5,
                    placeholder: "Pick Application Components",
                    items: appComponents,
                    activeItem: typeof state.appComponents !== "string"
                        ? state.appComponents
                        : undefined,
                    shouldResume: shouldResume
                });
                state.appComponents = pick;
            });
        }
        function shouldResume() {
            // Could show a notification with the option to resume.
            return new Promise((resolve, reject) => { });
        }
        function validateAppName(name) {
            return __awaiter(this, void 0, void 0, function* () {
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return name.length < 1 ? "Invalid app name" : undefined;
            });
        }
        const confState = yield collectInputs();
        confirmAndGen_1.confirmAndGen(genApp_1.runConfiguredApp, context, confState);
    });
}
exports.genConfigureApp = genConfigureApp;
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
                            reject(shouldResume && (yield shouldResume())
                                ? InputFlowAction.resume
                                : InputFlowAction.cancel);
                        }))().catch(reject);
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
                    input.value = value || "";
                    input.prompt = prompt;
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    let validating = validate("");
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
                            reject(shouldResume && (yield shouldResume())
                                ? InputFlowAction.resume
                                : InputFlowAction.cancel);
                        }))().catch(reject);
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
//# sourceMappingURL=genConfigureApp.js.map