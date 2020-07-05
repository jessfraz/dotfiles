"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode_test_adapter_api_1 = require("vscode-test-adapter-api");
const archiveFilesystemProvider = require("./archive-filesystem-provider");
const cli_1 = require("./cli");
const config_1 = require("./config");
const languageSupport = require("./languageSupport");
const databases_1 = require("./databases");
const databases_ui_1 = require("./databases-ui");
const definitions_1 = require("./definitions");
const distribution_1 = require("./distribution");
const helpers = require("./helpers");
const helpers_pure_1 = require("./helpers-pure");
const ide_server_1 = require("./ide-server");
const interface_1 = require("./interface");
const logging_1 = require("./logging");
const query_history_1 = require("./query-history");
const qsClient = require("./queryserver-client");
const quick_query_1 = require("./quick-query");
const run_queries_1 = require("./run-queries");
const test_adapter_1 = require("./test-adapter");
const test_ui_1 = require("./test-ui");
/**
 * extension.ts
 * ------------
 *
 * A vscode extension for CodeQL query development.
 */
/**
 * Holds when we have proceeded past the initial phase of extension activation in which
 * we are trying to ensure that a valid CodeQL distribution exists, and we're actually setting
 * up the bulk of the extension.
 */
let beganMainExtensionActivation = false;
/**
 * A list of vscode-registered-command disposables that contain
 * temporary stub handlers for commands that exist package.json (hence
 * are already connected to onscreen ui elements) but which will not
 * have any useful effect if we haven't located a CodeQL distribution.
 */
const errorStubs = [];
/**
 * Holds when we are installing or checking for updates to the distribution.
 */
let isInstallingOrUpdatingDistribution = false;
/**
 * If the user tries to execute vscode commands after extension activation is failed, give
 * a sensible error message.
 *
 * @param excludedCommands List of commands for which we should not register error stubs.
 */
