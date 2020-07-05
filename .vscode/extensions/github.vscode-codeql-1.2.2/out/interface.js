"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const path = require("path");
const semmle_bqrs_1 = require("semmle-bqrs");
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const helpers_1 = require("./helpers");
const helpers_pure_1 = require("./helpers-pure");
const interface_types_1 = require("./interface-types");
const messages = require("./messages");
const query_results_1 = require("./query-results");
const run_queries_1 = require("./run-queries");
const sarif_utils_1 = require("./sarif-utils");
const adapt_1 = require("./adapt");
const config_1 = require("./config");
const interface_utils_1 = require("./interface-utils");
/**
 * interface.ts
 * ------------
 *
 * Displaying query results and linking back to source files when the
 * webview asks us to.
 */
/** Gets a nonce string created with 128 bits of entropy. */
function getNonce() {
    return crypto.randomBytes(16).toString('base64');
}
/**
 * Whether to force webview to reveal
 */
var WebviewReveal;
(function (WebviewReveal) {
    WebviewReveal[WebviewReveal["Forced"] = 0] = "Forced";
    WebviewReveal[WebviewReveal["NotForced"] = 1] = "NotForced";
})(WebviewReveal = exports.WebviewReveal || (exports.WebviewReveal = {}));
/**
 * Returns HTML to populate the given webview.
 * Uses a content security policy that only loads the given script.
 */
