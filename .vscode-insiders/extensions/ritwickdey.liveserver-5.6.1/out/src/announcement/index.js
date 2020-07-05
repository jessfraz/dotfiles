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
const opn = require("opn");
const SETUP_STRING = 'liveServer.setup.version';
function checkNewAnnouncement(memento) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageJSON = vscode_1.extensions.getExtension('ritwickdey.LiveServer').packageJSON;
        const announment = packageJSON.announcement;
        if (!announment && Object.keys(announment).length === 0)
            return;
        const stateVersion = (yield memento.get(SETUP_STRING)) || '0.0.0';
        const installedVersion = packageJSON.version;
        if (stateVersion !== installedVersion && installedVersion === announment.onVersion) {
            yield memento.update(SETUP_STRING, installedVersion);
            const showDetails = 'Show Details';
            const choice = yield vscode_1.window.showInformationMessage(announment.message, showDetails);
            if (choice === showDetails) {
                const url = announment.url || 'https://github.com/ritwickdey/vscode-live-server';
                opn(url);
            }
        }
    });
}
exports.checkNewAnnouncement = checkNewAnnouncement;
//# sourceMappingURL=index.js.map