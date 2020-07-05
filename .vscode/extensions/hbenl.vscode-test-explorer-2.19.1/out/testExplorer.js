"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestExplorer = void 0;
const tslib_1 = require("tslib");
const vscode = require("vscode");
const testCollection_1 = require("./tree/testCollection");
const iconPaths_1 = require("./iconPaths");
const treeEventDebouncer_1 = require("./treeEventDebouncer");
const decorator_1 = require("./decorator");
const util_1 = require("./util");
const testNode_1 = require("./tree/testNode");
const testSuiteNode_1 = require("./tree/testSuiteNode");
class TestExplorer {
    constructor(context) {
        this.context = context;
        this.treeDataChanged = new vscode.EventEmitter();
        this.codeLensesChanged = new vscode.EventEmitter();
        this.collections = new Map();
        this.loadingCollections = new Set();
        this.runningCollections = new Set();
        this.iconPaths = new iconPaths_1.IconPaths(context);
        this.decorator = new decorator_1.Decorator(context, this);
        this.treeEvents = new treeEventDebouncer_1.TreeEventDebouncer(this.collections, this.treeDataChanged);
        this.outputChannel = vscode.window.createOutputChannel("Test Explorer");
        context.subscriptions.push(this.outputChannel);
        this.onDidChangeTreeData = this.treeDataChanged.event;
        this.onDidChangeCodeLenses = this.codeLensesChanged.event;
    }
    registerTestAdapter(adapter) {
        this.collections.set(adapter, new testCollection_1.TestCollection(adapter, this));
        this.updateVisibility();
    }
    unregisterTestAdapter(adapter) {
        const collection = this.collections.get(adapter);
        if (collection) {
            collection.dispose();
            this.collections.delete(adapter);
            this.updateVisibility();
        }
    }
    getTreeItem(node) {
        return node.getTreeItem();
    }
    getChildren(node) {
        if (node) {
            if ((node instanceof testSuiteNode_1.TestSuiteNode) && node.isMergedNode) {
                return [].concat(...node.children.map(child => child.children));
            }
            return node.children;
        }
        else {
            const nonEmptyCollections = [...this.collections.values()].filter((collection) => ((collection.suite !== undefined) || (collection.error !== undefined)));
            if (nonEmptyCollections.length === 0) {
                return [];
            }
            else if (nonEmptyCollections.length === 1) {
                const collection = nonEmptyCollections[0];
                if (collection.suite) {
                    return collection.suite.children;
                }
                else {
                    return [collection.error];
                }
            }
            else {
                return nonEmptyCollections.map(collection => (collection.suite || collection.error));
            }
        }
    }
    getParent(node) {
        return node.parent;
    }
    reload(node) {
        if (node) {
            node.collection.adapter.load();
        }
        else {
            for (const adapter of this.collections.keys()) {
                try {
                    adapter.load();
                }
                catch (err) { }
            }
        }
    }
    run(nodes, pick = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.lastTestRun = undefined;
            if (nodes) {
                const nodesToRun = pick ? yield util_1.pickNodes(nodes) : nodes;
                if (nodesToRun.length > 0) {
                    this.lastTestRun = [nodesToRun[0].collection, util_1.getAdapterIds(nodesToRun)];
                    nodesToRun[0].collection.adapter.run(util_1.getAdapterIds(nodesToRun));
                }
            }
            else {
                for (const collection of this.collections.values()) {
                    if (collection.suite) {
                        try {
                            collection.adapter.run(collection.suite.adapterIds);
                        }
                        catch (err) { }
                    }
                }
            }
        });
    }
    rerun() {
        if (this.lastTestRun) {
            const collection = this.lastTestRun[0];
            const testIds = this.lastTestRun[1];
            return collection.adapter.run(testIds);
        }
        return Promise.resolve();
    }
    debug(nodes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.lastTestRun = undefined;
            const nodesToRun = yield util_1.pickNodes(nodes);
            if ((nodesToRun.length > 0) && nodesToRun[0].collection.adapter.debug) {
                try {
                    this.lastTestRun = [nodesToRun[0].collection, util_1.getAdapterIds(nodesToRun)];
                    yield nodesToRun[0].collection.adapter.debug(util_1.getAdapterIds(nodesToRun));
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error while debugging test: ${e}`);
                    return;
                }
            }
        });
    }
    redebug() {
        if (this.lastTestRun) {
            const collection = this.lastTestRun[0];
            const testIds = this.lastTestRun[1];
            return collection.adapter.debug(testIds);
        }
        return Promise.resolve();
    }
    cancel() {
        for (const adapter of this.collections.keys()) {
            try {
                adapter.cancel();
            }
            catch (err) { }
        }
        ;
    }
    showLog(nodes) {
        if (nodes.length > 0) {
            this.nodesShownInOutputChannel = {
                collection: nodes[0].collection,
                ids: nodes.map(node => node.info.id)
            };
        }
        else {
            this.nodesShownInOutputChannel = undefined;
        }
        this.updateLog();
    }
    showError(message) {
        this.outputChannel.clear();
        this.nodesShownInOutputChannel = undefined;
        if (message) {
            this.outputChannel.append(message);
            this.outputChannel.show(true);
        }
        else {
            this.outputChannel.hide();
        }
    }
    showSource(node) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const fileUri = node.fileUri;
            if (fileUri) {
                const document = yield vscode.workspace.openTextDocument(vscode.Uri.parse(fileUri));
                let line = node.line;
                if (line === undefined) {
                    line = util_1.findLineContaining(node.info.label, document.getText());
                }
                const options = (line !== undefined) ? { selection: new vscode.Range(line, 0, line, 0) } : undefined;
                yield vscode.window.showTextDocument(document, options);
            }
        });
    }
    setAutorun(node) {
        if ((node instanceof testNode_1.TestNode) || (node instanceof testSuiteNode_1.TestSuiteNode)) {
            node.collection.setAutorun(node);
        }
        else {
            for (const collection of this.collections.values()) {
                collection.setAutorun(collection.suite);
            }
        }
    }
    clearAutorun(node) {
        if ((node instanceof testNode_1.TestNode) || (node instanceof testSuiteNode_1.TestSuiteNode)) {
            node.collection.setAutorun(undefined);
        }
        else {
            for (const collection of this.collections.values()) {
                collection.setAutorun(undefined);
            }
        }
    }
    retireState(node) {
        if ((node instanceof testNode_1.TestNode) || (node instanceof testSuiteNode_1.TestSuiteNode)) {
            node.collection.retireState(node);
        }
        else {
            for (const collection of this.collections.values()) {
                collection.retireState();
            }
        }
    }
    resetState(node) {
        if ((node instanceof testNode_1.TestNode) || (node instanceof testSuiteNode_1.TestSuiteNode)) {
            node.collection.resetState(node);
        }
        else {
            for (const collection of this.collections.values()) {
                collection.resetState();
            }
        }
    }
    provideCodeLenses(document, token) {
        const fileUri = document.uri.toString();
        let codeLenses = [];
        for (const collection of this.collections.values()) {
            codeLenses = codeLenses.concat(collection.getCodeLenses(fileUri));
        }
        return codeLenses;
    }
    provideHover(document, position) {
        for (const collection of this.collections.values()) {
            var hover = collection.getHover(document, position);
            if (hover) {
                return hover;
            }
        }
        return undefined;
    }
    setSortBy(sortBy) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const collection of this.collections.values()) {
                yield collection.setSortBy(sortBy, true);
            }
        });
    }
    reveal(node, treeView) {
        if (typeof node === 'string') {
            for (const collection of this.collections.values()) {
                const nodes = collection.findNodesById([node]);
                if (nodes.length > 0) {
                    treeView.reveal(nodes[0]);
                    return;
                }
            }
        }
        else {
            treeView.reveal(node);
        }
    }
    testLoadStarted(collection) {
        this.loadingCollections.add(collection);
        vscode.commands.executeCommand('setContext', 'testsLoading', true);
    }
    testLoadFinished(collection) {
        this.loadingCollections.delete(collection);
        if (this.loadingCollections.size === 0) {
            vscode.commands.executeCommand('setContext', 'testsLoading', false);
        }
        this.updateVisibility();
    }
    testRunStarted(collection) {
        this.runningCollections.add(collection);
        vscode.commands.executeCommand('setContext', 'testsRunning', true);
    }
    testRunFinished(collection) {
        this.runningCollections.delete(collection);
        if (this.runningCollections.size === 0) {
            vscode.commands.executeCommand('setContext', 'testsRunning', false);
        }
    }
    logChanged(node) {
        if (this.nodesShownInOutputChannel &&
            (this.nodesShownInOutputChannel.collection === node.collection) &&
            this.nodesShownInOutputChannel.ids.includes(node.info.id)) {
            this.updateLog();
        }
    }
    updateVisibility() {
        let visible = true;
        if (this.hideWhen === 'noAdapters') {
            visible = (this.collections.size > 0);
        }
        else if (this.hideWhen === 'noTests') {
            visible = [...this.collections.values()].some(collection => ((collection.suite !== undefined) || (collection.error !== undefined)));
        }
        vscode.commands.executeCommand('setContext', 'testExplorerVisible', visible);
    }
    updateLog() {
        this.outputChannel.clear();
        let logIsEmpty = true;
        if (this.nodesShownInOutputChannel) {
            const nodes = this.nodesShownInOutputChannel.collection.findNodesById(this.nodesShownInOutputChannel.ids);
            for (const node of nodes) {
                if (node.log) {
                    this.outputChannel.append(node.log);
                    logIsEmpty = false;
                }
            }
        }
        if (logIsEmpty) {
            if (this.nodesShownInOutputChannel &&
                this.nodesShownInOutputChannel.collection.shouldHideEmptyLog()) {
                this.outputChannel.hide();
            }
        }
        else {
            this.outputChannel.show(true);
        }
    }
}
exports.TestExplorer = TestExplorer;
//# sourceMappingURL=testExplorer.js.map