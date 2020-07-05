"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHub = void 0;
const testAdapterDelegate_1 = require("./testAdapterDelegate");
const legacyTestAdapterWrapper_1 = require("./legacyTestAdapterWrapper");
class TestHub {
    constructor() {
        this.controllers = new Set();
        this.adapters = new Set();
        this.adapterSubscriptions = new Map();
        this.delegates = new Set();
        this.tests = new Map();
        this.legacyWrappers = new Map();
    }
    registerTestController(controller) {
        this.controllers.add(controller);
        for (const adapter of this.adapters) {
            const delegate = new testAdapterDelegate_1.TestAdapterDelegate(adapter, controller);
            this.delegates.add(delegate);
            controller.registerTestAdapter(delegate);
            delegate.testsEmitter.fire({ type: 'started' });
            if (this.tests.has(adapter)) {
                delegate.testsEmitter.fire({ type: 'finished', suite: this.tests.get(adapter) });
            }
        }
    }
    unregisterTestController(controller) {
        this.controllers.delete(controller);
        for (const delegate of this.delegates) {
            if (delegate.controller === controller) {
                controller.unregisterTestAdapter(delegate);
                delegate.dispose();
                this.delegates.delete(delegate);
            }
        }
    }
    registerTestAdapter(adapter) {
        this.adapters.add(adapter);
        for (const controller of this.controllers) {
            const delegate = new testAdapterDelegate_1.TestAdapterDelegate(adapter, controller);
            this.delegates.add(delegate);
            controller.registerTestAdapter(delegate);
        }
        this.adapterSubscriptions.set(adapter, adapter.tests(event => {
            if (event.type === 'started') {
                this.tests.delete(adapter);
            }
            else {
                this.tests.set(adapter, event.suite);
            }
            for (const delegate of this.delegates) {
                if (delegate.adapter === adapter) {
                    delegate.testsEmitter.fire(event);
                }
            }
        }));
        adapter.load();
    }
    unregisterTestAdapter(adapter) {
        this.adapters.delete(adapter);
        const subscription = this.adapterSubscriptions.get(adapter);
        if (subscription) {
            subscription.dispose();
            this.adapterSubscriptions.delete(adapter);
        }
        for (const delegate of this.delegates) {
            if (delegate.adapter === adapter) {
                delegate.controller.unregisterTestAdapter(delegate);
                delegate.dispose();
                this.delegates.delete(delegate);
            }
        }
        this.tests.delete(adapter);
    }
    registerAdapter(adapter) {
        const wrapper = new legacyTestAdapterWrapper_1.LegacyTestAdapterWrapper(adapter, this);
        this.legacyWrappers.set(adapter, wrapper);
        this.registerTestAdapter(wrapper);
    }
    unregisterAdapter(adapter) {
        const wrapper = this.legacyWrappers.get(adapter);
        if (wrapper) {
            this.unregisterTestAdapter(wrapper);
            this.legacyWrappers.delete(adapter);
        }
    }
    getTests(adapter) {
        return this.tests.get(adapter);
    }
}
exports.TestHub = TestHub;
//# sourceMappingURL=testHub.js.map