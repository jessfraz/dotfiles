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
const multistep_1 = require("../shared/multistep");
const monitorPanel_1 = require("./monitorPanel");
function startMonitor(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const title = "Debug your jBPM Business App";
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const appState = {};
                yield multistep_1.default.run(input => inputAppUrl(input, appState));
                return appState;
            });
        }
        function inputAppUrl(input, appState) {
            return __awaiter(this, void 0, void 0, function* () {
                appState.url = yield input.showInputBox({
                    title,
                    step: 1,
                    totalSteps: 3,
                    value: typeof appState.url === "string"
                        ? appState.url
                        : "http://localhost:8090",
                    prompt: "Enter app rest URL",
                    validate: validateInput,
                    shouldResume: shouldResume
                });
                return (input) => inputAppUserName(input, appState);
            });
        }
        function inputAppUserName(input, appState) {
            return __awaiter(this, void 0, void 0, function* () {
                appState.username = yield input.showInputBox({
                    title,
                    step: 2,
                    totalSteps: 3,
                    value: typeof appState.username === "string"
                        ? appState.username
                        : "user",
                    prompt: "Auth username (leave blank if no auth configured)",
                    validate: validateInput,
                    shouldResume: shouldResume
                });
                return (input) => inputAppUserPassword(input, appState);
            });
        }
        function inputAppUserPassword(input, appState) {
            return __awaiter(this, void 0, void 0, function* () {
                appState.password = yield input.showInputBox({
                    title,
                    step: 3,
                    totalSteps: 3,
                    value: typeof appState.password === "string"
                        ? appState.password
                        : "user",
                    prompt: "Auth password (leave blank if no auth configured)",
                    validate: validateInput,
                    shouldResume: shouldResume
                });
            });
        }
        function shouldResume() {
            return new Promise((resolve, reject) => { });
        }
        function validateInput(name) {
            return __awaiter(this, void 0, void 0, function* () {
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return name.length < 0 ? "Invalid Input" : undefined;
            });
        }
        const appState = yield collectInputs();
        // make sure appState url ends with slash
        if (!appState.url.endsWith("/")) {
            appState.url = appState.url + "/";
        }
        monitorPanel_1.createMonitorPanel(context, appState);
    });
}
exports.startMonitor = startMonitor;
//# sourceMappingURL=startMonitor.js.map