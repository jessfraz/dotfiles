"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const vscode_1 = require("vscode");
const databases_1 = require("./databases");
const helpers_1 = require("./helpers");
const logging_1 = require("./logging");
const run_queries_1 = require("./run-queries");
const upgrades_1 = require("./upgrades");
const databaseFetcher_1 = require("./databaseFetcher");
const fs = require("fs-extra");
/**
 * Path to icons to display next to currently selected database.
 */
const SELECTED_DATABASE_ICON = {
    light: 'media/light/check.svg',
    dark: 'media/dark/check.svg',
};
/**
 * Path to icon to display next to an invalid database.
 */
const INVALID_DATABASE_ICON = 'media/red-x.svg';
function joinThemableIconPath(base, iconPath) {
    if (typeof iconPath == 'object')
        return {
            light: path.join(base, iconPath.light),
            dark: path.join(base, iconPath.dark)
        };
    else
        return path.join(base, iconPath);
}
var SortOrder;
(function (SortOrder) {
    SortOrder["NameAsc"] = "NameAsc";
    SortOrder["NameDesc"] = "NameDesc";
    SortOrder["DateAddedAsc"] = "DateAddedAsc";
    SortOrder["DateAddedDesc"] = "DateAddedDesc";
})(SortOrder || (SortOrder = {}));
/**
 * Tree data provider for the databases view.
 */
class DatabaseTreeDataProvider extends semmle_vscode_utils_1.DisposableObject {
    constructor(ctx, databaseManager) {
        super();
        this.ctx = ctx;
        this.databaseManager = databaseManager;
        this._sortOrder = SortOrder.NameAsc;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.handleDidChangeDatabaseItem = (databaseItem) => {
            this._onDidChangeTreeData.fire(databaseItem);
        };
        this.handleDidChangeCurrentDatabaseItem = (databaseItem) => {
            if (this.currentDatabaseItem) {
                this._onDidChangeTreeData.fire(this.currentDatabaseItem);
            }
            this.currentDatabaseItem = databaseItem;
            if (this.currentDatabaseItem) {
                this._onDidChangeTreeData.fire(this.currentDatabaseItem);
            }
        };
        this.currentDatabaseItem = databaseManager.currentDatabaseItem;
        this.push(this.databaseManager.onDidChangeDatabaseItem(this.handleDidChangeDatabaseItem));
        this.push(this.databaseManager.onDidChangeCurrentDatabaseItem(this.handleDidChangeCurrentDatabaseItem));
    }
    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event;
    }
    getTreeItem(element) {
        const item = new vscode_1.TreeItem(element.name);
        if (element === this.currentDatabaseItem) {
            item.iconPath = joinThemableIconPath(this.ctx.extensionPath, SELECTED_DATABASE_ICON);
        }
        else if (element.error !== undefined) {
            item.iconPath = joinThemableIconPath(this.ctx.extensionPath, INVALID_DATABASE_ICON);
        }
        item.tooltip = element.databaseUri.fsPath;
        return item;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.databaseManager.databaseItems.slice(0).sort((db1, db2) => {
                switch (this.sortOrder) {
                    case SortOrder.NameAsc:
                        return db1.name.localeCompare(db2.name);
                    case SortOrder.NameDesc:
                        return db2.name.localeCompare(db1.name);
                    case SortOrder.DateAddedAsc:
                        return (db1.dateAdded || 0) - (db2.dateAdded || 0);
                    case SortOrder.DateAddedDesc:
                        return (db2.dateAdded || 0) - (db1.dateAdded || 0);
                }
            });
        }
        else {
            return [];
        }
    }
    getParent(_element) {
        return null;
    }
    getCurrent() {
        return this.currentDatabaseItem;
    }
    get sortOrder() {
        return this._sortOrder;
    }
    set sortOrder(newSortOrder) {
        this._sortOrder = newSortOrder;
        this._onDidChangeTreeData.fire();
    }
}
/** Gets the first element in the given list, if any, or undefined if the list is empty or undefined. */
function getFirst(list) {
    if (list === undefined || list.length === 0) {
        return undefined;
    }
    else {
        return list[0];
    }
}
/**
 * Displays file selection dialog. Expects the user to choose a
 * database directory, which should be the parent directory of a
 * directory of the form `db-[language]`, for example, `db-cpp`.
 *
 * XXX: no validation is done other than checking the directory name
 * to make sure it really is a database directory.
 */