function getHtmlForWebview(webview, scriptUriOnDisk, stylesheetUriOnDisk) {
    // Convert the on-disk URIs into webview URIs.
    const scriptWebviewUri = webview.asWebviewUri(scriptUriOnDisk);
    const stylesheetWebviewUri = webview.asWebviewUri(stylesheetUriOnDisk);
    // Use a nonce in the content security policy to uniquely identify the above resources.
    const nonce = getNonce();
    /*
     * Content security policy:
     * default-src: allow nothing by default.
     * script-src: allow only the given script, using the nonce.
     * style-src: allow only the given stylesheet, using the nonce.
     * connect-src: only allow fetch calls to webview resource URIs
     * (this is used to load BQRS result files).
     */
    const html = `
<html>
  <head>
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src ${webview.cspSource};">
    <link nonce="${nonce}" rel="stylesheet" href="${stylesheetWebviewUri}">
  </head>
  <body>
    <div id=root>
    </div>
      <script nonce="${nonce}" src="${scriptWebviewUri}">
    </script>
  </body>
</html>`;
    webview.html = html;
}
/** Converts a filesystem URI into a webview URI string that the given panel can use to read the file. */
function fileUriToWebviewUri(panel, fileUriOnDisk) {
    return panel.webview.asWebviewUri(fileUriOnDisk).toString();
}
exports.fileUriToWebviewUri = fileUriToWebviewUri;
/** Converts a URI string received from a webview into a local filesystem URI for the same resource. */
function webviewUriToFileUri(webviewUri) {
    // Webview URIs used the vscode-resource scheme. The filesystem path of the resource can be obtained from the path component of the webview URI.
    const path = vscode_1.Uri.parse(webviewUri).path;
    // For this path to be interpreted on the filesystem, we need to parse it as a filesystem URI for the current platform.
    return vscode_1.Uri.file(path);
}
exports.webviewUriToFileUri = webviewUriToFileUri;
function sortMultiplier(sortDirection) {
    switch (sortDirection) {
        case interface_types_1.SortDirection.asc: return 1;
        case interface_types_1.SortDirection.desc: return -1;
    }
}
function sortInterpretedResults(results, sortState) {
    if (sortState !== undefined) {
        const multiplier = sortMultiplier(sortState.sortDirection);
        switch (sortState.sortBy) {
            case 'alert-message':
                results.sort((a, b) => {
                    var _a;
                    return a.message.text === undefined ? 0 :
                        b.message.text === undefined ? 0 :
                            multiplier * ((_a = a.message.text) === null || _a === void 0 ? void 0 : _a.localeCompare(b.message.text));
                });
                break;
            default:
                helpers_pure_1.assertNever(sortState.sortBy);
        }
    }
}
function numPagesOfResultSet(resultSet) {
    return Math.ceil(resultSet.schema.tupleCount / interface_types_1.RAW_RESULTS_PAGE_SIZE);
}
class InterfaceManager extends semmle_vscode_utils_1.DisposableObject {
    constructor(ctx, databaseManager, cliServer, logger) {
        super();
        this.ctx = ctx;
        this.databaseManager = databaseManager;
        this.cliServer = cliServer;
        this.logger = logger;
        this._panelLoaded = false;
        this._panelLoadedCallBacks = [];
        this._diagnosticCollection = vscode_1.languages.createDiagnosticCollection(`codeql-query-results`);
        this.push(this._diagnosticCollection);
        this.push(vscode.window.onDidChangeTextEditorSelection(this.handleSelectionChange.bind(this)));
        logger.log('Registering path-step navigation commands.');
        this.push(vscode.commands.registerCommand("codeQLQueryResults.nextPathStep", this.navigatePathStep.bind(this, 1)));
        this.push(vscode.commands.registerCommand("codeQLQueryResults.previousPathStep", this.navigatePathStep.bind(this, -1)));
    }
    navigatePathStep(direction) {
        this.postMessage({ t: "navigatePath", direction });
    }
    // Returns the webview panel, creating it if it doesn't already
    // exist.
    getPanel() {
        if (this._panel == undefined) {
            const { ctx } = this;
            const panel = (this._panel = vscode_1.window.createWebviewPanel("resultsView", // internal name
            "CodeQL Query Results", // user-visible name
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
                enableScripts: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(run_queries_1.tmpDir.name),
                    vscode.Uri.file(path.join(this.ctx.extensionPath, "out"))
                ]
            }));
            this._panel.onDidDispose(() => {
                this._panel = undefined;
            }, null, ctx.subscriptions);
            const scriptPathOnDisk = vscode.Uri.file(ctx.asAbsolutePath("out/resultsView.js"));
            const stylesheetPathOnDisk = vscode.Uri.file(ctx.asAbsolutePath("out/resultsView.css"));
            getHtmlForWebview(panel.webview, scriptPathOnDisk, stylesheetPathOnDisk);
            panel.webview.onDidReceiveMessage(async (e) => this.handleMsgFromView(e), undefined, ctx.subscriptions);
        }
        return this._panel;
    }
    async changeSortState(update) {
        if (this._displayedQuery === undefined) {
            helpers_1.showAndLogErrorMessage("Failed to sort results since evaluation info was unknown.");
            return;
        }
        // Notify the webview that it should expect new results.
        await this.postMessage({ t: "resultsUpdating" });
        await update(this._displayedQuery);
        await this.showResults(this._displayedQuery, WebviewReveal.NotForced, true);
    }
    async handleMsgFromView(msg) {
        switch (msg.t) {
            case "viewSourceFile": {
                const databaseItem = this.databaseManager.findDatabaseItem(vscode_1.Uri.parse(msg.databaseUri));
                if (databaseItem !== undefined) {
                    try {
                        await showLocation(msg.loc, databaseItem);
                    }
                    catch (e) {
                        if (e instanceof Error) {
                            if (e.message.match(/File not found/)) {
                                vscode.window.showErrorMessage(`Original file of this result is not in the database's source archive.`);
                            }
                            else {
                                this.logger.log(`Unable to handleMsgFromView: ${e.message}`);
                            }
                        }
                        else {
                            this.logger.log(`Unable to handleMsgFromView: ${e}`);
                        }
                    }
                }
                break;
            }
            case "toggleDiagnostics": {
                if (msg.visible) {
                    const databaseItem = this.databaseManager.findDatabaseItem(vscode_1.Uri.parse(msg.databaseUri));
                    if (databaseItem !== undefined) {
                        await this.showResultsAsDiagnostics(msg.origResultsPaths, msg.metadata, databaseItem);
                    }
                }
                else {
                    // TODO: Only clear diagnostics on the same database.
                    this._diagnosticCollection.clear();
                }
                break;
            }
            case "resultViewLoaded":
                this._panelLoaded = true;
                this._panelLoadedCallBacks.forEach(cb => cb());
                this._panelLoadedCallBacks = [];
                break;
            case "changeSort":
                await this.changeSortState(query => query.updateSortState(this.cliServer, msg.resultSetName, msg.sortState));
                break;
            case "changeInterpretedSort":
                await this.changeSortState(query => query.updateInterpretedSortState(this.cliServer, msg.sortState));
                break;
            case "changePage":
                await this.showPageOfResults(msg.selectedTable, msg.pageNumber);
                break;
            default:
                helpers_pure_1.assertNever(msg);
        }
    }
    postMessage(msg) {
        return this.getPanel().webview.postMessage(msg);
    }
    waitForPanelLoaded() {
        return new Promise(resolve => {
            if (this._panelLoaded) {
                resolve();
            }
            else {
                this._panelLoadedCallBacks.push(resolve);
            }
        });
    }
    /**
    * Show query results in webview panel.
    * @param results Evaluation info for the executed query.
    * @param shouldKeepOldResultsWhileRendering Should keep old results while rendering.
    * @param forceReveal Force the webview panel to be visible and
    * Appropriate when the user has just performed an explicit
    * UI interaction requesting results, e.g. clicking on a query
    * history entry.
    */
    async showResults(results, forceReveal, shouldKeepOldResultsWhileRendering = false) {
        if (results.result.resultType !== messages.QueryResultType.SUCCESS) {
            return;
        }
        const interpretation = await this.interpretResultsInfo(results.query, results.interpretedResultsSortState);
        const sortedResultsMap = {};
        results.sortedResultsInfo.forEach((v, k) => (sortedResultsMap[k] = this.convertPathPropertiesToWebviewUris(v)));
        this._displayedQuery = results;
        this._interpretation = interpretation;
        const panel = this.getPanel();
        await this.waitForPanelLoaded();
        if (forceReveal === WebviewReveal.Forced) {
            panel.reveal(undefined, true);
        }
        else if (!panel.visible) {
            // The results panel exists, (`.getPanel()` guarantees it) but
            // is not visible; it's in a not-currently-viewed tab. Show a
            // more asynchronous message to not so abruptly interrupt
            // user's workflow by immediately revealing the panel.
            const showButton = "View Results";
            const queryName = results.queryName;
            const resultPromise = vscode.window.showInformationMessage(`Finished running query ${queryName.length > 0 ? ` "${queryName}"` : ""}.`, showButton);
            // Address this click asynchronously so we still update the
            // query history immediately.
            resultPromise.then(result => {
                if (result === showButton) {
                    panel.reveal();
                }
            });
        }
        const getParsedResultSets = async () => {
            var _a;
            if (config_1.EXPERIMENTAL_BQRS_SETTING.getValue()) {
                const schemas = await this.cliServer.bqrsInfo(results.query.resultsPaths.resultsPath, interface_types_1.RAW_RESULTS_PAGE_SIZE);
                const resultSetNames = schemas["result-sets"].map(resultSet => resultSet.name);
                // This may not wind up being the page we actually show, if there are interpreted results,
                // but speculatively send it anyway.
                const selectedTable = interface_utils_1.getDefaultResultSetName(resultSetNames);
                const schema = schemas["result-sets"].find(resultSet => resultSet.name == selectedTable);
                if (schema === undefined) {
                    return { t: 'WebviewParsed' };
                }
                const chunk = await this.cliServer.bqrsDecode(results.query.resultsPaths.resultsPath, schema.name, interface_types_1.RAW_RESULTS_PAGE_SIZE, (_a = schema.pagination) === null || _a === void 0 ? void 0 : _a.offsets[0]);
                const adaptedSchema = adapt_1.adaptSchema(schema);
                const resultSet = adapt_1.adaptBqrs(adaptedSchema, chunk);
                return {
                    t: 'ExtensionParsed',
                    pageNumber: 0,
                    numPages: numPagesOfResultSet(resultSet),
                    resultSet,
                    selectedTable: undefined,
                    resultSetNames
                };
            }
            else {
                return { t: 'WebviewParsed' };
            }
        };
        await this.postMessage({
            t: "setState",
            interpretation,
            origResultsPaths: results.query.resultsPaths,
            resultsPath: this.convertPathToWebviewUri(results.query.resultsPaths.resultsPath),
            parsedResultSets: await getParsedResultSets(),
            sortedResultsMap,
            database: results.database,
            shouldKeepOldResultsWhileRendering,
            metadata: results.query.metadata
        });
    }
    /**
     * Show a page of raw results from the chosen table.
     */
    async showPageOfResults(selectedTable, pageNumber) {
        var _a;
        const results = this._displayedQuery;
        if (results === undefined) {
            throw new Error('trying to view a page of a query that is not loaded');
        }
        const sortedResultsMap = {};
        results.sortedResultsInfo.forEach((v, k) => (sortedResultsMap[k] = this.convertPathPropertiesToWebviewUris(v)));
        const schemas = await this.cliServer.bqrsInfo(results.query.resultsPaths.resultsPath, interface_types_1.RAW_RESULTS_PAGE_SIZE);
        const resultSetNames = schemas["result-sets"].map(resultSet => resultSet.name);
        const schema = schemas["result-sets"].find(resultSet => resultSet.name == selectedTable);
        if (schema === undefined)
            throw new Error(`Query result set '${selectedTable}' not found.`);
        const chunk = await this.cliServer.bqrsDecode(results.query.resultsPaths.resultsPath, schema.name, interface_types_1.RAW_RESULTS_PAGE_SIZE, (_a = schema.pagination) === null || _a === void 0 ? void 0 : _a.offsets[pageNumber]);
        const adaptedSchema = adapt_1.adaptSchema(schema);
        const resultSet = adapt_1.adaptBqrs(adaptedSchema, chunk);
        const parsedResultSets = {
            t: 'ExtensionParsed',
            pageNumber,
            resultSet,
            numPages: numPagesOfResultSet(resultSet),
            selectedTable: selectedTable,
            resultSetNames
        };
        await this.postMessage({
            t: "setState",
            interpretation: this._interpretation,
            origResultsPaths: results.query.resultsPaths,
            resultsPath: this.convertPathToWebviewUri(results.query.resultsPaths.resultsPath),
            parsedResultSets,
            sortedResultsMap,
            database: results.database,
            shouldKeepOldResultsWhileRendering: false,
            metadata: results.query.metadata
        });
    }
    async getTruncatedResults(metadata, resultsPaths, sourceInfo, sourceLocationPrefix, sortState) {
        const sarif = await query_results_1.interpretResults(this.cliServer, metadata, resultsPaths, sourceInfo);
        // For performance reasons, limit the number of results we try
        // to serialize and send to the webview. TODO: possibly also
        // limit number of paths per result, number of steps per path,
        // or throw an error if we are in aggregate trying to send
        // massively too much data, as it can make the extension
        // unresponsive.
        let numTruncatedResults = 0;
        sarif.runs.forEach(run => {
            if (run.results !== undefined) {
                sortInterpretedResults(run.results, sortState);
                if (run.results.length > interface_types_1.INTERPRETED_RESULTS_PER_RUN_LIMIT) {
                    numTruncatedResults +=
                        run.results.length - interface_types_1.INTERPRETED_RESULTS_PER_RUN_LIMIT;
                    run.results = run.results.slice(0, interface_types_1.INTERPRETED_RESULTS_PER_RUN_LIMIT);
                }
            }
        });
        return {
            sarif,
            sourceLocationPrefix,
            numTruncatedResults,
            sortState
        };
    }
    async interpretResultsInfo(query, sortState) {
        let interpretation = undefined;
        if ((await query.canHaveInterpretedResults()) &&
            query.quickEvalPosition === undefined // never do results interpretation if quickEval
        ) {
            try {
                const sourceLocationPrefix = await query.dbItem.getSourceLocationPrefix(this.cliServer);
                const sourceArchiveUri = query.dbItem.sourceArchive;
                const sourceInfo = sourceArchiveUri === undefined
                    ? undefined
                    : {
                        sourceArchive: sourceArchiveUri.fsPath,
                        sourceLocationPrefix
                    };
                interpretation = await this.getTruncatedResults(query.metadata, query.resultsPaths, sourceInfo, sourceLocationPrefix, sortState);
            }
            catch (e) {
                // If interpretation fails, accept the error and continue
                // trying to render uninterpreted results anyway.
                this.logger.log(`Exception during results interpretation: ${e.message}. Will show raw results instead.`);
            }
        }
        return interpretation;
    }
    async showResultsAsDiagnostics(resultsInfo, metadata, database) {
        const sourceLocationPrefix = await database.getSourceLocationPrefix(this.cliServer);
        const sourceArchiveUri = database.sourceArchive;
        const sourceInfo = sourceArchiveUri === undefined
            ? undefined
            : {
                sourceArchive: sourceArchiveUri.fsPath,
                sourceLocationPrefix
            };
        const interpretation = await this.getTruncatedResults(metadata, resultsInfo, sourceInfo, sourceLocationPrefix, undefined);
        try {
            await this.showProblemResultsAsDiagnostics(interpretation, database);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : e.toString();
            this.logger.log(`Exception while computing problem results as diagnostics: ${msg}`);
            this._diagnosticCollection.clear();
        }
    }
    async showProblemResultsAsDiagnostics(interpretation, databaseItem) {
        const { sarif, sourceLocationPrefix } = interpretation;
        if (!sarif.runs || !sarif.runs[0].results) {
            this.logger.log("Didn't find a run in the sarif results. Error processing sarif?");
            return;
        }
        const diagnostics = [];
        for (const result of sarif.runs[0].results) {
            const message = result.message.text;
            if (message === undefined) {
                this.logger.log("Sarif had result without plaintext message");
                continue;
            }
            if (!result.locations) {
                this.logger.log("Sarif had result without location");
                continue;
            }
            const sarifLoc = sarif_utils_1.parseSarifLocation(result.locations[0], sourceLocationPrefix);
            if (sarifLoc.t == "NoLocation") {
                continue;
            }
            const resultLocation = tryResolveLocation(sarifLoc, databaseItem);
            if (!resultLocation) {
                this.logger.log("Sarif location was not resolvable " + sarifLoc);
                continue;
            }
            const parsedMessage = sarif_utils_1.parseSarifPlainTextMessage(message);
            const relatedInformation = [];
            const relatedLocationsById = {};
            for (const loc of result.relatedLocations || []) {
                relatedLocationsById[loc.id] = loc;
            }
            const resultMessageChunks = [];
            for (const section of parsedMessage) {
                if (typeof section === "string") {
                    resultMessageChunks.push(section);
                }
                else {
                    resultMessageChunks.push(section.text);
                    const sarifChunkLoc = sarif_utils_1.parseSarifLocation(relatedLocationsById[section.dest], sourceLocationPrefix);
                    if (sarifChunkLoc.t == "NoLocation") {
                        continue;
                    }
                    const referenceLocation = tryResolveLocation(sarifChunkLoc, databaseItem);
                    if (referenceLocation) {
                        const related = new vscode_1.DiagnosticRelatedInformation(referenceLocation, section.text);
                        relatedInformation.push(related);
                    }
                }
            }
            const diagnostic = new vscode_1.Diagnostic(resultLocation.range, resultMessageChunks.join(""), vscode_1.DiagnosticSeverity.Warning);
            diagnostic.relatedInformation = relatedInformation;
            diagnostics.push([resultLocation.uri, [diagnostic]]);
        }
        this._diagnosticCollection.set(diagnostics);
    }
    convertPathToWebviewUri(path) {
        return fileUriToWebviewUri(this.getPanel(), vscode_1.Uri.file(path));
    }
    convertPathPropertiesToWebviewUris(info) {
        return {
            resultsPath: this.convertPathToWebviewUri(info.resultsPath),
            sortState: info.sortState
        };
    }
    handleSelectionChange(event) {
        if (event.kind === vscode.TextEditorSelectionChangeKind.Command) {
            return; // Ignore selection events we caused ourselves.
        }
        const editor = vscode.window.activeTextEditor;
        if (editor !== undefined) {
            editor.setDecorations(shownLocationDecoration, []);
            editor.setDecorations(shownLocationLineDecoration, []);
        }
    }
}
exports.InterfaceManager = InterfaceManager;
const findMatchBackground = new vscode.ThemeColor('editor.findMatchBackground');
const findRangeHighlightBackground = new vscode.ThemeColor('editor.findRangeHighlightBackground');
const shownLocationDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: findMatchBackground,
});
const shownLocationLineDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: findRangeHighlightBackground,
    isWholeLine: true
});
async function showLocation(loc, databaseItem) {
    const resolvedLocation = tryResolveLocation(loc, databaseItem);
    if (resolvedLocation) {
        const doc = await vscode_1.workspace.openTextDocument(resolvedLocation.uri);
        const editorsWithDoc = vscode_1.window.visibleTextEditors.filter(e => e.document === doc);
        const editor = editorsWithDoc.length > 0
            ? editorsWithDoc[0]
            : await vscode_1.window.showTextDocument(doc, vscode.ViewColumn.One);
        const range = resolvedLocation.range;
        // When highlighting the range, vscode's occurrence-match and bracket-match highlighting will
        // trigger based on where we place the cursor/selection, and will compete for the user's attention.
        // For reference:
        // - Occurences are highlighted when the cursor is next to or inside a word or a whole word is selected.
        // - Brackets are highlighted when the cursor is next to a bracket and there is an empty selection.
        // - Multi-line selections explicitly highlight line-break characters, but multi-line decorators do not.
        //
        // For single-line ranges, select the whole range, mainly to disable bracket highlighting.
        // For multi-line ranges, place the cursor at the beginning to avoid visual artifacts from selected line-breaks.
        // Multi-line ranges are usually large enough to overshadow the noise from bracket highlighting.
        const selectionEnd = (range.start.line === range.end.line)
            ? range.end
            : range.start;
        editor.selection = new vscode.Selection(range.start, selectionEnd);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.setDecorations(shownLocationDecoration, [range]);
        editor.setDecorations(shownLocationLineDecoration, [range]);
    }
}
/**
 * Resolves the specified CodeQL location to a URI into the source archive.
 * @param loc CodeQL location to resolve. Must have a non-empty value for `loc.file`.
 * @param databaseItem Database in which to resolve the file location.
 */
