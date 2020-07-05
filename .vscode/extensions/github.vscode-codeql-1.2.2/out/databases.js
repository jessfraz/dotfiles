"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const glob = require("glob-promise");
const path = require("path");
const vscode = require("vscode");
const helpers_1 = require("./helpers");
const archive_filesystem_provider_1 = require("./archive-filesystem-provider");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const logging_1 = require("./logging");
/**
 * databases.ts
 * ------------
 * Managing state of what the current database is, and what other
 * databases have been recently selected.
 *
 * The source of truth of the current state resides inside the
 * `DatabaseManager` class below.
 */
/**
 * The name of the key in the workspaceState dictionary in which we
 * persist the current database across sessions.
 */
const CURRENT_DB = 'currentDatabase';
/**
 * The name of the key in the workspaceState dictionary in which we
 * persist the list of databases across sessions.
 */
const DB_LIST = 'databaseList';
/**
 * The layout of the database.
 */
var DatabaseKind;
(function (DatabaseKind) {
    /** A CodeQL database */
    DatabaseKind[DatabaseKind["Database"] = 0] = "Database";
    /** A raw QL dataset */
    DatabaseKind[DatabaseKind["RawDataset"] = 1] = "RawDataset";
})(DatabaseKind = exports.DatabaseKind || (exports.DatabaseKind = {}));
/**
 * An error thrown when we cannot find a valid database in a putative
 * database directory.
 */
