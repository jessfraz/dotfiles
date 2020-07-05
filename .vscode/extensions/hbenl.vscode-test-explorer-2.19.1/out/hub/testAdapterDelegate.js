"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAdapterDelegate = void 0;
const vscode = require("vscode");
class TestAdapterDelegate {
    constructor(adapter, controller) {
        this.adapter = adapter;
        this.controller = controller;
        this.testsEmitter = new vscode.EventEmitter();
        this.retireEmitter = new vscode.EventEmitter();
        this.disposables = [];
        this.disposables.push(this.testsEmitter);
        this.disposables.push(this.retireEmitter);
        if (adapter.debug) {
            this.debug = tests => adapter.debug(tests);
        }
        if (adapter.autorun) {
            this.disposables.push(adapter.autorun(() => this.retireEmitter.fire({})));
        }
        if (adapter.retire) {
            this.disposables.push(adapter.retire(retireEvent => this.retireEmitter.fire(retireEvent)));
        }
        else {
            this.disposables.push(adapter.tests(testLoadEvent => {
                if (testLoadEvent.type === 'finished') {
                    setTimeout(() => this.retireEmitter.fire({}), 0);
                }
            }));
        }
    }
    get workspaceFolder() {
        return this.adapter.workspaceFolder;
    }
    load() {
        return this.adapter.load();
    }
    run(tests) {
        return this.adapter.run(tests);
    }
    cancel() {
        this.adapter.cancel();
    }
    get tests() {
        return this.testsEmitter.event;
    }
    get testStates() {
        return this.adapter.testStates;
    }
    get retire() {
        return this.retireEmitter.event;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables.splice(0, this.disposables.length);
    }
}
exports.TestAdapterDelegate = TestAdapterDelegate;
//# sourceMappingURL=testAdapterDelegate.js.map