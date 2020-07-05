"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const unzipper = require("unzipper");
const vscode_1 = require("vscode");
const fs = require("fs-extra");
const path = require("path");
const helpers_1 = require("./helpers");
const logging_1 = require("./logging");
/**
 * Prompts a user to fetch a database from a remote location. Database is assumed to be an archive file.
 *
 * @param databasesManager the DatabaseManager
 * @param storagePath where to store the unzipped database.
 */
async function promptImportInternetDatabase(databasesManager, storagePath) {
    let item = undefined;
    try {
        const databaseUrl = await vscode_1.window.showInputBox({
            prompt: "Enter URL of zipfile of database to download",
        });
        if (databaseUrl) {
            validateHttpsUrl(databaseUrl);
            const progressOptions = {
                location: vscode_1.ProgressLocation.Notification,
                title: "Adding database from URL",
                cancellable: false,
            };
            await helpers_1.withProgress(progressOptions, async (progress) => (item = await databaseArchiveFetcher(databaseUrl, databasesManager, storagePath, progress)));
            vscode_1.commands.executeCommand("codeQLDatabases.focus");
        }
        helpers_1.showAndLogInformationMessage("Database downloaded and imported successfully.");
    }
    catch (e) {
        helpers_1.showAndLogErrorMessage(e.message);
    }
    return item;
}
exports.promptImportInternetDatabase = promptImportInternetDatabase;
/**
 * Prompts a user to fetch a database from lgtm.
 * User enters a project url and then the user is asked which language
 * to download (if there is more than one)
 *
 * @param databasesManager the DatabaseManager
 * @param storagePath where to store the unzipped database.
 */
async function promptImportLgtmDatabase(databasesManager, storagePath) {
    let item = undefined;
    try {
        const lgtmUrl = await vscode_1.window.showInputBox({
            prompt: "Enter the project URL on LGTM (e.g., https://lgtm.com/projects/g/github/codeql)",
        });
        if (!lgtmUrl) {
            return;
        }
        if (looksLikeLgtmUrl(lgtmUrl)) {
            const databaseUrl = await convertToDatabaseUrl(lgtmUrl);
            if (databaseUrl) {
                const progressOptions = {
                    location: vscode_1.ProgressLocation.Notification,
                    title: "Adding database from LGTM",
                    cancellable: false,
                };
                await helpers_1.withProgress(progressOptions, async (progress) => (item = await databaseArchiveFetcher(databaseUrl, databasesManager, storagePath, progress)));
                vscode_1.commands.executeCommand("codeQLDatabases.focus");
            }
        }
        else {
            throw new Error(`Invalid LGTM URL: ${lgtmUrl}`);
        }
        if (item) {
            helpers_1.showAndLogInformationMessage("Database downloaded and imported successfully.");
        }
    }
    catch (e) {
        helpers_1.showAndLogErrorMessage(e.message);
    }
    return item;
}
exports.promptImportLgtmDatabase = promptImportLgtmDatabase;
/**
 * Imports a database from a local archive.
 *
 * @param databaseUrl the file url of the archive to import
 * @param databasesManager the DatabaseManager
 * @param storagePath where to store the unzipped database.
 */
async function importArchiveDatabase(databaseUrl, databasesManager, storagePath) {
    let item = undefined;
    try {
        const progressOptions = {
            location: vscode_1.ProgressLocation.Notification,
            title: "Importing database from archive",
            cancellable: false,
        };
        await helpers_1.withProgress(progressOptions, async (progress) => (item = await databaseArchiveFetcher(databaseUrl, databasesManager, storagePath, progress)));
        vscode_1.commands.executeCommand("codeQLDatabases.focus");
        if (item) {
            helpers_1.showAndLogInformationMessage("Database unzipped and imported successfully.");
        }
    }
    catch (e) {
        helpers_1.showAndLogErrorMessage(e.message);
    }
    return item;
}
exports.importArchiveDatabase = importArchiveDatabase;
/**
 * Fetches an archive database. The database might be on the internet
 * or in the local filesystem.
 *
 * @param databaseUrl URL from which to grab the database
 * @param databasesManager the DatabaseManager
 * @param storagePath where to store the unzipped database.
 * @param progressCallback optional callback to send progress messages to
 */
