"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
function onStartUp(extensionContext) {
    return __awaiter(this, void 0, void 0, function* () {
        if (vscode.env.sessionId === 'someValue.sessionId') {
            return;
        }
        let state = yield utils_1.getLifeCycleStateInDirectory(extensionContext.globalStoragePath);
        if (state !== null && !state.apiAvailable) {
            return;
        }
        const versions = {
            extension: yield getExtensionVersion(extensionContext),
            vscode: vscode.version
        };
        if (state === null || state.current.extension !== versions.extension) {
            const nonce = yield getNonce();
            if (state === null) {
                state = {
                    previous: null,
                    current: versions,
                    apiAvailable: true,
                    queue: [{
                            stage: utils_1.LifeCycleStage.Install,
                            extension: versions.extension,
                            vscode: versions.vscode,
                            nonce: nonce
                        }]
                };
            }
            else {
                state.previous = state.current;
                state.current = versions;
                state.queue.push({
                    stage: utils_1.LifeCycleStage.Update,
                    from: state.previous,
                    to: state.current,
                    nonce: nonce
                });
            }
            yield saveLifeCycleState(extensionContext, state);
            state.apiAvailable = yield utils_1.sendQueue(state.queue);
            state.queue = [];
            yield saveLifeCycleState(extensionContext, state);
        }
        else if (state.queue.length > 0) {
            state.apiAvailable = yield utils_1.sendQueue(state.queue);
            state.queue = [];
            yield saveLifeCycleState(extensionContext, state);
        }
    });
}
exports.onStartUp = onStartUp;
function saveLifeCycleState(extensionContext, state) {
    return Promise.all([
        utils_1.saveLifeCycleStateInDirectory(extensionContext.globalStoragePath, state),
        utils_1.saveLifeCycleStateInDirectory(utils_1.getDataDirectory(), state)
    ]);
}
function getExtensionVersion(extensionContext) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(extensionContext.extensionPath, 'package.json'), (err, data) => {
            if (err) {
                reject();
            }
            else {
                try {
                    resolve(JSON.parse(data.toString()).version);
                }
                catch (_) {
                    reject();
                }
            }
        });
    });
}
function getNonce() {
    return new Promise((resolve, reject) => {
        const dir = utils_1.getDataDirectory();
        const file = path.join(dir, 'lock.json');
        fs.mkdir(dir, (err) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    fs.readFile(file, (err, data) => {
                        if (err) {
                            reject();
                        }
                        else {
                            try {
                                resolve(JSON.parse(data.toString()).nonce);
                            }
                            catch (_) {
                                reject();
                            }
                        }
                    });
                }
                else {
                    reject();
                }
            }
            else {
                const nonce = utils_1.generateNonce();
                fs.writeFile(file, JSON.stringify({ nonce: nonce }), (err) => {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve(nonce);
                    }
                });
            }
        });
    });
}
//# sourceMappingURL=startup.js.map