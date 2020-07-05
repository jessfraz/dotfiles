"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const query_results_1 = require("./query-results");
const helpers = require("./helpers");
const logging_1 = require("./logging");
const url_1 = require("url");
const SHOW_QUERY_TEXT_MSG = `\
////////////////////////////////////////////////////////////////////////////////////
// This is the text of the entire query file when it was executed for this query  //
// run. The text or dependent libraries may have changed since then.              //
//                                                                                //
// This buffer is readonly. To re-execute this query, you must open the original  //
// query file.                                                                    //
////////////////////////////////////////////////////////////////////////////////////

`;
const SHOW_QUERY_TEXT_QUICK_EVAL_MSG = `\
////////////////////////////////////////////////////////////////////////////////////
// This is the Quick Eval selection of the query file when it was executed for    //
// this query run. The text or dependent libraries may have changed since then.   //
//                                                                                //
// This buffer is readonly. To re-execute this query, you must open the original  //
// query file.                                                                    //
////////////////////////////////////////////////////////////////////////////////////

`;
/**
 * Path to icon to display next to a failed query history item.
 */
const FAILED_QUERY_HISTORY_ITEM_ICON = 'media/red-x.svg';
/**
 * Tree data provider for the query history view.
 */
class HistoryTreeDataProvider {
    constructor(ctx) {
        this.ctx = ctx;
        /**
         * XXX: This idiom for how to get a `.fire()`-able event emitter was
         * cargo culted from another vscode extension. It seems rather
         * involved and I hope there's something better that can be done
         * instead.
         */
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.history = [];
    }
    async getTreeItem(element) {
        const it = new vscode.TreeItem(element.toString());
        it.command = {
            title: 'Query History Item',
            command: 'codeQLQueryHistory.itemClicked',
            arguments: [element],
        };
        // Mark this query history item according to whether it has a
        // SARIF file so that we can make context menu items conditionally
        // available.
        it.contextValue = await element.query.hasInterpretedResults() ? 'interpretedResultsItem' : 'rawResultsItem';
        if (!element.didRunSuccessfully) {
            it.iconPath = path.join(this.ctx.extensionPath, FAILED_QUERY_HISTORY_ITEM_ICON);
        }
        return it;
    }
    getChildren(element) {
        if (element == undefined) {
            return this.history;
        }
        else {
            return [];
        }
    }
    getParent(_element) {
        return null;
    }
    getCurrent() {
        return this.current;
    }
    push(item) {
        this.current = item;
        this.history.push(item);
        this.refresh();
    }
    setCurrentItem(item) {
        this.current = item;
    }
    remove(item) {
        if (this.current === item)
            this.current = undefined;
        const index = this.history.findIndex(i => i === item);
        if (index >= 0) {
            this.history.splice(index, 1);
            if (this.current === undefined && this.history.length > 0) {
                // Try to keep a current item, near the deleted item if there
                // are any available.
                this.current = this.history[Math.min(index, this.history.length - 1)];
            }
            this.refresh();
        }
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
/**
 * Number of milliseconds two clicks have to arrive apart to be
 * considered a double-click.
 */
const DOUBLE_CLICK_TIME = 500;
class QueryHistoryManager {
    constructor(ctx, queryHistoryConfigListener, selectedCallback) {
        this.queryHistoryConfigListener = queryHistoryConfigListener;
        this.ctx = ctx;
        this.selectedCallback = selectedCallback;
        const treeDataProvider = this.treeDataProvider = new HistoryTreeDataProvider(ctx);
        this.treeView = vscode_1.window.createTreeView('codeQLQueryHistory', { treeDataProvider });
        // Lazily update the tree view selection due to limitations of TreeView API (see
        // `updateTreeViewSelectionIfVisible` doc for details)
        this.treeView.onDidChangeVisibility(async (_ev) => this.updateTreeViewSelectionIfVisible());
        // Don't allow the selection to become empty
        this.treeView.onDidChangeSelection(async (ev) => {
            if (ev.selection.length == 0) {
                this.updateTreeViewSelectionIfVisible();
            }
        });
        logging_1.logger.log('Registering query history panel commands.');
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.openQuery', this.handleOpenQuery));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.removeHistoryItem', this.handleRemoveHistoryItem.bind(this)));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.setLabel', this.handleSetLabel.bind(this)));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.showQueryLog', this.handleShowQueryLog.bind(this)));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.showQueryText', this.handleShowQueryText.bind(this)));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.viewSarif', this.handleViewSarif.bind(this)));
        ctx.subscriptions.push(vscode.commands.registerCommand('codeQLQueryHistory.itemClicked', async (item) => {
            return this.handleItemClicked(item);
        }));
        queryHistoryConfigListener.onDidChangeQueryHistoryConfiguration(() => {
            this.treeDataProvider.refresh();
        });
        // displays query text in a read-only document
        vscode.workspace.registerTextDocumentContentProvider('codeql', {
            provideTextDocumentContent(uri) {
                const params = new url_1.URLSearchParams(uri.query);
                return (JSON.parse(params.get('isQuickEval') || '') ? SHOW_QUERY_TEXT_QUICK_EVAL_MSG : SHOW_QUERY_TEXT_MSG) + params.get('queryText');
            }
        });
    }
    async invokeCallbackOn(queryHistoryItem) {
        if (this.selectedCallback !== undefined) {
            const sc = this.selectedCallback;
            await sc(queryHistoryItem);
        }
    }
    async handleOpenQuery(queryHistoryItem) {
        const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(queryHistoryItem.query.program.queryPath));
        const editor = await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One);
        const queryText = queryHistoryItem.options.queryText;
        if (queryText !== undefined && queryHistoryItem.options.isQuickQuery) {
            await editor.edit(edit => edit.replace(textDocument.validateRange(new vscode.Range(0, 0, textDocument.lineCount, 0)), queryText));
        }
    }
    async handleRemoveHistoryItem(queryHistoryItem) {
        this.treeDataProvider.remove(queryHistoryItem);
        queryHistoryItem.dispose();
        const current = this.treeDataProvider.getCurrent();
        if (current !== undefined) {
            this.treeView.reveal(current);
            await this.invokeCallbackOn(current);
        }
    }
    async handleSetLabel(queryHistoryItem) {
        const response = await vscode.window.showInputBox({
            prompt: 'Label:',
            placeHolder: '(use default)',
            value: queryHistoryItem.getLabel(),
        });
        // undefined response means the user cancelled the dialog; don't change anything
        if (response !== undefined) {
            if (response === '')
                // Interpret empty string response as "go back to using default"
                queryHistoryItem.options.label = undefined;
            else
                queryHistoryItem.options.label = response;
            this.treeDataProvider.refresh();
        }
    }
    async handleItemClicked(queryHistoryItem) {
        this.treeDataProvider.setCurrentItem(queryHistoryItem);
        const now = new Date();
        const prevItemClick = this.lastItemClick;
        this.lastItemClick = { time: now, item: queryHistoryItem };
        if (prevItemClick !== undefined
            && (now.valueOf() - prevItemClick.time.valueOf()) < DOUBLE_CLICK_TIME
            && queryHistoryItem == prevItemClick.item) {
            // show original query file on double click
            await this.handleOpenQuery(queryHistoryItem);
        }
        else {
            // show results on single click
            await this.invokeCallbackOn(queryHistoryItem);
        }
    }
    async handleShowQueryLog(queryHistoryItem) {
        if (queryHistoryItem.logFileLocation) {
            const uri = vscode.Uri.file(queryHistoryItem.logFileLocation);
            try {
                await vscode.window.showTextDocument(uri);
            }
            catch (e) {
                if (e.message.includes('Files above 50MB cannot be synchronized with extensions')) {
                    const res = await helpers.showBinaryChoiceDialog(`VS Code does not allow extensions to open files >50MB. This file
exceeds that limit. Do you want to open it outside of VS Code?

You can also try manually opening it inside VS Code by selecting
the file in the file explorer and dragging it into the workspace.`);
                    if (res) {
                        try {
                            await vscode.commands.executeCommand('revealFileInOS', uri);
                        }
                        catch (e) {
                            helpers.showAndLogErrorMessage(e.message);
                        }
                    }
                }
                else {
                    helpers.showAndLogErrorMessage(`Could not open log file ${queryHistoryItem.logFileLocation}`);
                    logging_1.logger.log(e.message);
                    logging_1.logger.log(e.stack);
                }
            }
        }
        else {
            helpers.showAndLogWarningMessage('No log file available');
        }
    }
    async handleShowQueryText(queryHistoryItem) {
        try {
            const queryName = queryHistoryItem.queryName.endsWith('.ql') ? queryHistoryItem.queryName : queryHistoryItem.queryName + '.ql';
            const params = new url_1.URLSearchParams({
                isQuickEval: String(!!queryHistoryItem.query.quickEvalPosition),
                queryText: await this.getQueryText(queryHistoryItem)
            });
            const uri = vscode.Uri.parse(`codeql:${queryHistoryItem.query.queryID}-${queryName}?${params.toString()}`);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { preview: false });
        }
        catch (e) {
            helpers.showAndLogErrorMessage(e.message);
        }
    }
    async handleViewSarif(queryHistoryItem) {
        try {
            const hasInterpretedResults = await queryHistoryItem.query.canHaveInterpretedResults();
            if (hasInterpretedResults) {
                const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(queryHistoryItem.query.resultsPaths.interpretedResultsPath));
                await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One);
            }
            else {
                const label = queryHistoryItem.getLabel();
                helpers.showAndLogInformationMessage(`Query ${label} has no interpreted results.`);
            }
        }
        catch (e) {
            helpers.showAndLogErrorMessage(e.message);
        }
    }
    async getQueryText(queryHistoryItem) {
        if (queryHistoryItem.options.queryText) {
            return queryHistoryItem.options.queryText;
        }
        else if (queryHistoryItem.query.quickEvalPosition) {
            // capture all selected lines
            const startLine = queryHistoryItem.query.quickEvalPosition.line;
            const endLine = queryHistoryItem.query.quickEvalPosition.endLine;
            const textDocument = await vscode.workspace.openTextDocument(queryHistoryItem.query.quickEvalPosition.fileName);
            return textDocument.getText(new vscode.Range(startLine - 1, 0, endLine, 0));
        }
        else {
            return '';
        }
    }
    addQuery(info) {
        const item = new query_results_1.CompletedQuery(info, this.queryHistoryConfigListener);
        this.treeDataProvider.push(item);
        this.updateTreeViewSelectionIfVisible();
        return item;
    }
    /**
     * Update the tree view selection if the tree view is visible.
     *
     * If the tree view is not visible, we must wait until it becomes visible before updating the
     * selection. This is because the only mechanism for updating the selection of the tree view
     * has the side-effect of revealing the tree view. This changes the active sidebar to CodeQL,
     * interrupting user workflows such as writing a commit message on the source control sidebar.
     */
    updateTreeViewSelectionIfVisible() {
        if (this.treeView.visible) {
            const current = this.treeDataProvider.getCurrent();
            if (current != undefined) {
                // We must fire the onDidChangeTreeData event to ensure the current element can be selected
                // using `reveal` if the tree view was not visible when the current element was added.
                this.treeDataProvider.refresh();
                this.treeView.reveal(current);
            }
        }
    }
}
exports.QueryHistoryManager = QueryHistoryManager;

//# sourceMappingURL=query-history.js.map