async function databaseArchiveFetcher(databaseUrl, databasesManager, storagePath, progressCallback) {
    progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback({
        maxStep: 3,
        message: "Getting database",
        step: 1,
    });
    if (!storagePath) {
        throw new Error("No storage path specified.");
    }
    await fs.ensureDir(storagePath);
    const unzipPath = await getStorageFolder(storagePath, databaseUrl);
    if (isFile(databaseUrl)) {
        await readAndUnzip(databaseUrl, unzipPath);
    }
    else {
        await fetchAndUnzip(databaseUrl, unzipPath, progressCallback);
    }
    progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback({
        maxStep: 3,
        message: "Opening database",
        step: 3,
    });
    // find the path to the database. The actual database might be in a sub-folder
    const dbPath = await findDirWithFile(unzipPath, ".dbinfo", "codeql-database.yml");
    if (dbPath) {
        const item = await databasesManager.openDatabase(vscode_1.Uri.file(dbPath));
        databasesManager.setCurrentDatabaseItem(item);
        return item;
    }
    else {
        throw new Error("Database not found in archive.");
    }
}
async function getStorageFolder(storagePath, urlStr) {
    // we need to generate a folder name for the unzipped archive,
    // this needs to be human readable since we may use this name as the initial
    // name for the database
    const url = vscode_1.Uri.parse(urlStr);
    // MacOS has a max filename length of 255
    // and remove a few extra chars in case we need to add a counter at the end.
    let lastName = path.basename(url.path).substring(0, 250);
    if (lastName.endsWith(".zip")) {
        lastName = lastName.substring(0, lastName.length - 4);
    }
    const realpath = await fs.realpath(storagePath);
    let folderName = path.join(realpath, lastName);
    // avoid overwriting existing folders
    let counter = 0;
    while (await fs.pathExists(folderName)) {
        counter++;
        folderName = path.join(realpath, `${lastName}-${counter}`);
        if (counter > 100) {
            throw new Error("Could not find a unique name for downloaded database.");
        }
    }
    return folderName;
}
function validateHttpsUrl(databaseUrl) {
    let uri;
    try {
        uri = vscode_1.Uri.parse(databaseUrl, true);
    }
    catch (e) {
        throw new Error(`Invalid url: ${databaseUrl}`);
    }
    if (uri.scheme !== "https") {
        throw new Error("Must use https for downloading a database.");
    }
}
async function readAndUnzip(databaseUrl, unzipPath) {
    const unzipStream = unzipper.Extract({
        path: unzipPath,
    });
    await new Promise((resolve, reject) => {
        // we already know this is a file scheme
        const databaseFile = vscode_1.Uri.parse(databaseUrl).fsPath;
        const stream = fs.createReadStream(databaseFile);
        stream.on("error", reject);
        unzipStream.on("error", reject);
        unzipStream.on("close", resolve);
        stream.pipe(unzipStream);
    });
}
async function fetchAndUnzip(databaseUrl, unzipPath, progressCallback) {
    const response = await node_fetch_1.default(databaseUrl);
    await checkForFailingResponse(response);
    const unzipStream = unzipper.Extract({
        path: unzipPath,
    });
    progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback({
        maxStep: 3,
        message: "Unzipping database",
        step: 2,
    });
    await new Promise((resolve, reject) => {
        const handler = (err) => {
            if (err.message.startsWith('invalid signature')) {
                reject(new Error('Not a valid archive.'));
            }
            else {
                reject(err);
            }
        };
        response.body.on("error", handler);
        unzipStream.on("error", handler);
        unzipStream.on("close", resolve);
        response.body.pipe(unzipStream);
    });
}
async function checkForFailingResponse(response) {
    if (response.ok) {
        return;
    }
    // An error downloading the database. Attempt to extract the resaon behind it.
    const text = await response.text();
    let msg;
    try {
        const obj = JSON.parse(text);
        msg = obj.error || obj.message || obj.reason || JSON.stringify(obj, null, 2);
    }
    catch (e) {
        msg = text;
    }
    throw new Error(`Error downloading database.\n\nReason: ${msg}`);
}
function isFile(databaseUrl) {
    return vscode_1.Uri.parse(databaseUrl).scheme === "file";
}
/**
 * Recursively looks for a file in a directory. If the file exists, then returns the directory containing the file.
 *
 * @param dir The directory to search
 * @param toFind The file to recursively look for in this directory
 *
 * @returns the directory containing the file, or undefined if not found.
 */
