"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const glob = require("glob-promise");
const yaml = require("js-yaml");
const path = require("path");
const vscode_1 = require("vscode");
const logging_1 = require("./logging");
/**
 * This mediates between the kind of progress callbacks we want to
 * write (where we *set* current progress position and give
 * `maxSteps`) and the kind vscode progress api expects us to write
 * (which increment progress by a certain amount out of 100%)
 */
function withProgress(options, task) {
    let progressAchieved = 0;
    return vscode_1.window.withProgress(options, (progress, token) => {
        return task(p => {
            const { message, step, maxStep } = p;
            const increment = 100 * (step - progressAchieved) / maxStep;
            progressAchieved = step;
            progress.report({ message, increment });
        }, token);
    });
}
exports.withProgress = withProgress;
/**
 * Show an error message and log it to the console
 *
 * @param message The message to show.
 * @param options.outputLogger The output logger that will receive the message
 * @param options.items A set of items that will be rendered as actions in the message.
 *
 * @return A promise that resolves to the selected item or undefined when being dismissed.
 */
async function showAndLogErrorMessage(message, { outputLogger = logging_1.logger, items = [] } = {}) {
    return internalShowAndLog(message, items, outputLogger, vscode_1.window.showErrorMessage);
}
exports.showAndLogErrorMessage = showAndLogErrorMessage;
/**
 * Show a warning message and log it to the console
 *
 * @param message The message to show.
 * @param options.outputLogger The output logger that will receive the message
 * @param options.items A set of items that will be rendered as actions in the message.
 *
 * @return A promise that resolves to the selected item or undefined when being dismissed.
 */
async function showAndLogWarningMessage(message, { outputLogger = logging_1.logger, items = [] } = {}) {
    return internalShowAndLog(message, items, outputLogger, vscode_1.window.showWarningMessage);
}
exports.showAndLogWarningMessage = showAndLogWarningMessage;
/**
 * Show an information message and log it to the console
 *
 * @param message The message to show.
 * @param options.outputLogger The output logger that will receive the message
 * @param options.items A set of items that will be rendered as actions in the message.
 *
 * @return A promise that resolves to the selected item or undefined when being dismissed.
 */
async function showAndLogInformationMessage(message, { outputLogger = logging_1.logger, items = [] } = {}) {
    return internalShowAndLog(message, items, outputLogger, vscode_1.window.showInformationMessage);
}
exports.showAndLogInformationMessage = showAndLogInformationMessage;
async function internalShowAndLog(message, items, outputLogger = logging_1.logger, fn) {
    const label = 'Show Log';
    outputLogger.log(message);
    const result = await fn(message, label, ...items);
    if (result === label) {
        outputLogger.show();
    }
    return result;
}
/**
 * Opens a modal dialog for the user to make a yes/no choice.
 * @param message The message to show.
 *
 * @return `true` if the user clicks 'Yes', `false` if the user clicks 'No' or cancels the dialog.
 */
async function showBinaryChoiceDialog(message) {
    const yesItem = { title: 'Yes', isCloseAffordance: false };
    const noItem = { title: 'No', isCloseAffordance: true };
    const chosenItem = await vscode_1.window.showInformationMessage(message, { modal: true }, yesItem, noItem);
    return chosenItem === yesItem;
}
exports.showBinaryChoiceDialog = showBinaryChoiceDialog;
/**
 * Show an information message with a customisable action.
 * @param message The message to show.
 * @param actionMessage The call to action message.
 *
 * @return `true` if the user clicks the action, `false` if the user cancels the dialog.
 */
async function showInformationMessageWithAction(message, actionMessage) {
    const actionItem = { title: actionMessage, isCloseAffordance: false };
    const chosenItem = await vscode_1.window.showInformationMessage(message, actionItem);
    return chosenItem === actionItem;
}
exports.showInformationMessageWithAction = showInformationMessageWithAction;
/** Gets all active workspace folders that are on the filesystem. */
function getOnDiskWorkspaceFolders() {
    const workspaceFolders = vscode_1.workspace.workspaceFolders || [];
    const diskWorkspaceFolders = [];
    for (const workspaceFolder of workspaceFolders) {
        if (workspaceFolder.uri.scheme === "file")
            diskWorkspaceFolders.push(workspaceFolder.uri.fsPath);
    }
    return diskWorkspaceFolders;
}
exports.getOnDiskWorkspaceFolders = getOnDiskWorkspaceFolders;
/**
 * Gets a human-readable name for an evaluated query.
 * Uses metadata if it exists, and defaults to the query file name.
 */
function getQueryName(query) {
    // Queries run through quick evaluation are not usually the entire query file.
    // Label them differently and include the line numbers.
    if (query.quickEvalPosition !== undefined) {
        const { line, endLine, fileName } = query.quickEvalPosition;
        const lineInfo = line === endLine ? `${line}` : `${line}-${endLine}`;
        return `Quick evaluation of ${path.basename(fileName)}:${lineInfo}`;
    }
    else if (query.metadata && query.metadata.name) {
        return query.metadata.name;
    }
    else {
        return path.basename(query.program.queryPath);
    }
}
exports.getQueryName = getQueryName;
/**
 * Provides a utility method to invoke a function only if a minimum time interval has elapsed since
 * the last invocation of that function.
 */