function resolveFivePartLocation(loc, databaseItem) {
    // `Range` is a half-open interval, and is zero-based. CodeQL locations are closed intervals, and
    // are one-based. Adjust accordingly.
    const range = new vscode_1.Range(Math.max(0, loc.lineStart - 1), Math.max(0, loc.colStart - 1), Math.max(0, loc.lineEnd - 1), Math.max(0, loc.colEnd));
    return new vscode_1.Location(databaseItem.resolveSourceFile(loc.file), range);
}
/**
 * Resolves the specified CodeQL filesystem resource location to a URI into the source archive.
 * @param loc CodeQL location to resolve, corresponding to an entire filesystem resource. Must have a non-empty value for `loc.file`.
 * @param databaseItem Database in which to resolve the filesystem resource location.
 */
function resolveWholeFileLocation(loc, databaseItem) {
    // A location corresponding to the start of the file.
    const range = new vscode_1.Range(0, 0, 0, 0);
    return new vscode_1.Location(databaseItem.resolveSourceFile(loc.file), range);
}
/**
 * Try to resolve the specified CodeQL location to a URI into the source archive. If no exact location
 * can be resolved, returns `undefined`.
 * @param loc CodeQL location to resolve
 * @param databaseItem Database in which to resolve the file location.
 */
function tryResolveLocation(loc, databaseItem) {
    const resolvableLoc = semmle_bqrs_1.tryGetResolvableLocation(loc);
    if (resolvableLoc === undefined) {
        return undefined;
    }
    switch (resolvableLoc.t) {
        case semmle_bqrs_1.LocationStyle.FivePart:
            return resolveFivePartLocation(resolvableLoc, databaseItem);
        case semmle_bqrs_1.LocationStyle.WholeFile:
            return resolveWholeFileLocation(resolvableLoc, databaseItem);
        default:
            return undefined;
    }
}

//# sourceMappingURL=interface.js.map
