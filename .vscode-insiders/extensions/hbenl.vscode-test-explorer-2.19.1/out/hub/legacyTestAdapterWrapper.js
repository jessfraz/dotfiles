"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyTestAdapterWrapper = void 0;
const tslib_1 = require("tslib");
const vscode = require("vscode");
class LegacyTestAdapterWrapper {
    constructor(legacyAdapter, hub) {
        this.legacyAdapter = legacyAdapter;
        this.hub = hub;
        this.testsEmitter = new vscode.EventEmitter();
        this.testStatesEmitter = new vscode.EventEmitter();
        this.disposables = [];
        this.disposables.push(this.testsEmitter);
        this.disposables.push(this.testStatesEmitter);
        this.disposables.push(this.legacyAdapter.testStates(event => this.testStatesEmitter.fire(event)));
        if (this.legacyAdapter.reload) {
            this.disposables.push(this.legacyAdapter.reload(() => this.load()));
        }
    }
    get workspaceFolder() {
        return this.legacyAdapter.workspaceFolder;
    }
    load() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.testsEmitter.fire({ type: 'started' });
            let suite;
            try {
                suite = yield this.legacyAdapter.load();
            }
            catch (e) { }
            this.testsEmitter.fire({ type: 'finished', suite });
        });
    }
    run(nodeIds) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const allTests = this.hub.getTests(this);
            if (!allTests)
                return;
            const tests = (nodeIds.length > 0) ? this.find(nodeIds[0], allTests) : allTests;
            if (!tests)
                return;
            this.testStatesEmitter.fire({ type: 'started', tests: nodeIds });
            try {
                yield this.legacyAdapter.run(tests);
            }
            catch (e) { }
            this.testStatesEmitter.fire({ type: 'finished' });
        });
    }
    debug(nodeIds) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const allTests = this.hub.getTests(this);
            if (!allTests)
                return;
            const tests = (nodeIds.length > 0) ? this.find(nodeIds[0], allTests) : allTests;
            if (!tests)
                return;
            this.testStatesEmitter.fire({ type: 'started', tests: nodeIds });
            try {
                yield this.legacyAdapter.debug(tests);
            }
            catch (e) { }
            this.testStatesEmitter.fire({ type: 'finished' });
        });
    }
    cancel() {
        this.legacyAdapter.cancel();
    }
    get tests() {
        return this.testsEmitter.event;
    }
    get testStates() {
        return this.testStatesEmitter.event;
    }
    get autorun() {
        return this.legacyAdapter.autorun;
    }
    find(id, info) {
        if (info.id === id) {
            return info;
        }
        else if (info.type === 'suite') {
            for (const child of info.children) {
                const found = this.find(id, child);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables.splice(0, this.disposables.length);
    }
}
exports.LegacyTestAdapterWrapper = LegacyTestAdapterWrapper;
//# sourceMappingURL=legacyTestAdapterWrapper.js.map