class InvocationRateLimiter {
    constructor(extensionContext, funcIdentifier, func, createDate = s => s ? new Date(s) : new Date()) {
        this._createDate = createDate;
        this._extensionContext = extensionContext;
        this._func = func;
        this._funcIdentifier = funcIdentifier;
    }
    /**
     * Invoke the function if `minSecondsSinceLastInvocation` seconds have elapsed since the last invocation.
     */
    async invokeFunctionIfIntervalElapsed(minSecondsSinceLastInvocation) {
        const updateCheckStartDate = this._createDate();
        const lastInvocationDate = this.getLastInvocationDate();
        if (minSecondsSinceLastInvocation &&
            lastInvocationDate &&
            lastInvocationDate <= updateCheckStartDate &&
            lastInvocationDate.getTime() + minSecondsSinceLastInvocation * 1000 > updateCheckStartDate.getTime()) {
            return createRateLimitedResult();
        }
        const result = await this._func();
        await this.setLastInvocationDate(updateCheckStartDate);
        return createInvokedResult(result);
    }
    getLastInvocationDate() {
        const maybeDateString = this._extensionContext.globalState.get(InvocationRateLimiter._invocationRateLimiterPrefix + this._funcIdentifier);
        return maybeDateString ? this._createDate(maybeDateString) : undefined;
    }
    async setLastInvocationDate(date) {
        return await this._extensionContext.globalState.update(InvocationRateLimiter._invocationRateLimiterPrefix + this._funcIdentifier, date);
    }
}
exports.InvocationRateLimiter = InvocationRateLimiter;
InvocationRateLimiter._invocationRateLimiterPrefix = "invocationRateLimiter_lastInvocationDate_";
var InvocationRateLimiterResultKind;
(function (InvocationRateLimiterResultKind) {
    InvocationRateLimiterResultKind[InvocationRateLimiterResultKind["Invoked"] = 0] = "Invoked";
    InvocationRateLimiterResultKind[InvocationRateLimiterResultKind["RateLimited"] = 1] = "RateLimited";
})(InvocationRateLimiterResultKind = exports.InvocationRateLimiterResultKind || (exports.InvocationRateLimiterResultKind = {}));
function createInvokedResult(result) {
    return {
        kind: InvocationRateLimiterResultKind.Invoked,
        result
    };
}
function createRateLimitedResult() {
    return {
        kind: InvocationRateLimiterResultKind.RateLimited
    };
}
async function getQlPackForDbscheme(cliServer, dbschemePath) {
    const qlpacks = await cliServer.resolveQlpacks(getOnDiskWorkspaceFolders());
    const packs = Object.entries(qlpacks).map(([packName, dirs]) => {
        if (dirs.length < 1) {
            logging_1.logger.log(`In getQlPackFor ${dbschemePath}, qlpack ${packName} has no directories`);
            return { packName, packDir: undefined };
        }
        if (dirs.length > 1) {
            logging_1.logger.log(`In getQlPackFor ${dbschemePath}, qlpack ${packName} has more than one directory; arbitrarily choosing the first`);
        }
        return {
            packName,
            packDir: dirs[0]
        };
    });
    for (const { packDir, packName } of packs) {
        if (packDir !== undefined) {
            const qlpack = yaml.safeLoad(await fs.readFile(path.join(packDir, 'qlpack.yml'), 'utf8'));
            if (qlpack.dbscheme !== undefined && path.basename(qlpack.dbscheme) === path.basename(dbschemePath)) {
                return packName;
            }
        }
    }
    throw new Error(`Could not find qlpack file for dbscheme ${dbschemePath}`);
}
exports.getQlPackForDbscheme = getQlPackForDbscheme;
async function resolveDatasetFolder(cliServer, datasetFolder) {
    const dbschemes = await glob(path.join(datasetFolder, '*.dbscheme'));
    if (dbschemes.length < 1) {
        throw new Error(`Can't find dbscheme for current database in ${datasetFolder}`);
    }
    dbschemes.sort();
    const dbscheme = dbschemes[0];
    if (dbschemes.length > 1) {
        vscode_1.window.showErrorMessage(`Found multiple dbschemes in ${datasetFolder} during quick query; arbitrarily choosing the first, ${dbscheme}, to decide what library to use.`);
    }
    const qlpack = await getQlPackForDbscheme(cliServer, dbscheme);
    return { dbscheme, qlpack };
}
exports.resolveDatasetFolder = resolveDatasetFolder;
/**
 * A cached mapping from strings to value of type U.
 */
class CachedOperation {
    constructor(operation, cacheSize = 100) {
        this.cacheSize = cacheSize;
        this.operation = operation;
        this.lru = [];
        this.inProgressCallbacks = new Map();
        this.cached = new Map();
    }
    async get(t) {
        // Try and retrieve from the cache
        const fromCache = this.cached.get(t);
        if (fromCache !== undefined) {
            // Move to end of lru list
            this.lru.push(this.lru.splice(this.lru.findIndex(v => v === t), 1)[0]);
            return fromCache;
        }
        // Otherwise check if in progress
        const inProgressCallback = this.inProgressCallbacks.get(t);
        if (inProgressCallback !== undefined) {
            // If so wait for it to resolve
            return await new Promise((resolve, reject) => {
                inProgressCallback.push([resolve, reject]);
            });
        }
        // Otherwise compute the new value, but leave a callback to allow sharing work
        const callbacks = [];
        this.inProgressCallbacks.set(t, callbacks);
        try {
            const result = await this.operation(t);
            callbacks.forEach(f => f[0](result));
            this.inProgressCallbacks.delete(t);
            if (this.lru.length > this.cacheSize) {
                const toRemove = this.lru.shift();
                this.cached.delete(toRemove);
            }
            this.lru.push(t);
            this.cached.set(t, result);
            return result;
        }
        catch (e) {
            // Rethrow error on all callbacks
            callbacks.forEach(f => f[1](e));
            throw e;
        }
        finally {
            this.inProgressCallbacks.delete(t);
        }
    }
}
exports.CachedOperation = CachedOperation;

//# sourceMappingURL=helpers.js.map
