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
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
var LifeCycleStage;
(function (LifeCycleStage) {
    LifeCycleStage[LifeCycleStage["Install"] = 0] = "Install";
    LifeCycleStage[LifeCycleStage["Update"] = 1] = "Update";
    LifeCycleStage[LifeCycleStage["Uninstall"] = 2] = "Uninstall";
})(LifeCycleStage = exports.LifeCycleStage || (exports.LifeCycleStage = {}));
function generateNonce() {
    return crypto.randomBytes(32).toString('base64');
}
exports.generateNonce = generateNonce;
function getDataDirectory() {
    return path.join(__dirname, 'data');
}
exports.getDataDirectory = getDataDirectory;
function getLifeCycleFilePathInDirectory(directory) {
    return path.join(directory, 'life-cycle.json');
}
function getLifeCycleStateInDirectory(directory) {
    return new Promise((resolve) => {
        fs.readFile(getLifeCycleFilePathInDirectory(directory), (err, data) => {
            if (err) {
                resolve(null);
            }
            else {
                try {
                    resolve(JSON.parse(data.toString()));
                }
                catch (_) {
                    resolve(null);
                }
            }
        });
    });
}
exports.getLifeCycleStateInDirectory = getLifeCycleStateInDirectory;
function saveLifeCycleStateInDirectory(directory, state) {
    return new Promise((resolve, reject) => {
        fs.mkdir(directory, (err) => {
            if (!err || err.code === 'EEXIST') {
                fs.writeFile(getLifeCycleFilePathInDirectory(directory), JSON.stringify(state), (err) => {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                reject();
            }
        });
    });
}
exports.saveLifeCycleStateInDirectory = saveLifeCycleStateInDirectory;
function sendQueue(queue) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < queue.length; i++) {
            if (!(yield sendEvent(queue[i])))
                return false;
        }
        return true;
    });
}
exports.sendQueue = sendQueue;
function sendEvent(event) {
    return new Promise((resolve, reject) => {
        let completed = false, receivedResponse = false, apiAvailable = false;
        const complete = () => {
            if (!completed) {
                completed = true;
                if (receivedResponse) {
                    resolve(apiAvailable);
                }
                else {
                    reject();
                }
            }
        };
        const sendEvent = Object.assign({
            about: 'Information about this API is available at: https://api.mhutchie.com/vscode-git-graph/about'
        }, event);
        delete sendEvent.stage;
        const content = JSON.stringify(sendEvent);
        https.request({
            method: 'POST',
            hostname: 'api.mhutchie.com',
            path: '/vscode-git-graph/' + (event.stage === LifeCycleStage.Install ? 'install' : event.stage === LifeCycleStage.Update ? 'update' : 'uninstall'),
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': content.length
            },
            agent: false,
            timeout: 15000
        }, (res) => {
            res.on('data', () => { });
            res.on('end', () => {
                if (res.statusCode === 201) {
                    receivedResponse = true;
                    apiAvailable = true;
                }
                else if (res.statusCode === 410) {
                    receivedResponse = true;
                }
                complete();
            });
            res.on('error', complete);
        }).on('error', complete).on('close', complete).end(content);
    });
}
//# sourceMappingURL=utils.js.map