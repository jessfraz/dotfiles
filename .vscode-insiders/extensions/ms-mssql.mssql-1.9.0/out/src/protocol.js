"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
}
exports.Deferred = Deferred;
class MessageProxy {
    constructor(protocol, handler, isClient = false) {
        this.protocol = protocol;
        this.handler = handler;
        this.ready = new Deferred();
        this.messageid = 0;
        this.responseMap = new Map();
        this.disposables = [];
        const self = this;
        if (!isClient) {
            const first = self.protocol.onMessage(message => {
                // first message
                if (message === 'ready') {
                    // sanity check
                    this.disposables.push(self.protocol.onMessage((val) => {
                        if (val !== 'ready') {
                            self.onReceive(val);
                        }
                    }));
                    first.dispose();
                    self.ready.resolve();
                }
            });
        }
        else {
            this.disposables.push(this.protocol.onMessage(val => this.onReceive(val)));
            this.ready.resolve();
            this.protocol.sendMessage('ready');
        }
    }
    sendRequest(methodName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready;
            const messageId = this.messageid++;
            const deferred = new Deferred();
            this.responseMap.set(messageId, deferred);
            const request = {
                messageId: messageId,
                method: methodName,
                passArguments: args
            };
            this.protocol.sendMessage(JSON.stringify(request));
            return deferred.promise;
        });
    }
    onReceive(val) {
        const message = JSON.parse(val);
        if (isResponseMessage(message)) { // is a response
            const deferred = this.responseMap.get(message.originalMessageId);
            if (deferred) {
                deferred.resolve(message.response);
            }
        }
        else {
            Promise.resolve(this.handler[message.method].apply(this.handler, message.passArguments)).then(r => {
                const response = {
                    originalMessageId: message.messageId,
                    response: r
                };
                this.protocol.sendMessage(JSON.stringify(response));
            });
        }
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
function isResponseMessage(val) {
    return typeof val.originalMessageId === 'number';
}
function createProxy(protocol, handler, isClient) {
    const messageProxy = new MessageProxy(protocol, handler, isClient);
    let proxy = {
        get: (target, name) => {
            if (!target[name]) {
                target[name] = (...myArgs) => {
                    return messageProxy.sendRequest(name, myArgs);
                };
            }
            return target[name];
        },
        dispose: () => {
            messageProxy.dispose();
        }
    };
    // tslint:disable-next-line: no-null-keyword
    return new Proxy(Object.create(null), proxy);
}
exports.createProxy = createProxy;

//# sourceMappingURL=protocol.js.map
