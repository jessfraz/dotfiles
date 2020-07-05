"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeEventDebouncer = void 0;
const testSuiteNode_1 = require("./tree/testSuiteNode");
class TreeEventDebouncer {
    constructor(collections, treeDataChanged) {
        this.collections = collections;
        this.treeDataChanged = treeDataChanged;
    }
    sendNodeChangedEvents(immediately) {
        if (immediately) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
            this.sendNodeChangedEventsNow();
        }
        else if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.sendNodeChangedEventsNow();
            }, 200);
        }
    }
    sendTreeChangedEvent() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        this.treeDataChanged.fire();
    }
    sendNodeChangedEventsNow() {
        const changedNodes = [];
        for (const collection of this.collections.values()) {
            if (collection.suite) {
                collection.recalcState();
                changedNodes.push(...this.collectChangedNodes(collection.suite));
            }
        }
        for (const node of changedNodes) {
            if (node.parent === undefined) {
                this.treeDataChanged.fire();
            }
            else {
                this.treeDataChanged.fire(node);
            }
        }
    }
    collectChangedNodes(node) {
        if (node.sendStateNeeded) {
            this.resetNeededUpdates(node);
            if ((node instanceof testSuiteNode_1.TestSuiteNode) && node.isHidden) {
                return [node.parent];
            }
            else {
                return [node];
            }
        }
        else {
            const nodesToSend = [];
            for (const child of node.children) {
                nodesToSend.push(...this.collectChangedNodes(child));
            }
            return nodesToSend;
        }
    }
    resetNeededUpdates(node) {
        node.sendStateNeeded = false;
        for (const child of node.children) {
            this.resetNeededUpdates(child);
        }
    }
}
exports.TreeEventDebouncer = TreeEventDebouncer;
//# sourceMappingURL=treeEventDebouncer.js.map