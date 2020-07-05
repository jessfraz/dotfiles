"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const helpers = require("./helpers");
const logging_1 = require("./logging");
const messages = require("./messages");
const run_queries_1 = require("./run-queries");
/**
 * Maximum number of lines to include from database upgrade message,
 * to work around the fact that we can't guarantee a scrollable text
 * box for it when displaying in dialog boxes.
 */
const MAX_UPGRADE_MESSAGE_LINES = 10;
/**
 * Checks whether the given database can be upgraded to the given target DB scheme,
 * and whether the user wants to proceed with the upgrade.
 * Reports errors to both the user and the console.
 * @returns the `UpgradeParams` needed to start the upgrade, if the upgrade is possible and was confirmed by the user, or `undefined` otherwise.
 */
async function checkAndConfirmDatabaseUpgrade(qs, db, targetDbScheme, upgradesDirectories) {
    if (db.contents === undefined || db.contents.dbSchemeUri === undefined) {
        helpers.showAndLogErrorMessage("Database is invalid, and cannot be upgraded.");
        return;
    }
    const params = {
        fromDbscheme: db.contents.dbSchemeUri.fsPath,
        toDbscheme: targetDbScheme.fsPath,
        additionalUpgrades: upgradesDirectories.map(uri => uri.fsPath)
    };
    let checkUpgradeResult;
    try {
        qs.logger.log('Checking database upgrade...');
        checkUpgradeResult = await checkDatabaseUpgrade(qs, params);
    }
    catch (e) {
        helpers.showAndLogErrorMessage(`Database cannot be upgraded: ${e}`);
        return;
    }
    finally {
        qs.logger.log('Done checking database upgrade.');
    }
    const checkedUpgrades = checkUpgradeResult.checkedUpgrades;
    if (checkedUpgrades === undefined) {
        const error = checkUpgradeResult.upgradeError || '[no error message available]';
        await helpers.showAndLogErrorMessage(`Database cannot be upgraded: ${error}`);
        return;
    }
    if (checkedUpgrades.scripts.length === 0) {
        await helpers.showAndLogInformationMessage('Database is already up to date; nothing to do.');
        return;
    }
    let curSha = checkedUpgrades.initialSha;
    let descriptionMessage = '';
    for (const script of checkedUpgrades.scripts) {
        descriptionMessage += `Would perform upgrade: ${script.description}\n`;
        descriptionMessage += `\t-> Compatibility: ${script.compatibility}\n`;
        curSha = script.newSha;
    }
    const targetSha = checkedUpgrades.targetSha;
    if (curSha != targetSha) {
        // Newlines aren't rendered in notifications: https://github.com/microsoft/vscode/issues/48900
        // A modal dialog would be rendered better, but is more intrusive.
        await helpers.showAndLogErrorMessage(`Database cannot be upgraded to the target database scheme.
    Can upgrade from ${checkedUpgrades.initialSha} (current) to ${curSha}, but cannot reach ${targetSha} (target).`);
        // TODO: give a more informative message if we think the DB is ahead of the target DB scheme
        return;
    }
    logging_1.logger.log(descriptionMessage);
    // Ask the user to confirm the upgrade.
    const showLogItem = { title: 'No, Show Changes', isCloseAffordance: true };
    const yesItem = { title: 'Yes', isCloseAffordance: false };
    const noItem = { title: 'No', isCloseAffordance: true };
    const dialogOptions = [yesItem, noItem];
    let messageLines = descriptionMessage.split('\n');
    if (messageLines.length > MAX_UPGRADE_MESSAGE_LINES) {
        messageLines = messageLines.slice(0, MAX_UPGRADE_MESSAGE_LINES);
        messageLines.push(`The list of upgrades was truncated, click "No, Show Changes" to see the full list.`);
        dialogOptions.push(showLogItem);
    }
    const message = `Should the database ${db.databaseUri.fsPath} be upgraded?\n\n${messageLines.join("\n")}`;
    const chosenItem = await vscode.window.showInformationMessage(message, { modal: true }, ...dialogOptions);
    if (chosenItem === showLogItem) {
        logging_1.logger.outputChannel.show();
    }
    if (chosenItem === yesItem) {
        return params;
    }
    else {
        throw new run_queries_1.UserCancellationException('User cancelled the database upgrade.');
    }
}
/**
 * Command handler for 'Upgrade Database'.
 * Attempts to upgrade the given database to the given target DB scheme, using the given directory of upgrades.
 * First performs a dry-run and prompts the user to confirm the upgrade.
 * Reports errors during compilation and evaluation of upgrades to the user.
 */
async function upgradeDatabase(qs, db, targetDbScheme, upgradesDirectories) {
    const upgradeParams = await checkAndConfirmDatabaseUpgrade(qs, db, targetDbScheme, upgradesDirectories);
    if (upgradeParams === undefined) {
        return;
    }
    let compileUpgradeResult;
    try {
        compileUpgradeResult = await compileDatabaseUpgrade(qs, upgradeParams);
    }
    catch (e) {
        helpers.showAndLogErrorMessage(`Compilation of database upgrades failed: ${e}`);
        return;
    }
    finally {
        qs.logger.log('Done compiling database upgrade.');
    }
    if (compileUpgradeResult.compiledUpgrades === undefined) {
        const error = compileUpgradeResult.error || '[no error message available]';
        helpers.showAndLogErrorMessage(`Compilation of database upgrades failed: ${error}`);
        return;
    }
    try {
        qs.logger.log('Running the following database upgrade:');
        qs.logger.log(compileUpgradeResult.compiledUpgrades.scripts.map(s => s.description.description).join('\n'));
        return await runDatabaseUpgrade(qs, db, compileUpgradeResult.compiledUpgrades);
    }
    catch (e) {
        helpers.showAndLogErrorMessage(`Database upgrade failed: ${e}`);
        return;
    }
    finally {
        qs.logger.log('Done running database upgrade.');
    }
}
exports.upgradeDatabase = upgradeDatabase;
async function checkDatabaseUpgrade(qs, upgradeParams) {
    return helpers.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Checking for database upgrades",
        cancellable: true,
    }, (progress, token) => qs.sendRequest(messages.checkUpgrade, upgradeParams, token, progress));
}
async function compileDatabaseUpgrade(qs, upgradeParams) {
    const params = {
        upgrade: upgradeParams,
        upgradeTempDir: run_queries_1.upgradesTmpDir.name
    };
    return helpers.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Compiling database upgrades",
        cancellable: true,
    }, (progress, token) => qs.sendRequest(messages.compileUpgrade, params, token, progress));
}
async function runDatabaseUpgrade(qs, db, upgrades) {
    if (db.contents === undefined || db.contents.datasetUri === undefined) {
        throw new Error('Can\'t upgrade an invalid database.');
    }
    const database = {
        dbDir: db.contents.datasetUri.fsPath,
        workingSet: 'default'
    };
    const params = {
        db: database,
        timeoutSecs: qs.config.timeoutSecs,
        toRun: upgrades
    };
    return helpers.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running database upgrades",
        cancellable: true,
    }, (progress, token) => qs.sendRequest(messages.runUpgrade, params, token, progress));
}

//# sourceMappingURL=upgrades.js.map
