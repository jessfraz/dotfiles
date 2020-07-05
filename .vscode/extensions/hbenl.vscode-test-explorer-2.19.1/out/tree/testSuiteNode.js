"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSuiteNode = void 0;
const vscode = require("vscode");
const state_1 = require("./state");
const testNode_1 = require("./testNode");
const util_1 = require("../util");
class TestSuiteNode {
    constructor(collection, info, parent, isMergedNode, oldNodesById) {
        this.collection = collection;
        this.info = info;
        this.parent = parent;
        this.isMergedNode = isMergedNode;
        this.description = info.description;
        this.tooltip = info.tooltip;
        this._file = info.file;
        this._line = info.line;
        this._fileUri = util_1.normalizeFilename(this.file);
        this._log = info.message || "";
        if (!this.collection.shouldMergeSuites()) {
            this._children = info.children.map(childInfo => {
                if (childInfo.type === 'test') {
                    return new testNode_1.TestNode(collection, childInfo, this, oldNodesById);
                }
                else {
                    return new TestSuiteNode(collection, childInfo, this, false, oldNodesById);
                }
            });
        }
        else {
            this._children = util_1.groupSuitesByLabel(info.children).map(childInfos => {
                if (!Array.isArray(childInfos)) {
                    return new testNode_1.TestNode(collection, childInfos, this, oldNodesById);
                }
                else {
                    if (childInfos.length === 1) {
                        return new TestSuiteNode(collection, childInfos[0], this, false, oldNodesById);
                    }
                    else {
                        const mergedSuite = new TestSuiteNode(collection, util_1.mergeSuiteInfos(childInfos), this, true, oldNodesById);
                        mergedSuite._children = childInfos.map(childInfo => new TestSuiteNode(collection, childInfo, mergedSuite, false, oldNodesById));
                        return mergedSuite;
                    }
                }
            });
        }
        this._state = state_1.parentNodeState(this._children);
        if (info.errored) {
            this._state.current = 'errored';
            this._state.previous = 'errored';
        }
    }
    get fileUri() { return this._fileUri; }
    get state() { return this._state; }
    get log() { return this._log; }
    get children() { return this._children; }
    get file() { return this._file; }
    get line() { return this._line; }
    get adapterIds() {
        if (this.isMergedNode) {
            return util_1.getAdapterIds(this._children);
        }
        else {
            return [this.info.id];
        }
    }
    get isHidden() { return (this.parent !== undefined) && this.parent.isMergedNode; }
    update(errored, message, description, tooltip, file, line) {
        if ((errored !== undefined) && (errored !== (this._state.current === 'errored'))) {
            this._state.current = errored ? 'errored' : 'pending';
            this._state.previous = errored ? 'errored' : 'pending';
            this.recalcStateNeeded = true;
        }
        if (message !== undefined) {
            this._log = message;
            this.sendStateNeeded = true;
        }
        if ((description !== undefined) && (description !== this.description)) {
            this.description = description;
            this.sendStateNeeded = true;
        }
        if ((tooltip !== undefined) && (tooltip !== this.tooltip)) {
            this.tooltip = tooltip;
            this.sendStateNeeded = true;
        }
        if (file !== undefined) {
            this._file = file;
            this._fileUri = util_1.normalizeFilename(this.file);
        }
        if (line !== undefined) {
            this._line = line;
        }
    }
    recalcState() {
        for (const child of this.children) {
            if (child instanceof TestSuiteNode) {
                child.recalcState();
            }
        }
        if (this.recalcStateNeeded) {
            const newCurrentNodeState = (this._state.current === 'errored') ? 'errored' : state_1.parentCurrentNodeState(this.children);
            const newPreviousNodeState = (this._state.previous === 'errored') ? 'errored' : state_1.parentPreviousNodeState(this.children);
            const newAutorunFlag = state_1.parentAutorunFlag(this.children);
            if ((this.state.current !== newCurrentNodeState) ||
                (this.state.previous !== newPreviousNodeState) ||
                (this.state.autorun !== newAutorunFlag)) {
                this.state.current = newCurrentNodeState;
                this.state.previous = newPreviousNodeState;
                this.state.autorun = newAutorunFlag;
                this.sendStateNeeded = true;
                if (this.parent) {
                    this.parent.recalcStateNeeded = true;
                }
                if (this.fileUri) {
                    this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
                }
            }
            this.recalcStateNeeded = false;
        }
    }
    retireState() {
        for (const child of this._children) {
            child.retireState();
        }
        this.recalcStateNeeded = true;
        if ((this._state.current === 'errored') && !this.info.errored) {
            this._state.current = 'pending';
            this.sendStateNeeded = true;
        }
    }
    resetState() {
        if ((this.description !== this.info.description) || (this.tooltip !== this.info.tooltip)) {
            this._state.current = this.info.errored ? 'errored' : 'pending';
            this._state.previous = this.info.errored ? 'errored' : 'pending';
            this._log = this.info.message || "";
            this.description = this.info.description;
            this.tooltip = this.info.tooltip;
            this._file = this.info.file;
            this._line = this.info.line;
            this._fileUri = util_1.normalizeFilename(this.file);
            this.sendStateNeeded = true;
        }
        for (const child of this._children) {
            child.resetState();
        }
        this.recalcStateNeeded = true;
    }
    setAutorun(autorun) {
        for (const child of this._children) {
            child.setAutorun(autorun);
        }
        this.recalcStateNeeded = true;
    }
    getTreeItem() {
        if (this.recalcStateNeeded) {
            this.recalcState();
        }
        this.sendStateNeeded = false;
        let label = this.info.label;
        if ((this.parent === undefined) && this.collection.adapter.workspaceFolder &&
            vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
            label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
        }
        const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.id = this.uniqueId;
        treeItem.iconPath = this.collection.explorer.iconPaths[state_1.stateIcon(this.state)];
        treeItem.contextValue =
            this.parent ?
                (((this.collection.adapter.debug && (this.info.debuggable !== false)) ?
                    (this.fileUri ? 'debuggableSuiteWithSource' : 'debuggableSuite') :
                    (this.fileUri ? 'suiteWithSource' : 'suite'))) :
                'collection';
        treeItem.command = {
            title: '',
            command: 'test-explorer.show-log',
            arguments: [[this]]
        };
        treeItem.description = this.description;
        treeItem.tooltip = this.tooltip;
        return treeItem;
    }
    getFullLabel() {
        return this.parent ? `${this.parent.getFullLabel()} ${this.info.label}` : this.info.label;
    }
}
exports.TestSuiteNode = TestSuiteNode;
//# sourceMappingURL=testSuiteNode.js.map