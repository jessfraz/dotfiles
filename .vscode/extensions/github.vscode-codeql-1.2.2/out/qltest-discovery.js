"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const discovery_1 = require("./discovery");
const vscode_1 = require("vscode");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
/**
 * A node in the tree of tests. This will be either a `QLTestDirectory` or a `QLTestFile`.
 */
class QLTestNode {
    constructor(_path, _name) {
        this._path = _path;
        this._name = _name;
    }
    get path() {
        return this._path;
    }
    get name() {
        return this._name;
    }
}
exports.QLTestNode = QLTestNode;
/**
 * A directory containing one or more QL tests or other test directories.
 */
class QLTestDirectory extends QLTestNode {
    constructor(_path, _name) {
        super(_path, _name);
        this._children = [];
    }
    get children() {
        return this._children;
    }
    addChild(child) {
        this._children.push(child);
    }
    createDirectory(relativePath) {
        const dirName = path.dirname(relativePath);
        if (dirName === '.') {
            return this.createChildDirectory(relativePath);
        }
        else {
            const parent = this.createDirectory(dirName);
            return parent.createDirectory(path.basename(relativePath));
        }
    }
    finish() {
        this._children.sort((a, b) => a.name.localeCompare(b.name));
        for (const child of this._children) {
            child.finish();
        }
    }
    createChildDirectory(name) {
        const existingChild = this._children.find((child) => child.name === name);
        if (existingChild !== undefined) {
            return existingChild;
        }
        else {
            const newChild = new QLTestDirectory(path.join(this.path, name), name);
            this.addChild(newChild);
            return newChild;
        }
    }
}
exports.QLTestDirectory = QLTestDirectory;
/**
 * A single QL test. This will be either a `.ql` file or a `.qlref` file.
 */
class QLTestFile extends QLTestNode {
    constructor(_path, _name) {
        super(_path, _name);
    }
    get children() {
        return [];
    }
    finish() {
        /**/
    }
}
exports.QLTestFile = QLTestFile;
/**
 * Discovers all QL tests contained in the QL packs in a given workspace folder.
 */
class QLTestDiscovery extends discovery_1.Discovery {
    constructor(qlPackDiscovery, cliServer) {
        super();
        this.qlPackDiscovery = qlPackDiscovery;
        this.cliServer = cliServer;
        this._onDidChangeTests = this.push(new vscode_1.EventEmitter());
        this.watcher = this.push(new semmle_vscode_utils_1.MultiFileSystemWatcher());
        this._testDirectories = [];
        this.push(this.qlPackDiscovery.onDidChangeQLPacks(this.handleDidChangeQLPacks, this));
        this.push(this.watcher.onDidChange(this.handleDidChange, this));
        this.refresh();
    }
    /**
     * Event to be fired when the set of discovered tests may have changed.
     */
    get onDidChangeTests() { return this._onDidChangeTests.event; }
    /**
     * The root test directory for each QL pack that contains tests.
     */
    get testDirectories() { return this._testDirectories; }
    handleDidChangeQLPacks() {
        this.refresh();
    }
    handleDidChange(uri) {
        if (!QLTestDiscovery.ignoreTestPath(uri.fsPath)) {
            this.refresh();
        }
    }
    async discover() {
        const testDirectories = [];
        const watchPaths = [];
        const qlPacks = this.qlPackDiscovery.qlPacks;
        for (const qlPack of qlPacks) {
            //HACK: Assume that only QL packs whose name ends with '-tests' contain tests.
            if (qlPack.name.endsWith('-tests')) {
                watchPaths.push(qlPack.uri.fsPath);
                const testPackage = await this.discoverTests(qlPack.uri.fsPath, qlPack.name);
                if (testPackage !== undefined) {
                    testDirectories.push(testPackage);
                }
            }
        }
        return {
            testDirectories: testDirectories,
            watchPaths: watchPaths
        };
    }
    update(results) {
        this._testDirectories = results.testDirectories;
        // Watch for changes to any `.ql` or `.qlref` file in any of the QL packs that contain tests.
        this.watcher.clear();
        results.watchPaths.forEach(watchPath => {
            this.watcher.addWatch(new vscode_1.RelativePattern(watchPath, '**/*.{ql,qlref}'));
        });
        this._onDidChangeTests.fire();
    }
    /**
     * Discover all QL tests in the specified directory and its subdirectories.
     * @param fullPath The full path of the test directory.
     * @param name The display name to use for the returned `TestDirectory` object.
     * @returns A `QLTestDirectory` object describing the contents of the directory, or `undefined` if
     *   no tests were found.
     */
    async discoverTests(fullPath, name) {
        const resolvedTests = (await this.cliServer.resolveTests(fullPath))
            .filter((testPath) => !QLTestDiscovery.ignoreTestPath(testPath));
        if (resolvedTests.length === 0) {
            return undefined;
        }
        else {
            const rootDirectory = new QLTestDirectory(fullPath, name);
            for (const testPath of resolvedTests) {
                const relativePath = path.normalize(path.relative(fullPath, testPath));
                const dirName = path.dirname(relativePath);
                const parentDirectory = rootDirectory.createDirectory(dirName);
                parentDirectory.addChild(new QLTestFile(testPath, path.basename(testPath)));
            }
            rootDirectory.finish();
            return rootDirectory;
        }
    }
    /**
     * Determine if the specified QL test should be ignored based on its filename.
     * @param testPath Path to the test file.
     */
    static ignoreTestPath(testPath) {
        switch (path.extname(testPath).toLowerCase()) {
            case '.ql':
            case '.qlref':
                return path.basename(testPath).startsWith('__');
            default:
                return false;
        }
    }
}
exports.QLTestDiscovery = QLTestDiscovery;

//# sourceMappingURL=qltest-discovery.js.map
