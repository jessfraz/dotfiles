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
const genApp_1 = require("./genApp");
const confirmAndGen_1 = require("./confirmAndGen");
const multistep_1 = require("../shared/multistep");
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
            { label: "7.20.0-SNAPSHOT" },
            { label: "7.19.0.Final" },
            { label: "7.18.0.Final" },
            { label: "7.17.0.Final" },
            { label: "7.16.0.Final" },
            { label: "7.15.0.Final" },
            { label: "7.14.0.Final" },
            { label: "7.13.0.Final" },
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
                yield multistep_1.default.run(input => pickApplicationType(input, state));
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
//# sourceMappingURL=genConfigureApp.js.map