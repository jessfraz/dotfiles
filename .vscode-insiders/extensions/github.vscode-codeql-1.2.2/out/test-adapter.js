"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_test_adapter_util_1 = require("vscode-test-adapter-util");
const qltest_discovery_1 = require("./qltest-discovery");
const vscode_1 = require("vscode");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const qlpack_discovery_1 = require("./qlpack-discovery");
const helpers_1 = require("./helpers");
const logging_1 = require("./logging");
/**
 * Get the full path of the `.expected` file for the specified QL test.
 * @param testPath The full path to the test file.
 */
function getExpectedFile(testPath) {
    return getTestOutputFile(testPath, '.expected');
}
exports.getExpectedFile = getExpectedFile;
/**
 * Get the full path of the `.actual` file for the specified QL test.
 * @param testPath The full path to the test file.
 */
function getActualFile(testPath) {
    return getTestOutputFile(testPath, '.actual');
}
exports.getActualFile = getActualFile;
/**
 * Get the directory containing the specified QL test.
 * @param testPath The full path to the test file.
 */
function getTestDirectory(testPath) {
    return path.dirname(testPath);
}
exports.getTestDirectory = getTestDirectory;
/**
 * Gets the the full path to a particular output file of the specified QL test.
 * @param testPath The full path to the QL test.
 * @param extension The file extension of the output file.
 */
function getTestOutputFile(testPath, extension) {
    return changeExtension(testPath, extension);
}
/**
 * A factory service that creates `QLTestAdapter` objects for workspace folders on demand.
 */
class QLTestAdapterFactory extends semmle_vscode_utils_1.DisposableObject {
    constructor(testHub, cliServer) {
        super();
        // this will register a QLTestAdapter for each WorkspaceFolder
        this.push(new vscode_test_adapter_util_1.TestAdapterRegistrar(testHub, workspaceFolder => new QLTestAdapter(workspaceFolder, cliServer)));
    }
}
exports.QLTestAdapterFactory = QLTestAdapterFactory;
/**
 * Change the file extension of the specified path.
 * @param p The original file path.
 * @param ext The new extension, including the `.`.
 */
function changeExtension(p, ext) {
    return p.substr(0, p.length - path.extname(p).length) + ext;
}
/**
 * Test adapter for QL tests.
 */
class QLTestAdapter extends semmle_vscode_utils_1.DisposableObject {
    constructor(workspaceFolder, cliServer) {
        super();
        this.workspaceFolder = workspaceFolder;
        this.cliServer = cliServer;
        this._tests = this.push(new vscode_1.EventEmitter());
        this._testStates = this.push(new vscode_1.EventEmitter());
        this._autorun = this.push(new vscode_1.EventEmitter());
        this.runningTask = undefined;
        this.qlPackDiscovery = this.push(new qlpack_discovery_1.QLPackDiscovery(workspaceFolder, cliServer));
        this.qlTestDiscovery = this.push(new qltest_discovery_1.QLTestDiscovery(this.qlPackDiscovery, cliServer));
        this.push(this.qlTestDiscovery.onDidChangeTests(this.discoverTests, this));
    }
    get tests() {
        return this._tests.event;
    }
    get testStates() {
        return this._testStates.event;
    }
    get autorun() {
        return this._autorun.event;
    }
    static createTestOrSuiteInfos(testNodes) {
        return testNodes.map((childNode) => {
            return QLTestAdapter.createTestOrSuiteInfo(childNode);
        });
    }
    static createTestOrSuiteInfo(testNode) {
        if (testNode instanceof qltest_discovery_1.QLTestFile) {
            return QLTestAdapter.createTestInfo(testNode);
        }
        else if (testNode instanceof qltest_discovery_1.QLTestDirectory) {
            return QLTestAdapter.createTestSuiteInfo(testNode, testNode.name);
        }
        else {
            throw new Error('Unexpected test type.');
        }
    }
    static createTestInfo(testFile) {
        return {
            type: 'test',
            id: testFile.path,
            label: testFile.name,
            tooltip: testFile.path,
            file: testFile.path
        };
    }
    static createTestSuiteInfo(testDirectory, label) {
        return {
            type: 'suite',
            id: testDirectory.path,
            label: label,
            children: QLTestAdapter.createTestOrSuiteInfos(testDirectory.children),
            tooltip: testDirectory.path
        };
    }
    async load() {
        this.discoverTests();
    }
    discoverTests() {
        this._tests.fire({ type: 'started' });
        const testDirectories = this.qlTestDiscovery.testDirectories;
        const children = testDirectories.map(testDirectory => QLTestAdapter.createTestSuiteInfo(testDirectory, testDirectory.name));
        const testSuite = {
            type: 'suite',
            label: 'CodeQL',
            id: '.',
            children
        };
        this._tests.fire({
            type: 'finished',
            suite: children.length > 0 ? testSuite : undefined
        });
    }
    async run(tests) {
        if (this.runningTask !== undefined) {
            throw new Error('Tests already running.');
        }
        logging_1.testLogger.outputChannel.clear();
        logging_1.testLogger.outputChannel.show(true);
        this.runningTask = this.track(new vscode_1.CancellationTokenSource());
        this._testStates.fire({ type: 'started', tests: tests });
        try {
            await this.runTests(tests, this.runningTask.token);
        }
        catch (e) {
            /**/
        }
        this._testStates.fire({ type: 'finished' });
        this.clearTask();
    }
    clearTask() {
        if (this.runningTask !== undefined) {
            const runningTask = this.runningTask;
            this.runningTask = undefined;
            this.disposeAndStopTracking(runningTask);
        }
    }
    cancel() {
        if (this.runningTask !== undefined) {
            logging_1.testLogger.log('Cancelling test run...');
            this.runningTask.cancel();
            this.clearTask();
        }
    }
    async runTests(tests, cancellationToken) {
        var e_1, _a;
        const workspacePaths = await helpers_1.getOnDiskWorkspaceFolders();
        try {
            for (var _b = __asyncValues(await this.cliServer.runTests(tests, workspacePaths, {
                cancellationToken: cancellationToken,
                logger: logging_1.testLogger
            })), _c; _c = await _b.next(), !_c.done;) {
                const event = _c.value;
                this._testStates.fire({
                    type: 'test',
                    state: event.pass ? 'passed' : 'failed',
                    test: event.test
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
exports.QLTestAdapter = QLTestAdapter;

//# sourceMappingURL=test-adapter.js.map
