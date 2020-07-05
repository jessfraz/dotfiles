"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdapterIds = exports.mergeSuiteInfos = exports.groupSuitesByLabel = exports.expand = exports.normalizeFilename = exports.createRevealCodeLens = exports.createLogCodeLens = exports.createDebugCodeLens = exports.createRunCodeLens = exports.pickNodes = exports.findLineContaining = exports.debugTestAtCursor = exports.runTestAtCursor = exports.runTestsInFile = exports.intersect = exports.isAncestor = exports.allTests = void 0;
const tslib_1 = require("tslib");
const vscode = require("vscode");
const RegExpEscape = require("escape-string-regexp");
function* allTests(treeNode) {
    if (treeNode.info.type === 'suite') {
        for (const child of treeNode.children) {
            yield* allTests(child);
        }
    }
    else {
        yield treeNode;
    }
}
exports.allTests = allTests;
function isAncestor(node, otherNode) {
    return !!otherNode && ((node === otherNode) || isAncestor(node, otherNode.parent));
}
exports.isAncestor = isAncestor;
function intersect(mainNode, nodes) {
    for (const node of nodes) {
        if (isAncestor(node, mainNode)) {
            return [mainNode];
        }
    }
    return nodes.filter(node => isAncestor(mainNode, node));
}
exports.intersect = intersect;
function runTestsInFile(fileUri, testExplorer) {
    if (!fileUri && vscode.window.activeTextEditor) {
        fileUri = vscode.window.activeTextEditor.document.uri.toString();
    }
    if (fileUri) {
        for (const collection of testExplorer.collections.values()) {
            if (collection.suite) {
                const found = findFileNodes(fileUri, collection.suite);
                if (found.length > 0) {
                    testExplorer.run(found, false);
                    return;
                }
            }
        }
    }
}
exports.runTestsInFile = runTestsInFile;
function findFileNodes(fileUri, searchNode) {
    if (searchNode.fileUri) {
        if (searchNode.fileUri === fileUri) {
            return [searchNode];
        }
        else {
            return [];
        }
    }
    else {
        return [].concat(...searchNode.children.map(childNode => findFileNodes(fileUri, childNode)));
    }
}
function runTestAtCursor(testExplorer) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const nodes = findNodesLocatedAboveCursor(editor.document.uri.toString(), editor.selection.active.line, testExplorer);
        if (nodes.length > 0) {
            testExplorer.run(nodes);
        }
    }
}
exports.runTestAtCursor = runTestAtCursor;
function debugTestAtCursor(testExplorer) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const nodes = findNodesLocatedAboveCursor(editor.document.uri.toString(), editor.selection.active.line, testExplorer);
        if (nodes.length > 0) {
            testExplorer.debug(nodes);
        }
    }
}
exports.debugTestAtCursor = debugTestAtCursor;
function findNodesLocatedAboveCursor(fileUri, cursorLine, testExplorer) {
    let currentLine = -1;
    let currentNodes = [];
    for (const collection of testExplorer.collections.values()) {
        const locatedNodes = collection.getLocatedNodes(fileUri);
        if (locatedNodes) {
            for (const line of locatedNodes.keys()) {
                if ((line > cursorLine) || (line < currentLine))
                    continue;
                const lineNodes = locatedNodes.get(line);
                if (line === currentLine) {
                    currentNodes.push(...lineNodes);
                }
                else {
                    currentLine = line;
                    currentNodes = [...lineNodes];
                }
            }
        }
    }
    return currentNodes;
}
function findLineContaining(needle, haystack) {
    if (!haystack)
        return undefined;
    const index = haystack.search(RegExpEscape(needle));
    if (index < 0)
        return undefined;
    return haystack.substr(0, index).split('\n').length - 1;
}
exports.findLineContaining = findLineContaining;
function pickNodes(nodes) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (nodes.length > 1) {
            const labels = nodes.map(node => node.getFullLabel());
            labels.push("All of them");
            const pickedLabel = yield vscode.window.showQuickPick(labels);
            if (pickedLabel === "All of them") {
                return nodes;
            }
            else {
                return nodes.filter(node => (node.getFullLabel() === pickedLabel));
            }
        }
        else {
            return nodes;
        }
    });
}
exports.pickNodes = pickNodes;
function createRunCodeLens(line, nodes) {
    const range = new vscode.Range(line, 0, line, 0);
    return new vscode.CodeLens(range, {
        title: 'Run',
        command: 'test-explorer.pick-and-run',
        arguments: [nodes]
    });
}
exports.createRunCodeLens = createRunCodeLens;
function createDebugCodeLens(line, nodes) {
    const range = new vscode.Range(line, 0, line, 0);
    return new vscode.CodeLens(range, {
        title: 'Debug',
        command: 'test-explorer.pick-and-debug',
        arguments: [nodes]
    });
}
exports.createDebugCodeLens = createDebugCodeLens;
function createLogCodeLens(line, nodes) {
    const range = new vscode.Range(line, 0, line, 0);
    return new vscode.CodeLens(range, {
        title: 'Show Log',
        command: 'test-explorer.show-log',
        arguments: [nodes]
    });
}
exports.createLogCodeLens = createLogCodeLens;
function createRevealCodeLens(line, node) {
    const range = new vscode.Range(line, 0, line, 0);
    return new vscode.CodeLens(range, {
        title: 'Show in Test Explorer',
        command: 'test-explorer.reveal',
        arguments: [node]
    });
}
exports.createRevealCodeLens = createRevealCodeLens;
const schemeMatcher = /^[a-z][a-z0-9+-.]+:/;
function normalizeFilename(file) {
    if (file === undefined)
        return undefined;
    if (schemeMatcher.test(file)) {
        return vscode.Uri.parse(file).toString();
    }
    else {
        return vscode.Uri.file(file).toString();
    }
}
exports.normalizeFilename = normalizeFilename;
function expand(testExplorer, treeView, levels) {
    for (const node of testExplorer.getChildren()) {
        treeView.reveal(node, { expand: levels });
    }
}
exports.expand = expand;
function groupSuitesByLabel(nodes) {
    const grouped = new Map();
    let testCount = 0;
    for (const node of nodes) {
        if (node.type === 'test') {
            const key = `t${testCount++}`;
            grouped.set(key, node);
        }
        else {
            const key = `s${node.label}`;
            if (!grouped.has(key)) {
                grouped.set(key, [node]);
            }
            else {
                grouped.get(key).push(node);
            }
        }
    }
    return [...grouped.values()];
}
exports.groupSuitesByLabel = groupSuitesByLabel;
function mergeSuiteInfos(suites) {
    if (suites.length === 1) {
        return suites[0];
    }
    else {
        return {
            type: 'suite',
            id: JSON.stringify(suites.map(suite => suite.id).sort()),
            label: suites[0].label,
            children: [].concat(...suites.map(suite => suite.children))
        };
    }
}
exports.mergeSuiteInfos = mergeSuiteInfos;
function getAdapterIds(nodes) {
    return [].concat(...nodes.map(node => node.adapterIds));
}
exports.getAdapterIds = getAdapterIds;
//# sourceMappingURL=util.js.map