async function chooseDatabaseDir(byFolder) {
    const chosen = await vscode_1.window.showOpenDialog({
        openLabel: byFolder ? 'Choose Database folder' : 'Choose Database archive',
        canSelectFiles: !byFolder,
        canSelectFolders: byFolder,
        canSelectMany: false,
        filters: byFolder ? {} : { Archives: ['zip'] }
    });
    return getFirst(chosen);
}
class DatabaseUI extends semmle_vscode_utils_1.DisposableObject {
    constructor(ctx, cliserver, databaseManager, queryServer, storagePath) {
        super();
        this.cliserver = cliserver;
        this.databaseManager = databaseManager;
        this.queryServer = queryServer;
        this.storagePath = storagePath;
        this.handleMakeCurrentDatabase = async (databaseItem) => {
            await this.databaseManager.setCurrentDatabaseItem(databaseItem);
        };
        this.handleChooseDatabaseFolder = async () => {
            try {
                return await this.chooseAndSetDatabase(true);
            }
            catch (e) {
                helpers_1.showAndLogErrorMessage(e.message);
                return undefined;
            }
        };
        this.handleChooseDatabaseArchive = async () => {
            try {
                return await this.chooseAndSetDatabase(false);
            }
            catch (e) {
                helpers_1.showAndLogErrorMessage(e.message);
                return undefined;
            }
        };
        this.handleChooseDatabaseInternet = async () => {
            return await databaseFetcher_1.promptImportInternetDatabase(this.databaseManager, this.storagePath);
        };
        this.handleChooseDatabaseLgtm = async () => {
            return await databaseFetcher_1.promptImportLgtmDatabase(this.databaseManager, this.storagePath);
        };
        this.handleSortByName = async () => {
            if (this.treeDataProvider.sortOrder === SortOrder.NameAsc) {
                this.treeDataProvider.sortOrder = SortOrder.NameDesc;
            }
            else {
                this.treeDataProvider.sortOrder = SortOrder.NameAsc;
            }
        };
        this.handleSortByDateAdded = async () => {
            if (this.treeDataProvider.sortOrder === SortOrder.DateAddedAsc) {
                this.treeDataProvider.sortOrder = SortOrder.DateAddedDesc;
            }
            else {
                this.treeDataProvider.sortOrder = SortOrder.DateAddedAsc;
            }
        };
        this.handleUpgradeCurrentDatabase = async () => {
            await this.handleUpgradeDatabase(this.databaseManager.currentDatabaseItem);
        };
        this.handleUpgradeDatabase = async (databaseItem) => {
            if (this.queryServer === undefined) {
                logging_1.logger.log('Received request to upgrade database, but there is no running query server.');
                return;
            }
            if (databaseItem === undefined) {
                logging_1.logger.log('Received request to upgrade database, but no database was provided.');
                return;
            }
            if (databaseItem.contents === undefined) {
                logging_1.logger.log('Received request to upgrade database, but database contents could not be found.');
                return;
            }
            if (databaseItem.contents.dbSchemeUri === undefined) {
                logging_1.logger.log('Received request to upgrade database, but database has no schema.');
                return;
            }
            // Search for upgrade scripts in any workspace folders available
            const searchPath = helpers_1.getOnDiskWorkspaceFolders();
            const upgradeInfo = await this.cliserver.resolveUpgrades(databaseItem.contents.dbSchemeUri.fsPath, searchPath);
            const { scripts, finalDbscheme } = upgradeInfo;
            if (finalDbscheme === undefined) {
                logging_1.logger.log('Could not determine target dbscheme to upgrade to.');
                return;
            }
            const targetDbSchemeUri = vscode_1.Uri.file(finalDbscheme);
            try {
                await upgrades_1.upgradeDatabase(this.queryServer, databaseItem, targetDbSchemeUri, databases_1.getUpgradesDirectories(scripts));
            }
            catch (e) {
                if (e instanceof run_queries_1.UserCancellationException) {
                    logging_1.logger.log(e.message);
                }
                else
                    throw e;
            }
        };
        this.handleClearCache = async () => {
            if ((this.queryServer !== undefined) &&
                (this.databaseManager.currentDatabaseItem !== undefined)) {
                await run_queries_1.clearCacheInDatabase(this.queryServer, this.databaseManager.currentDatabaseItem);
            }
        };
        this.handleSetCurrentDatabase = async (uri) => {
            // Assume user has selected an archive if the file has a .zip extension
            if (uri.path.endsWith('.zip')) {
                return await databaseFetcher_1.importArchiveDatabase(uri.toString(true), this.databaseManager, this.storagePath);
            }
            return await this.setCurrentDatabase(uri);
        };
        this.handleRemoveDatabase = (databaseItem) => {
            this.databaseManager.removeDatabaseItem(databaseItem);
        };
        this.handleRenameDatabase = async (databaseItem) => {
            try {
                const newName = await vscode_1.window.showInputBox({
                    prompt: 'Choose new database name',
                    value: databaseItem.name
                });
                if (newName) {
                    this.databaseManager.renameDatabaseItem(databaseItem, newName);
                }
            }
            catch (e) {
                helpers_1.showAndLogErrorMessage(e.message);
            }
        };
        this.handleOpenFolder = async (databaseItem) => {
            try {
                await vscode_1.env.openExternal(databaseItem.databaseUri);
            }
            catch (e) {
                helpers_1.showAndLogErrorMessage(e.message);
            }
        };
        this.treeDataProvider = this.push(new DatabaseTreeDataProvider(ctx, databaseManager));
        this.push(vscode_1.window.createTreeView('codeQLDatabases', { treeDataProvider: this.treeDataProvider }));
        logging_1.logger.log('Registering database panel commands.');
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.chooseDatabaseFolder', this.handleChooseDatabaseFolder));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.chooseDatabaseArchive', this.handleChooseDatabaseArchive));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.chooseDatabaseInternet', this.handleChooseDatabaseInternet));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.chooseDatabaseLgtm', this.handleChooseDatabaseLgtm));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.setCurrentDatabase', this.handleSetCurrentDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.upgradeCurrentDatabase', this.handleUpgradeCurrentDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.clearCache', this.handleClearCache));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.setCurrentDatabase', this.handleMakeCurrentDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.sortByName', this.handleSortByName));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.sortByDateAdded', this.handleSortByDateAdded));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.removeDatabase', this.handleRemoveDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.upgradeDatabase', this.handleUpgradeDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.renameDatabase', this.handleRenameDatabase));
        ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQLDatabases.openDatabaseFolder', this.handleOpenFolder));
    }
    /**
     * Return the current database directory. If we don't already have a
     * current database, ask the user for one, and return that, or
     * undefined if they cancel.
     */
    async getDatabaseItem() {
        if (this.databaseManager.currentDatabaseItem === undefined) {
            await this.chooseAndSetDatabase(false);
        }
        return this.databaseManager.currentDatabaseItem;
    }
    async setCurrentDatabase(uri) {
        let databaseItem = this.databaseManager.findDatabaseItem(uri);
        if (databaseItem === undefined) {
            databaseItem = await this.databaseManager.openDatabase(uri);
        }
        await this.databaseManager.setCurrentDatabaseItem(databaseItem);
        return databaseItem;
    }
    /**
     * Ask the user for a database directory. Returns the chosen database, or `undefined` if the
     * operation was canceled.
     */
    async chooseAndSetDatabase(byFolder) {
        const uri = await chooseDatabaseDir(byFolder);
        if (!uri) {
            return undefined;
        }
        if (byFolder) {
            const fixedUri = await this.fixDbUri(uri);
            // we are selecting a database folder
            return await this.setCurrentDatabase(fixedUri);
        }
        else {
            // we are selecting a database archive. Must unzip into a workspace-controlled area
            // before importing.
            return await databaseFetcher_1.importArchiveDatabase(uri.toString(true), this.databaseManager, this.storagePath);
        }
    }
    /**
     * Perform some heuristics to ensure a proper database location is chosen.
     *
     * 1. If the selected URI to add is a file, choose the containing directory
     * 2. If the selected URI is a directory matching db-*, choose the containing directory
     * 3. choose the current directory
     *
     * @param uri a URI that is a datbase folder or inside it
     *
     * @return the actual database folder found by using the heuristics above.
     */
    async fixDbUri(uri) {
        let dbPath = uri.fsPath;
        if ((await fs.stat(dbPath)).isFile()) {
            dbPath = path.dirname(dbPath);
        }
        if (path.basename(dbPath).startsWith('db-')) {
            dbPath = path.dirname(dbPath);
        }
        return vscode_1.Uri.file(dbPath);
    }
}
exports.DatabaseUI = DatabaseUI;

//# sourceMappingURL=databases-ui.js.map
