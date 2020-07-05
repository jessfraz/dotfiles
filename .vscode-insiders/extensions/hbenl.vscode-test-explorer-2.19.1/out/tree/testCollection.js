"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCollection = void 0;
const tslib_1 = require("tslib");
const vscode = require("vscode");
const testSuiteNode_1 = require("./testSuiteNode");
const testNode_1 = require("./testNode");
const errorNode_1 = require("./errorNode");
const util_1 = require("../util");
const sort_1 = require("./sort");
let TestCollection = (() => {
    class TestCollection {
        constructor(adapter, explorer) {
            this.adapter = adapter;
            this.explorer = explorer;
            this.disposables = [];
            this.allRunningTests = new Map();
            this.runningSuite = new Map();
            this.nodesById = new Map();
            this.idCount = new Map();
            this.locatedNodes = new Map();
            this.codeLenses = new Map();
            this.id = TestCollection.nextCollectionId++;
            if (this.adapter.workspaceFolder) {
                const folderPath = this.adapter.workspaceFolder.uri.fsPath;
                this.sortMementoKey = `sort ${folderPath}`;
                this.autorunMementoKey = `autorun ${folderPath}`;
            }
            let sortBy = this.getSortSetting();
            if (sortBy === undefined) {
                sortBy = this.getSortMemento();
            }
            this.sortBy = sortBy || null;
            const workspaceUri = adapter.workspaceFolder ? adapter.workspaceFolder.uri : undefined;
            this.disposables.push(vscode.workspace.onDidChangeConfiguration(configChange => {
                if (configChange.affectsConfiguration('testExplorer.codeLens', workspaceUri)) {
                    this.computeCodeLenses();
                }
                if (configChange.affectsConfiguration('testExplorer.gutterDecoration', workspaceUri) ||
                    configChange.affectsConfiguration('testExplorer.errorDecoration', workspaceUri)) {
                    this.explorer.decorator.updateAllDecorations();
                }
                if (configChange.affectsConfiguration('testExplorer.sort', workspaceUri)) {
                    let sortBy = this.getSortSetting();
                    if (sortBy === undefined) {
                        sortBy = this.getSortMemento();
                    }
                    if (sortBy !== undefined) {
                        this.setSortBy(sortBy);
                    }
                }
                if (configChange.affectsConfiguration('testExplorer.mergeSuites', workspaceUri)) {
                    this.adapter.load();
                }
            }));
            this.disposables.push(adapter.tests(testLoadEvent => this.onTestLoadEvent(testLoadEvent)));
            this.disposables.push(adapter.testStates(testRunEvent => this.onTestRunEvent(testRunEvent)));
            if (adapter.retire) {
                this.disposables.push(adapter.retire(retireEvent => {
                    if (!this.rootSuite)
                        return;
                    let nodes;
                    if (retireEvent && retireEvent.tests) {
                        nodes = retireEvent.tests.map(nodeId => this.nodesById.get(nodeId)).filter(node => node);
                    }
                    else {
                        nodes = [this.rootSuite];
                    }
                    for (const node of nodes) {
                        this.retireState(node);
                    }
                    if (!this._autorunNode)
                        return;
                    if (this._autorunNode === this.rootSuite) {
                        this.adapter.run(util_1.getAdapterIds(nodes));
                    }
                    else {
                        const nodesToRun = util_1.intersect(this._autorunNode, nodes);
                        if (nodesToRun.length > 0) {
                            this.adapter.run(util_1.getAdapterIds(nodesToRun));
                        }
                    }
                }));
            }
            this.disposables.push(vscode.workspace.onDidChangeTextDocument(changeEvent => {
                this.adjustCodeLenses(changeEvent);
                if (this.changeEventsWhileLoading) {
                    this.changeEventsWhileLoading.push(changeEvent);
                }
            }));
        }
        get suite() { return this.rootSuite; }
        get error() { return this.errorNode; }
        get autorunNode() { return this._autorunNode; }
        onTestLoadEvent(testLoadEvent) {
            if (testLoadEvent.type === 'started') {
                this.explorer.testLoadStarted(this);
                this.changeEventsWhileLoading = [];
            }
            else if (testLoadEvent.type === 'finished') {
                if (testLoadEvent.suite) {
                    this.rootSuite = new testSuiteNode_1.TestSuiteNode(this, testLoadEvent.suite, undefined, false, this.nodesById);
                    this.errorNode = undefined;
                    if (this.shouldRetireStateOnReload()) {
                        this.rootSuite.retireState();
                    }
                    else if (this.shouldResetStateOnReload()) {
                        this.rootSuite.resetState();
                    }
                    const sortCompareFn = sort_1.getCompareFn(this.sortBy || undefined);
                    if (sortCompareFn) {
                        this.sortRec(this.rootSuite, sortCompareFn);
                    }
                }
                else {
                    this.rootSuite = undefined;
                    if (testLoadEvent.errorMessage) {
                        this.errorNode = new errorNode_1.ErrorNode(this, `${this.id}:error`, testLoadEvent.errorMessage);
                    }
                    else {
                        this.errorNode = undefined;
                    }
                }
                this.collectNodesById();
                if (this._autorunNode) {
                    const newAutorunNode = this.nodesById.get(this._autorunNode.info.id);
                    this.setAutorun(newAutorunNode);
                }
                else if (this.autorunMementoKey) {
                    const autorunMemento = this.explorer.context.workspaceState.get(this.autorunMementoKey);
                    if (autorunMemento) {
                        const newAutorunNode = this.nodesById.get(autorunMemento);
                        if (newAutorunNode) {
                            this.setAutorun(newAutorunNode);
                        }
                    }
                }
                this.runningSuite.clear();
                this.computeCodeLenses();
                this.explorer.decorator.updateAllDecorations();
                this.explorer.treeEvents.sendTreeChangedEvent();
                this.explorer.testLoadFinished(this);
            }
        }
        onTestRunEvent(testRunEvent) {
            if (this.rootSuite === undefined)
                return;
            if (testRunEvent.type === 'started') {
                if (this.shouldRetireStateOnStart()) {
                    this.retireState();
                }
                else if (this.shouldResetStateOnStart()) {
                    this.resetState();
                }
                if (this.shouldShowExplorerOnRun()) {
                    vscode.commands.executeCommand('workbench.view.extension.test');
                }
                const allRunningTests = [];
                this.allRunningTests.set(testRunEvent.testRunId, allRunningTests);
                for (const nodeId of testRunEvent.tests) {
                    const node = this.nodesById.get(nodeId);
                    if (node) {
                        allRunningTests.push(...util_1.allTests(node));
                    }
                }
                for (const testNode of allRunningTests) {
                    testNode.setCurrentState('scheduled');
                }
                this.explorer.testRunStarted(this);
            }
            else if (testRunEvent.type === 'finished') {
                if (this.allRunningTests.has(testRunEvent.testRunId)) {
                    for (const testNode of this.allRunningTests.get(testRunEvent.testRunId)) {
                        if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
                            testNode.setCurrentState('pending');
                        }
                    }
                    this.allRunningTests.delete(testRunEvent.testRunId);
                }
                if (this.allRunningTests.size === 0) {
                    this.explorer.testRunFinished(this);
                }
                this.computeCodeLenses();
            }
            else if (testRunEvent.type === 'suite') {
                const suiteId = (typeof testRunEvent.suite === 'string') ? testRunEvent.suite : testRunEvent.suite.id;
                const node = this.nodesById.get(suiteId);
                let suiteNode = (node && (node.info.type === 'suite')) ? node : undefined;
                if (testRunEvent.state === 'running') {
                    if (!suiteNode && this.runningSuite.has(testRunEvent.testRunId) && (typeof testRunEvent.suite === 'object')) {
                        const runningSuite = this.runningSuite.get(testRunEvent.testRunId);
                        runningSuite.info.children.push(testRunEvent.suite);
                        suiteNode = new testSuiteNode_1.TestSuiteNode(this, testRunEvent.suite, runningSuite, false);
                        runningSuite.children.push(suiteNode);
                        runningSuite.recalcStateNeeded = true;
                        this.nodesById.set(suiteId, suiteNode);
                    }
                    if (suiteNode) {
                        suiteNode.update(undefined, testRunEvent.message, testRunEvent.description, testRunEvent.tooltip, testRunEvent.file, testRunEvent.line);
                        this.runningSuite.set(testRunEvent.testRunId, suiteNode);
                    }
                }
                else {
                    if (suiteNode) {
                        suiteNode.update(testRunEvent.state === 'errored', testRunEvent.message, testRunEvent.description, testRunEvent.tooltip, testRunEvent.file, testRunEvent.line);
                        for (const testNode of util_1.allTests(suiteNode)) {
                            if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
                                testNode.setCurrentState('pending');
                            }
                        }
                    }
                    if (this.runningSuite.has(testRunEvent.testRunId)) {
                        const runningSuite = this.runningSuite.get(testRunEvent.testRunId);
                        if (runningSuite.parent) {
                            this.runningSuite.set(testRunEvent.testRunId, runningSuite.parent);
                        }
                        else {
                            this.runningSuite.delete(testRunEvent.testRunId);
                        }
                    }
                }
            }
            else {
                const testId = (typeof testRunEvent.test === 'string') ? testRunEvent.test : testRunEvent.test.id;
                const node = this.nodesById.get(testId);
                let testNode = (node && (node.info.type === 'test')) ? node : undefined;
                if (!testNode && this.runningSuite.has(testRunEvent.testRunId) && (typeof testRunEvent.test === 'object')) {
                    const runningSuite = this.runningSuite.get(testRunEvent.testRunId);
                    runningSuite.info.children.push(testRunEvent.test);
                    testNode = new testNode_1.TestNode(this, testRunEvent.test, runningSuite);
                    runningSuite.children.push(testNode);
                    runningSuite.recalcStateNeeded = true;
                    this.nodesById.set(testId, testNode);
                }
                if (testNode) {
                    testNode.setCurrentState(testRunEvent.state, testRunEvent.message, testRunEvent.decorations, testRunEvent.description, testRunEvent.tooltip, testRunEvent.file, testRunEvent.line);
                }
            }
            this.sendNodeChangedEvents();
        }
        recalcState() {
            if (this.rootSuite) {
                this.rootSuite.recalcState();
            }
        }
        retireState(node) {
            if (node) {
                node.retireState();
                if (node.parent) {
                    node.parent.recalcStateNeeded = true;
                }
            }
            else if (this.rootSuite) {
                this.rootSuite.retireState();
            }
            this.sendNodeChangedEvents();
        }
        resetState(node) {
            if (node) {
                node.resetState();
                if (node.parent) {
                    node.parent.recalcStateNeeded = true;
                }
                else {
                    this.allRunningTests.clear();
                    this.explorer.testLoadFinished(this);
                    this.explorer.testRunFinished(this);
                }
            }
            else if (this.rootSuite) {
                this.rootSuite.resetState();
                this.allRunningTests.clear();
                this.explorer.testLoadFinished(this);
                this.explorer.testRunFinished(this);
            }
            this.sendNodeChangedEvents();
            this.computeCodeLenses();
        }
        setAutorun(node) {
            if (this._autorunNode) {
                this._autorunNode.setAutorun(false);
                if (this._autorunNode.parent) {
                    this._autorunNode.parent.recalcStateNeeded = true;
                }
                this._autorunNode = undefined;
            }
            if (this.rootSuite && node) {
                node.setAutorun(true);
                if (node.parent) {
                    node.parent.recalcStateNeeded = true;
                }
                this._autorunNode = node;
            }
            if (this.autorunMementoKey) {
                const nodeId = this._autorunNode ? this._autorunNode.info.id : undefined;
                this.explorer.context.workspaceState.update(this.autorunMementoKey, nodeId);
            }
            this.explorer.treeEvents.sendNodeChangedEvents(true);
        }
        getSortSetting() {
            let settings = this.getConfiguration().inspect('sort');
            if (!settings)
                return undefined;
            if (settings.workspaceFolderValue !== undefined) {
                return settings.workspaceFolderValue;
            }
            else if (settings.workspaceValue !== undefined) {
                return settings.workspaceValue;
            }
            else if (settings.globalValue !== undefined) {
                return settings.globalValue;
            }
            else {
                return undefined;
            }
        }
        getSortMemento() {
            if (!this.sortMementoKey)
                return undefined;
            return this.explorer.context.workspaceState.get(this.sortMementoKey);
        }
        setSortBy(sortBy, saveMemento = false) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.sortBy = sortBy;
                if (saveMemento && this.sortMementoKey) {
                    yield this.explorer.context.workspaceState.update(this.sortMementoKey, sortBy);
                }
                this.sort();
            });
        }
        sendNodeChangedEvents() {
            this.explorer.treeEvents.sendNodeChangedEvents(false);
        }
        shouldRetireStateOnStart() {
            return (this.getConfiguration().get('onStart') === 'retire');
        }
        shouldResetStateOnStart() {
            return (this.getConfiguration().get('onStart') === 'reset');
        }
        shouldRetireStateOnReload() {
            return (this.getConfiguration().get('onReload') === 'retire');
        }
        shouldResetStateOnReload() {
            return (this.getConfiguration().get('onReload') === 'reset');
        }
        shouldShowCodeLens() {
            return (this.getConfiguration().get('codeLens') !== false);
        }
        shouldShowGutterDecoration() {
            return (this.getConfiguration().get('gutterDecoration') !== false);
        }
        shouldShowErrorDecoration() {
            return (this.getConfiguration().get('errorDecoration') !== false);
        }
        shouldShowErrorDecorationHover() {
            return (this.getConfiguration().get('errorDecorationHover') !== false);
        }
        shouldShowExplorerOnRun() {
            return (this.getConfiguration().get('showOnRun') === true);
        }
        shouldMergeSuites() {
            return (this.getConfiguration().get('mergeSuites') === true);
        }
        shouldHideEmptyLog() {
            return (this.getConfiguration().get('hideEmptyLog') !== false);
        }
        computeCodeLenses() {
            this.codeLenses.clear();
            this.locatedNodes.clear();
            if (this.rootSuite !== undefined) {
                this.collectLocatedNodes(this.rootSuite);
                if (this.shouldShowCodeLens()) {
                    for (const [file, fileLocatedNodes] of this.locatedNodes) {
                        const fileCodeLenses = [];
                        for (const [line, lineLocatedNodes] of fileLocatedNodes) {
                            fileCodeLenses.push(util_1.createRunCodeLens(line, lineLocatedNodes));
                            if (this.adapter.debug &&
                                lineLocatedNodes.some(node => (node.info.debuggable !== false))) {
                                fileCodeLenses.push(util_1.createDebugCodeLens(line, lineLocatedNodes));
                            }
                            if (lineLocatedNodes.some(node => (node.log !== undefined) && (node.log.length > 0))) {
                                fileCodeLenses.push(util_1.createLogCodeLens(line, lineLocatedNodes));
                            }
                            const firstNode = lineLocatedNodes[0];
                            if (!(firstNode instanceof testSuiteNode_1.TestSuiteNode) || !firstNode.isHidden) {
                                fileCodeLenses.push(util_1.createRevealCodeLens(line, firstNode));
                            }
                        }
                        this.codeLenses.set(file, fileCodeLenses);
                    }
                }
            }
            if (this.changeEventsWhileLoading) {
                for (const changeEvent of this.changeEventsWhileLoading) {
                    this.adjustCodeLenses(changeEvent);
                }
                this.changeEventsWhileLoading = undefined;
            }
            this.explorer.codeLensesChanged.fire();
        }
        adjustCodeLenses(changeEvent) {
            const documentCodeLenses = this.codeLenses.get(changeEvent.document.uri.toString());
            if (!documentCodeLenses)
                return;
            for (const change of changeEvent.contentChanges) {
                const startLine = change.range.start.line;
                const endLine = change.range.end.line;
                const replacedByLines = change.text.split('\n').length - 1;
                if ((startLine === endLine) && (replacedByLines === 0))
                    continue;
                for (let i = documentCodeLenses.length - 1; i >= 0; i--) {
                    const codeLens = documentCodeLenses[i];
                    const oldCodeLensLine = codeLens.range.start.line;
                    let newCodeLensLine;
                    if (oldCodeLensLine >= startLine) {
                        if (oldCodeLensLine <= endLine) {
                            newCodeLensLine = startLine;
                        }
                        else {
                            newCodeLensLine = oldCodeLensLine - (endLine - startLine) + replacedByLines;
                        }
                        codeLens.range = new vscode.Range(newCodeLensLine, 0, newCodeLensLine, 0);
                    }
                }
            }
        }
        getCodeLenses(fileUri) {
            return this.codeLenses.get(fileUri) || [];
        }
        getLocatedNodes(fileUri) {
            return this.locatedNodes.get(fileUri);
        }
        getHover(document, position) {
            if (!this.shouldShowErrorDecorationHover())
                return undefined;
            const nodes = this.getLocatedNodes(document.uri.toString());
            if (!nodes)
                return undefined;
            for (const lineNodes of nodes.values()) {
                for (const node of lineNodes) {
                    if (node instanceof testNode_1.TestNode) {
                        for (const decoration of node.decorations) {
                            if ((position.line === decoration.line) &&
                                (position.character === document.lineAt(decoration.line).range.end.character)) {
                                const hoverText = decoration.hover || node.log;
                                if (!hoverText)
                                    continue;
                                const hoverMarkdown = '    ' + hoverText.replace(/\n/g, '\n    ');
                                return new vscode.Hover(new vscode.MarkdownString(hoverMarkdown));
                            }
                        }
                    }
                }
            }
            return undefined;
        }
        findNodesById(ids) {
            const nodes = [];
            for (const id of ids) {
                const node = this.nodesById.get(id);
                if (node) {
                    nodes.push(node);
                }
            }
            return nodes;
        }
        dispose() {
            for (const disposable of this.disposables) {
                disposable.dispose();
            }
            this.disposables = [];
        }
        getConfiguration() {
            const workspaceFolder = this.adapter.workspaceFolder;
            var workspaceUri = workspaceFolder ? workspaceFolder.uri : null;
            return vscode.workspace.getConfiguration('testExplorer', workspaceUri);
        }
        sort() {
            if (!this.rootSuite)
                return;
            let compareFn = sort_1.getCompareFn(this.sortBy);
            this.sortRec(this.rootSuite, compareFn);
            this.explorer.treeEvents.sendTreeChangedEvent();
        }
        sortRec(suite, compareFn) {
            suite.children.sort(compareFn);
            for (const child of suite.children) {
                if (child instanceof testSuiteNode_1.TestSuiteNode) {
                    this.sortRec(child, compareFn);
                }
            }
        }
        collectNodesById() {
            this.nodesById.clear();
            this.idCount.clear();
            if (this.rootSuite !== undefined) {
                this.collectNodesByIdRec(this.rootSuite);
            }
        }
        collectNodesByIdRec(node) {
            if (!this.idCount.get(node.info.id)) {
                node.uniqueId = `${this.id}:${node.info.id}_1`;
                this.nodesById.set(node.info.id, node);
                this.idCount.set(node.info.id, 1);
            }
            else {
                const count = this.idCount.get(node.info.id) + 1;
                node.uniqueId = `${this.id}:${node.info.id}_${count}`;
                this.idCount.set(node.info.id, count);
                const errorMessage = 'There are multiple tests with the same ID, Test Explorer will not be able to show test results for these tests.';
                const errorDescription = '*** duplicate ID ***';
                if (node instanceof testNode_1.TestNode) {
                    node.setCurrentState('duplicate', errorMessage, undefined, errorDescription, errorMessage);
                }
                const otherNode = this.nodesById.get(node.info.id);
                if (otherNode) {
                    this.nodesById.delete(node.info.id);
                    if (otherNode instanceof testNode_1.TestNode) {
                        otherNode.setCurrentState('duplicate', errorMessage, undefined, errorDescription, errorMessage);
                    }
                }
            }
            for (const child of node.children) {
                this.collectNodesByIdRec(child);
            }
        }
        collectLocatedNodes(node) {
            this.addLocatedNode(node);
            for (const child of node.children) {
                if (child.info.type === 'test') {
                    this.addLocatedNode(child);
                }
                else {
                    this.collectLocatedNodes(child);
                }
            }
        }
        addLocatedNode(node) {
            if ((node.fileUri === undefined) || (node.line === undefined))
                return;
            let fileLocatedNodes = this.locatedNodes.get(node.fileUri);
            if (!fileLocatedNodes) {
                fileLocatedNodes = new Map();
                this.locatedNodes.set(node.fileUri, fileLocatedNodes);
            }
            let lineLocatedNodes = fileLocatedNodes.get(node.line);
            if (!lineLocatedNodes) {
                lineLocatedNodes = [];
                fileLocatedNodes.set(node.line, lineLocatedNodes);
            }
            lineLocatedNodes.push(node);
        }
    }
    TestCollection.nextCollectionId = 1;
    return TestCollection;
})();
exports.TestCollection = TestCollection;
//# sourceMappingURL=testCollection.js.map