// exported for testing
async function findDirWithFile(dir, ...toFind) {
    if (!(await fs.stat(dir)).isDirectory()) {
        return;
    }
    const files = await fs.readdir(dir);
    if (toFind.some((file) => files.includes(file))) {
        return dir;
    }
    for (const file of files) {
        const newPath = path.join(dir, file);
        const result = await findDirWithFile(newPath, ...toFind);
        if (result) {
            return result;
        }
    }
    return;
}
exports.findDirWithFile = findDirWithFile;
/**
 * The URL pattern is https://lgtm.com/projects/{provider}/{org}/{name}/{irrelevant-subpages}.
 * There are several possibilities for the provider: in addition to GitHub.com(g),
 * LGTM currently hosts projects from Bitbucket (b), GitLab (gl) and plain git (git).
 *
 * After the {provider}/{org}/{name} path components, there may be the components
 * related to sub pages.
 *
 * This function accepts any url that matches the patter above
 *
 * @param lgtmUrl The URL to the lgtm project
 *
 * @return true if this looks like an LGTM project url
 */
// exported for testing
function looksLikeLgtmUrl(lgtmUrl) {
    if (!lgtmUrl) {
        return false;
    }
    try {
        const uri = vscode_1.Uri.parse(lgtmUrl, true);
        if (uri.scheme !== "https") {
            return false;
        }
        if (uri.authority !== "lgtm.com" && uri.authority !== "www.lgtm.com") {
            return false;
        }
        const paths = uri.path.split("/").filter((segment) => segment);
        return paths.length >= 4 && paths[0] === "projects";
    }
    catch (e) {
        return false;
    }
}
exports.looksLikeLgtmUrl = looksLikeLgtmUrl;
// exported for testing
async function convertToDatabaseUrl(lgtmUrl) {
    try {
        const uri = vscode_1.Uri.parse(lgtmUrl, true);
        const paths = ["api", "v1.0"].concat(uri.path.split("/").filter((segment) => segment)).slice(0, 6);
        const projectUrl = `https://lgtm.com/${paths.join("/")}`;
        const projectResponse = await node_fetch_1.default(projectUrl);
        const projectJson = await projectResponse.json();
        if (projectJson.code === 404) {
            throw new Error();
        }
        const language = await promptForLanguage(projectJson);
        if (!language) {
            return;
        }
        return `https://lgtm.com/${[
            "api",
            "v1.0",
            "snapshots",
            projectJson.id,
            language,
        ].join("/")}`;
    }
    catch (e) {
        logging_1.logger.log(`Error: ${e.message}`);
        throw new Error(`Invalid LGTM URL: ${lgtmUrl}`);
    }
}
exports.convertToDatabaseUrl = convertToDatabaseUrl;
async function promptForLanguage(projectJson) {
    var _a;
    if (!((_a = projectJson === null || projectJson === void 0 ? void 0 : projectJson.languages) === null || _a === void 0 ? void 0 : _a.length)) {
        return;
    }
    if (projectJson.languages.length === 1) {
        return projectJson.languages[0].language;
    }
    return await vscode_1.window.showQuickPick(projectJson.languages.map((lang) => lang.language), {
        placeHolder: "Select the database language to download:"
    });
}

//# sourceMappingURL=databaseFetcher.js.map
