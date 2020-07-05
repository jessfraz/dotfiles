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
const jba = require("jba-cli");
function runDefaultApp(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceRoot = vscode_1.workspace.rootPath;
        if (!workspaceRoot) {
            vscode_1.window.showInformationMessage(`Unable to generate app - no workspace root found.'`);
            return;
        }
        return yield new Promise((resolve, reject) => {
            try {
                jba.getAndGenerate({}, true, "https://start.jbpm.org/gen", true, workspaceRoot);
                resolve("done");
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.runDefaultApp = runDefaultApp;
function runConfiguredApp(context, configState) {
    return __awaiter(this, void 0, void 0, function* () {
        var appDetails = {
            capabilities: "bpm",
            packagename: "com.company",
            name: "business-application",
            version: "",
            options: "kjar,model,service"
        };
        if (configState.appName) {
            appDetails.name = configState.appName;
        }
        if (configState.packageName) {
            appDetails.packagename = configState.packageName;
        }
        if (configState.appVersion) {
            appDetails.version = configState.appVersion.label;
        }
        if (configState.appComponents) {
            var appComponentsVal = configState.appComponents.label;
            if (appComponentsVal === "Business Assets") {
                appDetails.options = "kjar,model,service";
            }
            else if (appComponentsVal === "Dynamic Assets") {
                appDetails.options = "dkjar,model,service";
            }
        }
        if (configState.appType) {
            var appTypeVal = configState.appType.label;
            if (appTypeVal === "Business Automation") {
                appDetails.capabilities = "bpm";
            }
            else if (appTypeVal === "Decision Management") {
                appDetails.capabilities = "brm";
            }
            else if (appTypeVal === "Business Optimization") {
                appDetails.capabilities = "planner";
            }
        }
        let workspaceRoot = vscode_1.workspace.rootPath;
        if (!workspaceRoot) {
            vscode_1.window.showInformationMessage(`Unable to generate app - no workspace root found.'`);
            return;
        }
        return yield new Promise((resolve, reject) => {
            try {
                jba.getAndGenerate(appDetails, true, "https://start.jbpm.org/gen", true, workspaceRoot);
                resolve("done");
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.runConfiguredApp = runConfiguredApp;
//# sourceMappingURL=genApp.js.map