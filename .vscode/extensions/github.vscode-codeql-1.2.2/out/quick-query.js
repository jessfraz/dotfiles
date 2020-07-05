"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yaml = require("js-yaml");
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const helpers = require("./helpers");
const logging_1 = require("./logging");
const run_queries_1 = require("./run-queries");
const QUICK_QUERIES_DIR_NAME = 'quick-queries';
const QUICK_QUERY_QUERY_NAME = 'quick-query.ql';
const QUICK_QUERY_WORKSPACE_FOLDER_NAME = 'Quick Queries';
function isQuickQueryPath(queryPath) {
    return path.basename(queryPath) === QUICK_QUERY_QUERY_NAME;
}
exports.isQuickQueryPath = isQuickQueryPath;
/**
 * `getBaseText` heuristically returns an appropriate import statement
 * prelude based on the filename of the dbscheme file given. TODO: add
 * a 'default import' field to the qlpack itself, and use that.
 */
function getBaseText(dbschemeBase) {
    if (dbschemeBase == 'semmlecode.javascript.dbscheme')
        return 'import javascript\n\nselect ""';
    if (dbschemeBase == 'semmlecode.cpp.dbscheme')
        return 'import cpp\n\nselect ""';
    if (dbschemeBase == 'semmlecode.dbscheme')
        return 'import java\n\nselect ""';
    if (dbschemeBase == 'semmlecode.python.dbscheme')
        return 'import python\n\nselect ""';
    if (dbschemeBase == 'semmlecode.csharp.dbscheme')
        return 'import csharp\n\nselect ""';
    if (dbschemeBase == 'go.dbscheme')
        return 'import go\n\nselect ""';
    return 'select ""';
}
function getQuickQueriesDir(ctx) {
    const storagePath = ctx.storagePath;
    if (storagePath === undefined) {
        throw new Error('Workspace storage path is undefined');
    }
    const queriesPath = path.join(storagePath, QUICK_QUERIES_DIR_NAME);
    fs.ensureDir(queriesPath, { mode: 0o700 });
    return queriesPath;
}
/**
 * Show a buffer the user can enter a simple query into.
 */
async function displayQuickQuery(ctx, cliServer, databaseUI) {
    function updateQuickQueryDir(queriesDir, index, len) {
        vscode_1.workspace.updateWorkspaceFolders(index, len, { uri: vscode_1.Uri.file(queriesDir), name: QUICK_QUERY_WORKSPACE_FOLDER_NAME });
    }
    try {
        const workspaceFolders = vscode_1.workspace.workspaceFolders || [];
        const queriesDir = await getQuickQueriesDir(ctx);
        // If there is already a quick query open, don't clobber it, just
        // show it.
        const existing = vscode_1.workspace.textDocuments.find(doc => path.basename(doc.uri.fsPath) === QUICK_QUERY_QUERY_NAME);
        if (existing !== undefined) {
            vscode_1.window.showTextDocument(existing);
            return;
        }
        // We need to have a multi-root workspace to make quick query work
        // at all. Changing the workspace from single-root to multi-root
        // causes a restart of the whole extension host environment, so we
        // basically can't do anything that survives that restart.
        //
        // So if we are currently in a single-root workspace (of which the
        // only reliable signal appears to be `workspace.workspaceFile`
        // being undefined) just let the user know that they're in for a
        // restart.
        if (vscode_1.workspace.workspaceFile === undefined) {
            const makeMultiRoot = await helpers.showBinaryChoiceDialog('Quick query requires multiple folders in the workspace. Reload workspace as multi-folder workspace?');
            if (makeMultiRoot) {
                updateQuickQueryDir(queriesDir, workspaceFolders.length, 0);
            }
            return;
        }
        const index = workspaceFolders.findIndex(folder => folder.name === QUICK_QUERY_WORKSPACE_FOLDER_NAME);
        if (index === -1)
            updateQuickQueryDir(queriesDir, workspaceFolders.length, 0);
        else
            updateQuickQueryDir(queriesDir, index, 1);
        // We're going to infer which qlpack to use from the current database
        const dbItem = await databaseUI.getDatabaseItem();
        if (dbItem === undefined) {
            throw new Error('Can\'t start quick query without a selected database');
        }
        const datasetFolder = await dbItem.getDatasetFolder(cliServer);
        const { qlpack, dbscheme } = await helpers.resolveDatasetFolder(cliServer, datasetFolder);
        const quickQueryQlpackYaml = {
            name: "quick-query",
            version: "1.0.0",
            libraryPathDependencies: [qlpack]
        };
        const qlFile = path.join(queriesDir, QUICK_QUERY_QUERY_NAME);
        const qlPackFile = path.join(queriesDir, 'qlpack.yml');
        await fs.writeFile(qlFile, getBaseText(path.basename(dbscheme)), 'utf8');
        await fs.writeFile(qlPackFile, yaml.safeDump(quickQueryQlpackYaml), 'utf8');
        vscode_1.window.showTextDocument(await vscode_1.workspace.openTextDocument(qlFile));
    }
    // TODO: clean up error handling for top-level commands like this
    catch (e) {
        if (e instanceof run_queries_1.UserCancellationException) {
            logging_1.logger.log(e.message);
        }
        else if (e instanceof vscode_languageclient_1.ResponseError && e.code == vscode_languageclient_1.ErrorCodes.RequestCancelled) {
            logging_1.logger.log(e.message);
        }
        else if (e instanceof Error)
            helpers.showAndLogErrorMessage(e.message);
        else
            throw e;
    }
}
exports.displayQuickQuery = displayQuickQuery;

//# sourceMappingURL=quick-query.js.map
