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
const startGen_1 = require("./lib/generate/startGen");
const debugMonitor_1 = require("./lib/debug/debugMonitor");
const startPreview_1 = require("./lib/preview/startPreview");
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("jbpm.jbavsc", () => __awaiter(this, void 0, void 0, function* () {
        startGen_1.startGen(context);
    })), vscode_1.commands.registerCommand("jbpm.jbavsc.debug", () => __awaiter(this, void 0, void 0, function* () {
        debugMonitor_1.startDebugger(context);
    })), vscode_1.commands.registerCommand("jbpm.jbavsc.processquickview", (uri) => __awaiter(this, void 0, void 0, function* () {
        startPreview_1.startPreview(context, uri);
    })));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map