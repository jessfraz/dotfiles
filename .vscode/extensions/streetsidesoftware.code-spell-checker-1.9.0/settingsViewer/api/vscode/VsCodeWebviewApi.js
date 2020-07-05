"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelName = 'settingsViewer';
const vsCodeApi = acquireAPI();
const listeners = [];
class VsCodeWebviewApi {
    postMessage(msg) {
        vsCodeApi.postMessage(msg);
        return this;
    }
    get onmessage() {
        return this._onmessage;
    }
    set onmessage(listener) {
        const found = listeners.findIndex(v => v === this._onmessage);
        if (found >= 0) {
            listeners.splice(found, 1);
        }
        if (listener) {
            listeners.push(listener);
        }
        this._onmessage = listener;
    }
}
exports.VsCodeWebviewApi = VsCodeWebviewApi;
function acquireVsCodeWebviewAPI() {
    try {
        return acquireVsCodeApi();
    }
    catch (e) {
        if (!(e instanceof ReferenceError)) {
            throw e;
        }
    }
    return undefined;
}
function onMessage(message) {
    listeners.forEach(fn => fn(message));
}
function acquireAPI() {
    const vsCodeApi = acquireVsCodeWebviewAPI();
    if (vsCodeApi) {
        window.addEventListener('message', onMessage);
        return {
            postMessage(msg) {
                vsCodeApi.postMessage(msg);
            }
        };
    }
    if (typeof BroadcastChannel !== 'function') {
        return {
            postMessage() { }
        };
    }
    const channel = new BroadcastChannel(exports.channelName);
    channel.onmessage = onMessage;
    return channel;
}
//# sourceMappingURL=VsCodeWebviewApi.js.map