class InvalidDatabaseError extends Error {
}
async function findDataset(parentDirectory) {
    /*
     * Look directly in the root
     */
    let dbRelativePaths = await glob('db-*/', {
        cwd: parentDirectory
    });
    if (dbRelativePaths.length === 0) {
        /*
         * Check If they are in the old location
         */
        dbRelativePaths = await glob('working/db-*/', {
            cwd: parentDirectory
        });
    }
    if (dbRelativePaths.length === 0) {
        throw new InvalidDatabaseError(`'${parentDirectory}' does not contain a dataset directory.`);
    }
    const dbAbsolutePath = path.join(parentDirectory, dbRelativePaths[0]);
    if (dbRelativePaths.length > 1) {
        helpers_1.showAndLogWarningMessage(`Found multiple dataset directories in database, using '${dbAbsolutePath}'.`);
    }
    return vscode.Uri.file(dbAbsolutePath);
}
async function findSourceArchive(databasePath, silent = false) {
    const relativePaths = ['src', 'output/src_archive'];
    for (const relativePath of relativePaths) {
        const basePath = path.join(databasePath, relativePath);
        const zipPath = basePath + '.zip';
        if (await fs.pathExists(basePath)) {
            return vscode.Uri.file(basePath);
        }
        else if (await fs.pathExists(zipPath)) {
            return vscode.Uri.file(zipPath).with({ scheme: archive_filesystem_provider_1.zipArchiveScheme });
        }
    }
    if (!silent)
        helpers_1.showAndLogInformationMessage(`Could not find source archive for database '${databasePath}'. Assuming paths are absolute.`);
    return undefined;
}
async function resolveDatabase(databasePath) {
    const name = path.basename(databasePath);
    // Look for dataset and source archive.
    const datasetUri = await findDataset(databasePath);
    const sourceArchiveUri = await findSourceArchive(databasePath);
    return {
        kind: DatabaseKind.Database,
        name,
        datasetUri,
        sourceArchiveUri
    };
}
/** Gets the relative paths of all `.dbscheme` files in the given directory. */
async function getDbSchemeFiles(dbDirectory) {
    return await glob('*.dbscheme', { cwd: dbDirectory });
}
async function resolveRawDataset(datasetPath) {
    if ((await getDbSchemeFiles(datasetPath)).length > 0) {
        return {
            kind: DatabaseKind.RawDataset,
            name: path.basename(datasetPath),
            datasetUri: vscode.Uri.file(datasetPath),
            sourceArchiveUri: undefined
        };
    }
    else {
        return undefined;
    }
}
async function resolveDatabaseContents(uri) {
    if (uri.scheme !== 'file') {
        throw new Error(`Database URI scheme '${uri.scheme}' not supported; only 'file' URIs are supported.`);
    }
    const databasePath = uri.fsPath;
    if (!await fs.pathExists(databasePath)) {
        throw new InvalidDatabaseError(`Database '${databasePath}' does not exist.`);
    }
    const contents = await resolveDatabase(databasePath) || await resolveRawDataset(databasePath);
    if (contents === undefined) {
        throw new InvalidDatabaseError(`'${databasePath}' is not a valid database.`);
    }
    // Look for a single dbscheme file within the database.
    // This should be found in the dataset directory, regardless of the form of database.
    const dbPath = contents.datasetUri.fsPath;
    const dbSchemeFiles = await getDbSchemeFiles(dbPath);
    if (dbSchemeFiles.length === 0) {
        throw new InvalidDatabaseError(`Database '${databasePath}' does not contain a CodeQL dbscheme under '${dbPath}'.`);
    }
    else if (dbSchemeFiles.length > 1) {
        throw new InvalidDatabaseError(`Database '${databasePath}' contains multiple CodeQL dbschemes under '${dbPath}'.`);
    }
    else {
        contents.dbSchemeUri = vscode.Uri.file(path.resolve(dbPath, dbSchemeFiles[0]));
    }
    return contents;
}
class DatabaseItemImpl {
    constructor(databaseUri, contents, options, onChanged) {
        this.databaseUri = databaseUri;
        this.options = options;
        this.onChanged = onChanged;
        this._error = undefined;
        this._contents = contents;
    }
    get name() {
        if (this.options.displayName) {
            return this.options.displayName;
        }
        else if (this._contents) {
            return this._contents.name;
        }
        else {
            return path.basename(this.databaseUri.fsPath);
        }
    }
    set name(newName) {
        this.options.displayName = newName;
    }
    get sourceArchive() {
        if (this.options.ignoreSourceArchive || (this._contents === undefined)) {
            return undefined;
        }
        else {
            return this._contents.sourceArchiveUri;
        }
    }
    get contents() {
        return this._contents;
    }
    get dateAdded() {
        return this.options.dateAdded;
    }
    get error() {
        return this._error;
    }
    async refresh() {
        try {
            try {
                this._contents = await resolveDatabaseContents(this.databaseUri);
                this._error = undefined;
            }
            catch (e) {
                this._contents = undefined;
                this._error = e;
                throw e;
            }
        }
        finally {
            this.onChanged(this);
        }
    }
    resolveSourceFile(file) {
        const sourceArchive = this.sourceArchive;
        if (sourceArchive === undefined) {
            if (file !== undefined) {
                // Treat it as an absolute path.
                return vscode.Uri.file(file);
            }
            else {
                return this.databaseUri;
            }
        }
        else {
            if (file !== undefined) {
                const absoluteFilePath = file.replace(':', '_');
                // Strip any leading slashes from the file path, and replace `:` with `_`.
                const relativeFilePath = absoluteFilePath.replace(/^\/*/, '').replace(':', '_');
                if (sourceArchive.scheme == archive_filesystem_provider_1.zipArchiveScheme) {
                    return archive_filesystem_provider_1.encodeSourceArchiveUri({
                        pathWithinSourceArchive: absoluteFilePath,
                        sourceArchiveZipPath: sourceArchive.fsPath,
                    });
                }
                else {
                    let newPath = sourceArchive.path;
                    if (!newPath.endsWith('/')) {
                        // Ensure a trailing slash.
                        newPath += '/';
                    }
                    newPath += relativeFilePath;
                    return sourceArchive.with({ path: newPath });
                }
            }
            else {
                return sourceArchive;
            }
        }
    }
    /**
     * Gets the state of this database, to be persisted in the workspace state.
     */
    getPersistedState() {
        return {
            uri: this.databaseUri.toString(true),
            options: this.options
        };
    }
    /**
     * Holds if the database item refers to an exported snapshot
     */
    async hasMetadataFile() {
        return (await Promise.all([
            fs.pathExists(path.join(this.databaseUri.fsPath, '.dbinfo')),
            fs.pathExists(path.join(this.databaseUri.fsPath, 'codeql-database.yml'))
        ])).some(x => x);
    }
    /**
     * Returns information about a database.
     */
    async getDbInfo(server) {
        if (this._dbinfo === undefined) {
            this._dbinfo = await server.resolveDatabase(this.databaseUri.fsPath);
        }
        return this._dbinfo;
    }
    /**
     * Returns `sourceLocationPrefix` of database. Requires that the database
     * has a `.dbinfo` file, which is the source of the prefix.
     */
    async getSourceLocationPrefix(server) {
        const dbInfo = await this.getDbInfo(server);
        return dbInfo.sourceLocationPrefix;
    }
    /**
     * Returns path to dataset folder of database.
     */
    async getDatasetFolder(server) {
        const dbInfo = await this.getDbInfo(server);
        return dbInfo.datasetFolder;
    }
    /**
     * Returns the root uri of the virtual filesystem for this database's source archive.
     */
    getSourceArchiveExplorerUri() {
        const sourceArchive = this.sourceArchive;
        if (sourceArchive === undefined || !sourceArchive.fsPath.endsWith('.zip'))
            return undefined;
        return archive_filesystem_provider_1.encodeSourceArchiveUri({
            pathWithinSourceArchive: '/',
            sourceArchiveZipPath: sourceArchive.fsPath,
        });
    }
    /**
     * Holds if `uri` belongs to this database's source archive.
     */
    belongsToSourceArchiveExplorerUri(uri) {
        if (this.sourceArchive === undefined)
            return false;
        return uri.scheme === archive_filesystem_provider_1.zipArchiveScheme &&
            archive_filesystem_provider_1.decodeSourceArchiveUri(uri).sourceArchiveZipPath === this.sourceArchive.fsPath;
    }
}
/**
 * A promise that resolves to an event's result value when the event
 * `event` fires. If waiting for the event takes too long (by default
 * >1000ms) log a warning, and resolve to undefined.
 */
function eventFired(event, timeoutMs = 1000) {
    return new Promise((res, _rej) => {
        const timeout = setTimeout(() => {
            logging_1.logger.log(`Waiting for event ${event} timed out after ${timeoutMs}ms`);
            res(undefined);
            dispose();
        }, timeoutMs);
        const disposable = event(e => {
            res(e);
            dispose();
        });
        function dispose() {
            clearTimeout(timeout);
            disposable.dispose();
        }
    });
}
class DatabaseManager extends semmle_vscode_utils_1.DisposableObject {
    constructor(ctx, config, logger) {
        super();
        this.ctx = ctx;
        this.config = config;
        this.logger = logger;
        this._onDidChangeDatabaseItem = this.push(new vscode.EventEmitter());
        this.onDidChangeDatabaseItem = this._onDidChangeDatabaseItem.event;
        this._onDidChangeCurrentDatabaseItem = this.push(new vscode.EventEmitter());
        this.onDidChangeCurrentDatabaseItem = this._onDidChangeCurrentDatabaseItem.event;
        this._databaseItems = [];
        this._currentDatabaseItem = undefined;
        this.loadPersistedState(); // Let this run async.
    }
    async openDatabase(uri, options) {
        const contents = await resolveDatabaseContents(uri);
        const realOptions = options || {};
        // Ignore the source archive for QLTest databases by default.
        const isQLTestDatabase = path.extname(uri.fsPath) === '.testproj';
        const fullOptions = {
            ignoreSourceArchive: (realOptions.ignoreSourceArchive !== undefined) ?
                realOptions.ignoreSourceArchive : isQLTestDatabase,
            displayName: realOptions.displayName,
            dateAdded: realOptions.dateAdded || Date.now()
        };
        const databaseItem = new DatabaseItemImpl(uri, contents, fullOptions, (item) => {
            this._onDidChangeDatabaseItem.fire(item);
        });
        await this.addDatabaseItem(databaseItem);
        await this.addDatabaseSourceArchiveFolder(databaseItem);
        return databaseItem;
    }
    async addDatabaseSourceArchiveFolder(item) {
        // The folder may already be in workspace state from a previous
        // session. If not, add it.
        const index = this.getDatabaseWorkspaceFolderIndex(item);
        if (index === -1) {
            // Add that filesystem as a folder to the current workspace.
            //
            // It's important that we add workspace folders to the end,
            // rather than beginning of the list, because the first
            // workspace folder is special; if it gets updated, the entire
            // extension host is restarted. (cf.
            // https://github.com/microsoft/vscode/blob/e0d2ed907d1b22808c56127678fb436d604586a7/src/vs/workbench/contrib/relauncher/browser/relauncher.contribution.ts#L209-L214)
            //
            // This is undesirable, as we might be adding and removing many
            // workspace folders as the user adds and removes databases.
            const end = (vscode.workspace.workspaceFolders || []).length;
            const uri = item.getSourceArchiveExplorerUri();
            if (uri === undefined) {
                logging_1.logger.log(`Couldn't obtain file explorer uri for ${item.name}`);
            }
            else {
                logging_1.logger.log(`Adding workspace folder for ${item.name} source archive at index ${end}`);
                if ((vscode.workspace.workspaceFolders || []).length < 2) {
                    // Adding this workspace folder makes the workspace
                    // multi-root, which may surprise the user. Let them know
                    // we're doing this.
                    vscode.window.showInformationMessage(`Adding workspace folder for source archive of database ${item.name}.`);
                }
                vscode.workspace.updateWorkspaceFolders(end, 0, {
                    name: `[${item.name} source archive]`,
                    uri,
                });
                // vscode api documentation says we must to wait for this event
                // between multiple `updateWorkspaceFolders` calls.
                await eventFired(vscode.workspace.onDidChangeWorkspaceFolders);
            }
        }
    }
    async createDatabaseItemFromPersistedState(state) {
        let displayName = undefined;
        let ignoreSourceArchive = false;
        let dateAdded = undefined;
        if (state.options) {
            if (typeof state.options.displayName === 'string') {
                displayName = state.options.displayName;
            }
            if (typeof state.options.ignoreSourceArchive === 'boolean') {
                ignoreSourceArchive = state.options.ignoreSourceArchive;
            }
            if (typeof state.options.dateAdded === 'number') {
                dateAdded = state.options.dateAdded;
            }
        }
        const fullOptions = {
            ignoreSourceArchive,
            displayName,
            dateAdded
        };
        const item = new DatabaseItemImpl(vscode.Uri.parse(state.uri), undefined, fullOptions, (item) => {
            this._onDidChangeDatabaseItem.fire(item);
        });
        await this.addDatabaseItem(item);
        return item;
    }
    async loadPersistedState() {
        const currentDatabaseUri = this.ctx.workspaceState.get(CURRENT_DB);
        const databases = this.ctx.workspaceState.get(DB_LIST, []);
        try {
            for (const database of databases) {
                const databaseItem = await this.createDatabaseItemFromPersistedState(database);
                try {
                    await databaseItem.refresh();
                    if (currentDatabaseUri === database.uri) {
                        this.setCurrentDatabaseItem(databaseItem, true);
                    }
                }
                catch (e) {
                    // When loading from persisted state, leave invalid databases in the list. They will be
                    // marked as invalid, and cannot be set as the current database.
                }
            }
        }
        catch (e) {
            // database list had an unexpected type - nothing to be done?
            helpers_1.showAndLogErrorMessage(`Database list loading failed: ${e.message}`);
        }
    }
    get databaseItems() {
        return this._databaseItems;
    }
    get currentDatabaseItem() {
        return this._currentDatabaseItem;
    }
    async setCurrentDatabaseItem(item, skipRefresh = false) {
        if (!skipRefresh && (item !== undefined)) {
            await item.refresh(); // Will throw on invalid database.
        }
        if (this._currentDatabaseItem !== item) {
            this._currentDatabaseItem = item;
            this.updatePersistedCurrentDatabaseItem();
            this._onDidChangeCurrentDatabaseItem.fire(item);
        }
    }
    /**
     * Returns the index of the workspace folder that corresponds to the source archive of `item`
     * if there is one, and -1 otherwise.
     */
    getDatabaseWorkspaceFolderIndex(item) {
        return (vscode.workspace.workspaceFolders || [])
            .findIndex(folder => item.belongsToSourceArchiveExplorerUri(folder.uri));
    }
    findDatabaseItem(uri) {
        const uriString = uri.toString(true);
        return this._databaseItems.find(item => item.databaseUri.toString(true) === uriString);
    }
    findDatabaseItemBySourceArchive(uri) {
        const uriString = uri.toString(true);
        return this._databaseItems.find(item => item.sourceArchive && item.sourceArchive.toString(true) === uriString);
    }
    async addDatabaseItem(item) {
        this._databaseItems.push(item);
        this.updatePersistedDatabaseList();
        this._onDidChangeDatabaseItem.fire(undefined);
    }
    async renameDatabaseItem(item, newName) {
        item.name = newName;
        this.updatePersistedDatabaseList();
        this._onDidChangeDatabaseItem.fire(item);
    }
    removeDatabaseItem(item) {
        if (this._currentDatabaseItem == item)
            this._currentDatabaseItem = undefined;
        const index = this.databaseItems.findIndex(searchItem => searchItem === item);
        if (index >= 0) {
            this._databaseItems.splice(index, 1);
        }
        this.updatePersistedDatabaseList();
        // Delete folder from workspace, if it is still there
        const folderIndex = (vscode.workspace.workspaceFolders || []).findIndex(folder => item.belongsToSourceArchiveExplorerUri(folder.uri));
        if (index >= 0) {
            logging_1.logger.log(`Removing workspace folder at index ${folderIndex}`);
            vscode.workspace.updateWorkspaceFolders(folderIndex, 1);
        }
        // Delete folder from file system only if it is controlled by the extension
        if (this.isExtensionControlledLocation(item.databaseUri)) {
            logging_1.logger.log(`Deleting database from filesystem.`);
            fs.remove(item.databaseUri.path).then(() => logging_1.logger.log(`Deleted '${item.databaseUri.path}'`), e => logging_1.logger.log(`Failed to delete '${item.databaseUri.path}'. Reason: ${e.message}`));
        }
        this._onDidChangeDatabaseItem.fire(undefined);
    }
    updatePersistedCurrentDatabaseItem() {
        this.ctx.workspaceState.update(CURRENT_DB, this._currentDatabaseItem ?
            this._currentDatabaseItem.databaseUri.toString(true) : undefined);
    }
    updatePersistedDatabaseList() {
        this.ctx.workspaceState.update(DB_LIST, this._databaseItems.map(item => item.getPersistedState()));
    }
    isExtensionControlledLocation(uri) {
        const storagePath = this.ctx.storagePath || this.ctx.globalStoragePath;
        return uri.path.startsWith(storagePath);
    }
}
exports.DatabaseManager = DatabaseManager;
/**
 * Get the set of directories containing upgrades, given a list of
 * scripts returned by the cli's upgrade resolution.
 */
function getUpgradesDirectories(scripts) {
    const parentDirs = scripts.map(dir => path.dirname(dir));
    const uniqueParentDirs = new Set(parentDirs);
    return Array.from(uniqueParentDirs).map(filePath => vscode.Uri.file(filePath));
}
exports.getUpgradesDirectories = getUpgradesDirectories;

//# sourceMappingURL=databases.js.map