function registerErrorStubs(excludedCommands, stubGenerator) {
    // Remove existing stubs
    errorStubs.forEach(stub => stub.dispose());
    const extensionId = 'GitHub.vscode-codeql'; // TODO: Is there a better way of obtaining this?
    const extension = vscode_1.extensions.getExtension(extensionId);
    if (extension === undefined) {
        throw new Error(`Can't find extension ${extensionId}`);
    }
    const stubbedCommands = extension.packageJSON.contributes.commands.map((entry) => entry.command);
    stubbedCommands.forEach(command => {
        if (excludedCommands.indexOf(command) === -1) {
            errorStubs.push(vscode_1.commands.registerCommand(command, stubGenerator(command)));
        }
    });
}
async function activate(ctx) {
    logging_1.logger.log('Starting CodeQL extension');
    initializeLogging(ctx);
    languageSupport.install();
    const distributionConfigListener = new config_1.DistributionConfigListener();
    ctx.subscriptions.push(distributionConfigListener);
    const codeQlVersionRange = distribution_1.DEFAULT_DISTRIBUTION_VERSION_RANGE;
    const distributionManager = new distribution_1.DistributionManager(ctx, distributionConfigListener, codeQlVersionRange);
    const shouldUpdateOnNextActivationKey = "shouldUpdateOnNextActivation";
    registerErrorStubs([checkForUpdatesCommand], command => () => {
        helpers.showAndLogErrorMessage(`Can't execute ${command}: waiting to finish loading CodeQL CLI.`);
    });
    async function installOrUpdateDistributionWithProgressTitle(progressTitle, config) {
        const minSecondsSinceLastUpdateCheck = config.isUserInitiated ? 0 : 86400;
        const noUpdatesLoggingFunc = config.shouldDisplayMessageWhenNoUpdates ?
            helpers.showAndLogInformationMessage : async (message) => logging_1.logger.log(message);
        const result = await distributionManager.checkForUpdatesToExtensionManagedDistribution(minSecondsSinceLastUpdateCheck);
        // We do want to auto update if there is no distribution at all
        const allowAutoUpdating = config.allowAutoUpdating || !await distributionManager.hasDistribution();
        switch (result.kind) {
            case distribution_1.DistributionUpdateCheckResultKind.AlreadyCheckedRecentlyResult:
                logging_1.logger.log("Didn't perform CodeQL CLI update check since a check was already performed within the previous " +
                    `${minSecondsSinceLastUpdateCheck} seconds.`);
                break;
            case distribution_1.DistributionUpdateCheckResultKind.AlreadyUpToDate:
                await noUpdatesLoggingFunc('CodeQL CLI already up to date.');
                break;
            case distribution_1.DistributionUpdateCheckResultKind.InvalidLocation:
                await noUpdatesLoggingFunc('CodeQL CLI is installed externally so could not be updated.');
                break;
            case distribution_1.DistributionUpdateCheckResultKind.UpdateAvailable:
                if (beganMainExtensionActivation || !allowAutoUpdating) {
                    const updateAvailableMessage = `Version "${result.updatedRelease.name}" of the CodeQL CLI is now available. ` +
                        'Do you wish to upgrade?';
                    await ctx.globalState.update(shouldUpdateOnNextActivationKey, true);
                    if (await helpers.showInformationMessageWithAction(updateAvailableMessage, 'Restart and Upgrade')) {
                        await vscode_1.commands.executeCommand('workbench.action.reloadWindow');
                    }
                }
                else {
                    const progressOptions = {
                        location: vscode_1.ProgressLocation.Notification,
                        title: progressTitle,
                        cancellable: false,
                    };
                    await helpers.withProgress(progressOptions, progress => distributionManager.installExtensionManagedDistributionRelease(result.updatedRelease, progress));
                    await ctx.globalState.update(shouldUpdateOnNextActivationKey, false);
                    helpers.showAndLogInformationMessage(`CodeQL CLI updated to version "${result.updatedRelease.name}".`);
                }
                break;
            default:
                helpers_pure_1.assertNever(result);
        }
    }
    async function installOrUpdateDistribution(config) {
        if (isInstallingOrUpdatingDistribution) {
            throw new Error("Already installing or updating CodeQL CLI");
        }
        isInstallingOrUpdatingDistribution = true;
        const codeQlInstalled = await distributionManager.getCodeQlPathWithoutVersionCheck() !== undefined;
        const willUpdateCodeQl = ctx.globalState.get(shouldUpdateOnNextActivationKey);
        const messageText = willUpdateCodeQl
            ? "Updating CodeQL CLI"
            : codeQlInstalled
                ? "Checking for updates to CodeQL CLI"
                : "Installing CodeQL CLI";
        try {
            await installOrUpdateDistributionWithProgressTitle(messageText, config);
        }
        catch (e) {
            // Don't rethrow the exception, because if the config is changed, we want to be able to retry installing
            // or updating the distribution.
            const alertFunction = (codeQlInstalled && !config.isUserInitiated) ?
                helpers.showAndLogWarningMessage : helpers.showAndLogErrorMessage;
            const taskDescription = (willUpdateCodeQl ? "update" :
                codeQlInstalled ? "check for updates to" : "install") + " CodeQL CLI";
            if (e instanceof distribution_1.GithubRateLimitedError) {
                alertFunction(`Rate limited while trying to ${taskDescription}. Please try again after ` +
                    `your rate limit window resets at ${e.rateLimitResetDate.toLocaleString()}.`);
            }
            else if (e instanceof distribution_1.GithubApiError) {
                alertFunction(`Encountered GitHub API error while trying to ${taskDescription}. ` + e);
            }
            alertFunction(`Unable to ${taskDescription}. ` + e);
        }
        finally {
            isInstallingOrUpdatingDistribution = false;
        }
    }
    async function getDistributionDisplayingDistributionWarnings() {
        const result = await distributionManager.getDistribution();
        switch (result.kind) {
            case distribution_1.FindDistributionResultKind.CompatibleDistribution:
                logging_1.logger.log(`Found compatible version of CodeQL CLI (version ${result.version.raw})`);
                break;
            case distribution_1.FindDistributionResultKind.IncompatibleDistribution: {
                const fixGuidanceMessage = (() => {
                    switch (result.distribution.kind) {
                        case distribution_1.DistributionKind.ExtensionManaged:
                            return "Please update the CodeQL CLI by running the \"CodeQL: Check for CLI Updates\" command.";
                        case distribution_1.DistributionKind.CustomPathConfig:
                            return `Please update the \"CodeQL CLI Executable Path\" setting to point to a CLI in the version range ${codeQlVersionRange}.`;
                        case distribution_1.DistributionKind.PathEnvironmentVariable:
                            return `Please update the CodeQL CLI on your PATH to a version compatible with ${codeQlVersionRange}, or ` +
                                `set the \"CodeQL CLI Executable Path\" setting to the path of a CLI version compatible with ${codeQlVersionRange}.`;
                    }
                })();
                helpers.showAndLogWarningMessage(`The current version of the CodeQL CLI (${result.version.raw}) ` +
                    "is incompatible with this extension. " + fixGuidanceMessage);
                break;
            }
            case distribution_1.FindDistributionResultKind.UnknownCompatibilityDistribution:
                helpers.showAndLogWarningMessage("Compatibility with the configured CodeQL CLI could not be determined. " +
                    "You may experience problems using the extension.");
                break;
            case distribution_1.FindDistributionResultKind.NoDistribution:
                helpers.showAndLogErrorMessage("The CodeQL CLI could not be found.");
                break;
            default:
                helpers_pure_1.assertNever(result);
        }
        return result;
    }
    async function installOrUpdateThenTryActivate(config) {
        await installOrUpdateDistribution(config);
        // Display the warnings even if the extension has already activated.
        const distributionResult = await getDistributionDisplayingDistributionWarnings();
        if (!beganMainExtensionActivation && distributionResult.kind !== distribution_1.FindDistributionResultKind.NoDistribution) {
            await activateWithInstalledDistribution(ctx, distributionManager);
        }
        else if (distributionResult.kind === distribution_1.FindDistributionResultKind.NoDistribution) {
            registerErrorStubs([checkForUpdatesCommand], command => async () => {
                const installActionName = "Install CodeQL CLI";
                const chosenAction = await helpers.showAndLogErrorMessage(`Can't execute ${command}: missing CodeQL CLI.`, {
                    items: [installActionName]
                });
                if (chosenAction === installActionName) {
                    installOrUpdateThenTryActivate({
                        isUserInitiated: true,
                        shouldDisplayMessageWhenNoUpdates: false,
                        allowAutoUpdating: true
                    });
                }
            });
        }
    }
    ctx.subscriptions.push(distributionConfigListener.onDidChangeDistributionConfiguration(() => installOrUpdateThenTryActivate({
        isUserInitiated: true,
        shouldDisplayMessageWhenNoUpdates: false,
        allowAutoUpdating: true
    })));
    ctx.subscriptions.push(vscode_1.commands.registerCommand(checkForUpdatesCommand, () => installOrUpdateThenTryActivate({
        isUserInitiated: true,
        shouldDisplayMessageWhenNoUpdates: true,
        allowAutoUpdating: true
    })));
    await installOrUpdateThenTryActivate({
        isUserInitiated: !!ctx.globalState.get(shouldUpdateOnNextActivationKey),
        shouldDisplayMessageWhenNoUpdates: false,
        // only auto update on startup if the user has previously requested an update
        // otherwise, ask user to accept the update
        allowAutoUpdating: !!ctx.globalState.get(shouldUpdateOnNextActivationKey)
    });
}
exports.activate = activate;
async function activateWithInstalledDistribution(ctx, distributionManager) {
    beganMainExtensionActivation = true;
    // Remove any error stubs command handlers left over from first part
    // of activation.
    errorStubs.forEach(stub => stub.dispose());
    logging_1.logger.log('Initializing configuration listener...');
    const qlConfigurationListener = await config_1.QueryServerConfigListener.createQueryServerConfigListener(distributionManager);
    ctx.subscriptions.push(qlConfigurationListener);
    logging_1.logger.log('Initializing CodeQL cli server...');
    const cliServer = new cli_1.CodeQLCliServer(distributionManager, logging_1.logger);
    ctx.subscriptions.push(cliServer);
    logging_1.logger.log('Initializing query server client.');
    const qs = new qsClient.QueryServerClient(qlConfigurationListener, cliServer, {
        logger: logging_1.queryServerLogger,
    }, task => vscode_1.window.withProgress({ title: 'CodeQL query server', location: vscode_1.ProgressLocation.Window }, task));
    ctx.subscriptions.push(qs);
    await qs.startQueryServer();
    logging_1.logger.log('Initializing database manager.');
    const dbm = new databases_1.DatabaseManager(ctx, qlConfigurationListener, logging_1.logger);
    ctx.subscriptions.push(dbm);
    logging_1.logger.log('Initializing database panel.');
    const databaseUI = new databases_ui_1.DatabaseUI(ctx, cliServer, dbm, qs, getContextStoragePath(ctx));
    ctx.subscriptions.push(databaseUI);
    logging_1.logger.log('Initializing query history manager.');
    const queryHistoryConfigurationListener = new config_1.QueryHistoryConfigListener();
    const qhm = new query_history_1.QueryHistoryManager(ctx, queryHistoryConfigurationListener, async (item) => showResultsForCompletedQuery(item, interface_1.WebviewReveal.Forced));
    logging_1.logger.log('Initializing results panel interface.');
    const intm = new interface_1.InterfaceManager(ctx, dbm, cliServer, logging_1.queryServerLogger);
    ctx.subscriptions.push(intm);
    logging_1.logger.log('Initializing source archive filesystem provider.');
    archiveFilesystemProvider.activate(ctx);
    async function showResultsForCompletedQuery(query, forceReveal) {
        await intm.showResults(query, forceReveal, false);
    }
    async function compileAndRunQuery(quickEval, selectedQuery) {
        if (qs !== undefined) {
            try {
                const dbItem = await databaseUI.getDatabaseItem();
                if (dbItem === undefined) {
                    throw new Error('Can\'t run query without a selected database');
                }
                const info = await run_queries_1.compileAndRunQueryAgainstDatabase(cliServer, qs, dbItem, quickEval, selectedQuery);
                const item = qhm.addQuery(info);
                await showResultsForCompletedQuery(item, interface_1.WebviewReveal.NotForced);
            }
            catch (e) {
                if (e instanceof run_queries_1.UserCancellationException) {
                    helpers.showAndLogWarningMessage(e.message);
                }
                else if (e instanceof Error) {
                    helpers.showAndLogErrorMessage(e.message);
                }
                else {
                    throw e;
                }
            }
        }
    }
    ctx.subscriptions.push(run_queries_1.tmpDirDisposal);
    logging_1.logger.log('Initializing CodeQL language server.');
    const client = new vscode_languageclient_1.LanguageClient('CodeQL Language Server', () => ide_server_1.spawnIdeServer(qlConfigurationListener), {
        documentSelector: [
            { language: 'ql', scheme: 'file' },
            { language: 'yaml', scheme: 'file', pattern: '**/qlpack.yml' }
        ],
        synchronize: {
            configurationSection: 'codeQL'
        },
        // Ensure that language server exceptions are logged to the same channel as its output.
        outputChannel: logging_1.ideServerLogger.outputChannel
    }, true);
    logging_1.logger.log('Initializing QLTest interface.');
    const testExplorerExtension = vscode_1.extensions.getExtension(vscode_test_adapter_api_1.testExplorerExtensionId);
    if (testExplorerExtension) {
        const testHub = testExplorerExtension.exports;
        const testAdapterFactory = new test_adapter_1.QLTestAdapterFactory(testHub, cliServer);
        ctx.subscriptions.push(testAdapterFactory);
        const testUIService = new test_ui_1.TestUIService(testHub);
        ctx.subscriptions.push(testUIService);
    }
    logging_1.logger.log('Registering top-level command palette commands.');
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.runQuery', async (uri) => await compileAndRunQuery(false, uri)));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.quickEval', async (uri) => await compileAndRunQuery(true, uri)));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.quickQuery', async () => quick_query_1.displayQuickQuery(ctx, cliServer, databaseUI)));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.restartQueryServer', async () => {
        await qs.restartQueryServer();
        helpers.showAndLogInformationMessage('CodeQL Query Server restarted.', { outputLogger: logging_1.queryServerLogger });
    }));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.chooseDatabaseFolder', () => databaseUI.handleChooseDatabaseFolder()));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.chooseDatabaseArchive', () => databaseUI.handleChooseDatabaseArchive()));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.chooseDatabaseLgtm', () => databaseUI.handleChooseDatabaseLgtm()));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('codeQL.chooseDatabaseInternet', () => databaseUI.handleChooseDatabaseInternet()));
    logging_1.logger.log('Starting language server.');
    ctx.subscriptions.push(client.start());
    // Jump-to-definition and find-references
    logging_1.logger.log('Registering jump-to-definition handlers.');
    vscode_1.languages.registerDefinitionProvider({ scheme: archiveFilesystemProvider.zipArchiveScheme }, new definitions_1.TemplateQueryDefinitionProvider(cliServer, qs, dbm));
    vscode_1.languages.registerReferenceProvider({ scheme: archiveFilesystemProvider.zipArchiveScheme }, new definitions_1.TemplateQueryReferenceProvider(cliServer, qs, dbm));
    logging_1.logger.log('Successfully finished extension initialization.');
}
function getContextStoragePath(ctx) {
    return ctx.storagePath || ctx.globalStoragePath;
}
function initializeLogging(ctx) {
    const storagePath = getContextStoragePath(ctx);
    logging_1.logger.init(storagePath);
    logging_1.queryServerLogger.init(storagePath);
    logging_1.ideServerLogger.init(storagePath);
    ctx.subscriptions.push(logging_1.logger);
    ctx.subscriptions.push(logging_1.queryServerLogger);
    ctx.subscriptions.push(logging_1.ideServerLogger);
}
const checkForUpdatesCommand = 'codeQL.checkForUpdatesToCLI';

//# sourceMappingURL=extension.js.map
