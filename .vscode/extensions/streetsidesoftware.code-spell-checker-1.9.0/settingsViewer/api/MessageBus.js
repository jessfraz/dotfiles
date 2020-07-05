"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("./message");
class MessageBus {
    constructor(vsCodeApi) {
        this.vsCodeApi = vsCodeApi;
        this.listeners = new Map();
        this.vsCodeApi.onmessage = (msg) => this.respondToMessage(msg);
    }
    listenFor(cmd, fn) {
        const listener = {
            fn,
            cmd,
            dispose: () => this.listeners.has(cmd) && this.listeners.get(cmd).delete(listener),
        };
        this.listeners.set(cmd, this.listeners.get(cmd) || new Set());
        const cmdListeners = this.listeners.get(cmd);
        cmdListeners.add(listener);
        return listener;
    }
    postMessage(msg) {
        this.vsCodeApi.postMessage(msg);
    }
    respondToMessage(msg) {
        const message = msg.data;
        if (!message_1.isMessage(message)) {
            return;
        }
        const listeners = this.listeners.get(message.command);
        if (!listeners) {
            return;
        }
        for (const listener of listeners) {
            listener.fn(message);
        }
    }
}
exports.MessageBus = MessageBus;
//# sourceMappingURL=MessageBus.js.map