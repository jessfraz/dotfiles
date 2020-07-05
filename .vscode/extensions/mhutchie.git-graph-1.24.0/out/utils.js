"use strict";
function requireWithFallback(electronModule, nodeModule) { try { return require(electronModule); } catch (err) {} return require(nodeModule); }
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = requireWithFallback("original-fs", "fs");
const path = require("path");
const vscode = require("vscode");
const config_1 = require("./config");
const diffDocProvider_1 = require("./diffDocProvider");
exports.UNCOMMITTED = '*';
exports.UNABLE_TO_FIND_GIT_MSG = 'Unable to find a Git executable. Either: Set the Visual Studio Code Setting "git.path" to the path and filename of an existing Git executable, or install Git and restart Visual Studio Code.';
const FS_REGEX = /\\/g;
function getPathFromUri(uri) {
    return uri.fsPath.replace(FS_REGEX, '/');
}
exports.getPathFromUri = getPathFromUri;
function getPathFromStr(str) {
    return str.replace(FS_REGEX, '/');
}
exports.getPathFromStr = getPathFromStr;
function pathWithTrailingSlash(path) {
    return path.endsWith('/') ? path : path + '/';
}
exports.pathWithTrailingSlash = pathWithTrailingSlash;
function isPathInWorkspace(path) {
    let rootsExact = [], rootsFolder = [], workspaceFolders = vscode.workspace.workspaceFolders;
    if (typeof workspaceFolders !== 'undefined') {
        for (let i = 0; i < workspaceFolders.length; i++) {
            let tmpPath = getPathFromUri(workspaceFolders[i].uri);
            rootsExact.push(tmpPath);
            rootsFolder.push(pathWithTrailingSlash(tmpPath));
        }
    }
    return rootsExact.indexOf(path) > -1 || rootsFolder.findIndex(x => path.startsWith(x)) > -1;
}
exports.isPathInWorkspace = isPathInWorkspace;
function realpath(path) {
    return new Promise(resolve => {
        fs.realpath(path, (err, resolvedPath) => resolve(err !== null ? path : getPathFromUri(vscode.Uri.file(resolvedPath))));
    });
}
exports.realpath = realpath;
function resolveToSymbolicPath(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (typeof workspaceFolders !== 'undefined') {
            for (let i = 0; i < workspaceFolders.length; i++) {
                let rootSymPath = getPathFromUri(workspaceFolders[i].uri);
                let rootCanonicalPath = yield realpath(rootSymPath);
                if (path === rootCanonicalPath) {
                    return rootSymPath;
                }
                else if (path.startsWith(rootCanonicalPath + '/')) {
                    return rootSymPath + path.substring(rootCanonicalPath.length);
                }
                else if (rootCanonicalPath.startsWith(path + '/')) {
                    let symPath = rootSymPath;
                    let first = symPath.indexOf('/');
                    while (true) {
                        if (path === symPath || path === (yield realpath(symPath)))
                            return symPath;
                        let next = symPath.lastIndexOf('/');
                        if (first !== next && next > -1) {
                            symPath = symPath.substring(0, next);
                        }
                        else {
                            return path;
                        }
                    }
                }
            }
        }
        return path;
    });
}
exports.resolveToSymbolicPath = resolveToSymbolicPath;
function abbrevCommit(commitHash) {
    return commitHash.substring(0, 8);
}
exports.abbrevCommit = abbrevCommit;
function abbrevText(text, toChars) {
    return text.length <= toChars ? text : text.substring(0, toChars - 1) + '...';
}
exports.abbrevText = abbrevText;
function getRelativeTimeDiff(unixTimestamp) {
    let diff = Math.round((new Date()).getTime() / 1000) - unixTimestamp, unit;
    if (diff < 60) {
        unit = 'second';
    }
    else if (diff < 3600) {
        unit = 'minute';
        diff /= 60;
    }
    else if (diff < 86400) {
        unit = 'hour';
        diff /= 3600;
    }
    else if (diff < 604800) {
        unit = 'day';
        diff /= 86400;
    }
    else if (diff < 2629800) {
        unit = 'week';
        diff /= 604800;
    }
    else if (diff < 31557600) {
        unit = 'month';
        diff /= 2629800;
    }
    else {
        unit = 'year';
        diff /= 31557600;
    }
    diff = Math.round(diff);
    return diff + ' ' + unit + (diff !== 1 ? 's' : '') + ' ago';
}
exports.getRelativeTimeDiff = getRelativeTimeDiff;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;
function getRepoName(path) {
    let firstSep = path.indexOf('/');
    if (firstSep === path.length - 1 || firstSep === -1) {
        return path;
    }
    else {
        let p = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
        return p.substring(p.lastIndexOf('/') + 1);
    }
}
exports.getRepoName = getRepoName;
function archive(repo, ref, dataSource) {
    return vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(repo),
        saveLabel: 'Create Archive',
        filters: { 'TAR Archive': ['tar'], 'ZIP Archive': ['zip'] }
    }).then((uri) => {
        if (uri) {
            const extension = uri.fsPath.substring(uri.fsPath.lastIndexOf('.') + 1).toLowerCase();
            if (extension === 'tar' || extension === 'zip') {
                return dataSource.archive(repo, ref, uri.fsPath, extension);
            }
            else {
                return 'Invalid file extension "*.' + extension + '". The archive file must have a *.tar or *.zip extension.';
            }
        }
        else {
            return 'No file name was provided for the archive.';
        }
    }, () => 'Visual Studio Code was unable to display the save dialog.');
}
exports.archive = archive;
function copyFilePathToClipboard(repo, filePath) {
    return copyToClipboard(path.join(repo, filePath));
}
exports.copyFilePathToClipboard = copyFilePathToClipboard;
function copyToClipboard(text) {
    return vscode.env.clipboard.writeText(text).then(() => null, () => 'Visual Studio Code was unable to write to the Clipboard.');
}
exports.copyToClipboard = copyToClipboard;
function createPullRequest(config, sourceOwner, sourceRepo, sourceBranch) {
    let templateUrl;
    switch (config.provider) {
        case 0:
            templateUrl = '$1/$2/$3/pull-requests/new?source=$2/$3::$4&dest=$5/$6::$8';
            break;
        case 1:
            templateUrl = config.custom.templateUrl;
            break;
        case 2:
            templateUrl = '$1/$5/$6/compare/$8...$2:$4';
            break;
        case 3:
            templateUrl = '$1/$2/$3/-/merge_requests/new?merge_request[source_branch]=$4&merge_request[target_branch]=$8' +
                (config.destProjectId !== '' ? '&merge_request[target_project_id]=$7' : '');
            break;
    }
    const urlFieldValues = [
        config.hostRootUrl,
        sourceOwner, sourceRepo, sourceBranch,
        config.destOwner, config.destRepo, config.destProjectId, config.destBranch
    ];
    const url = templateUrl.replace(/\$([1-8])/g, (_, index) => urlFieldValues[parseInt(index) - 1]);
    return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => null, () => 'Visual Studio Code was unable to open the Pull Request URL: ' + url);
}
exports.createPullRequest = createPullRequest;
function openExtensionSettings() {
    return vscode.commands.executeCommand('workbench.action.openSettings', '@ext:mhutchie.git-graph').then(() => null, () => 'Visual Studio Code was unable to open the Git Graph Extension Settings.');
}
exports.openExtensionSettings = openExtensionSettings;
function openFile(repo, filePath) {
    return new Promise(resolve => {
        const p = path.join(repo, filePath);
        fs.access(p, fs.constants.R_OK, (err) => {
            if (err === null) {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(p), {
                    preview: true,
                    viewColumn: config_1.getConfig().openDiffTabLocation
                }).then(() => resolve(null), () => resolve('Visual Studio Code was unable to open ' + filePath + '.'));
            }
            else {
                resolve('The file ' + filePath + ' doesn\'t currently exist in this repository.');
            }
        });
    });
}
exports.openFile = openFile;
function viewDiff(repo, fromHash, toHash, oldFilePath, newFilePath, type) {
    if (type !== "U") {
        let abbrevFromHash = abbrevCommit(fromHash), abbrevToHash = toHash !== exports.UNCOMMITTED ? abbrevCommit(toHash) : 'Present', pathComponents = newFilePath.split('/');
        let desc = fromHash === toHash
            ? fromHash === exports.UNCOMMITTED
                ? 'Uncommitted'
                : (type === "A" ? 'Added in ' + abbrevToHash : type === "D" ? 'Deleted in ' + abbrevToHash : abbrevFromHash + '^ ↔ ' + abbrevToHash)
            : (type === "A" ? 'Added between ' + abbrevFromHash + ' & ' + abbrevToHash : type === "D" ? 'Deleted between ' + abbrevFromHash + ' & ' + abbrevToHash : abbrevFromHash + ' ↔ ' + abbrevToHash);
        let title = pathComponents[pathComponents.length - 1] + ' (' + desc + ')';
        if (fromHash === exports.UNCOMMITTED)
            fromHash = 'HEAD';
        return vscode.commands.executeCommand('vscode.diff', diffDocProvider_1.encodeDiffDocUri(repo, oldFilePath, fromHash === toHash ? fromHash + '^' : fromHash, type, 0), diffDocProvider_1.encodeDiffDocUri(repo, newFilePath, toHash, type, 1), title, {
            preview: true,
            viewColumn: config_1.getConfig().openDiffTabLocation
        }).then(() => null, () => 'Visual Studio Code was unable load the diff editor for ' + newFilePath + '.');
    }
    else {
        return openFile(repo, newFilePath);
    }
}
exports.viewDiff = viewDiff;
function viewFileAtRevision(repo, hash, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const pathComponents = filePath.split('/');
        const title = abbrevCommit(hash) + ': ' + pathComponents[pathComponents.length - 1];
        return vscode.commands.executeCommand('vscode.open', diffDocProvider_1.encodeDiffDocUri(repo, filePath, hash, "M", 1).with({ path: title }), {
            preview: true,
            viewColumn: config_1.getConfig().openDiffTabLocation
        }).then(() => null, () => 'Visual Studio Code was unable to open ' + filePath + ' at commit ' + abbrevCommit(hash) + '.');
    });
}
exports.viewFileAtRevision = viewFileAtRevision;
function viewScm() {
    return vscode.commands.executeCommand('workbench.view.scm').then(() => null, () => 'Visual Studio Code was unable to open the Source Control View.');
}
exports.viewScm = viewScm;
function runGitCommandInNewTerminal(cwd, gitPath, command, name) {
    let p = process.env['PATH'] || '', sep = isWindows() ? ';' : ':';
    if (p !== '' && !p.endsWith(sep))
        p += sep;
    p += path.dirname(gitPath);
    let options = { cwd: cwd, name: name, env: { 'PATH': p } };
    let shell = config_1.getConfig().integratedTerminalShell;
    if (shell !== '')
        options.shellPath = shell;
    let terminal = vscode.window.createTerminal(options);
    terminal.sendText('git ' + command);
    terminal.show();
}
exports.runGitCommandInNewTerminal = runGitCommandInNewTerminal;
function isWindows() {
    return process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';
}
function showInformationMessage(message) {
    return vscode.window.showInformationMessage(message).then(() => { }, () => { });
}
exports.showInformationMessage = showInformationMessage;
function showErrorMessage(message) {
    return vscode.window.showErrorMessage(message).then(() => { }, () => { });
}
exports.showErrorMessage = showErrorMessage;
function evalPromises(data, maxParallel, createPromise) {
    return new Promise((resolve, reject) => {
        if (data.length === 1) {
            createPromise(data[0]).then(v => resolve([v])).catch(() => reject());
        }
        else if (data.length === 0) {
            resolve([]);
        }
        else {
            let results = new Array(data.length), nextPromise = 0, rejected = false, completed = 0;
            function startNext() {
                let cur = nextPromise;
                nextPromise++;
                createPromise(data[cur]).then(result => {
                    if (!rejected) {
                        results[cur] = result;
                        completed++;
                        if (nextPromise < data.length)
                            startNext();
                        else if (completed === data.length)
                            resolve(results);
                    }
                }).catch(() => {
                    reject();
                    rejected = true;
                });
            }
            for (let i = 0; i < maxParallel && i < data.length; i++)
                startNext();
        }
    });
}
exports.evalPromises = evalPromises;
function findGit(extensionState) {
    return __awaiter(this, void 0, void 0, function* () {
        const lastKnownPath = extensionState.getLastKnownGitPath();
        if (lastKnownPath !== null) {
            try {
                return yield getGitExecutable(lastKnownPath);
            }
            catch (_) { }
        }
        const configGitPath = config_1.getConfig().gitPath;
        if (configGitPath !== null) {
            try {
                return yield getGitExecutable(configGitPath);
            }
            catch (_) { }
        }
        switch (process.platform) {
            case 'darwin':
                return findGitOnDarwin();
            case 'win32':
                return findGitOnWin32();
            default:
                return getGitExecutable('git');
        }
    });
}
exports.findGit = findGit;
function findGitOnDarwin() {
    return new Promise((resolve, reject) => {
        cp.exec('which git', (err, stdout) => {
            if (err)
                return reject();
            const path = stdout.trim();
            if (path !== '/usr/bin/git') {
                getGitExecutable(path).then((exec) => resolve(exec), () => reject());
            }
            else {
                cp.exec('xcode-select -p', (err) => {
                    if (err && err.code === 2) {
                        reject();
                    }
                    else {
                        getGitExecutable(path).then((exec) => resolve(exec), () => reject());
                    }
                });
            }
        });
    });
}
function findGitOnWin32() {
    return findSystemGitWin32(process.env['ProgramW6432'])
        .then(undefined, () => findSystemGitWin32(process.env['ProgramFiles(x86)']))
        .then(undefined, () => findSystemGitWin32(process.env['ProgramFiles']))
        .then(undefined, () => findSystemGitWin32(process.env['LocalAppData'] ? path.join(process.env['LocalAppData'], 'Programs') : undefined))
        .then(undefined, () => findGitWin32InPath());
}
function findSystemGitWin32(pathBase) {
    return pathBase
        ? getGitExecutable(path.join(pathBase, 'Git', 'cmd', 'git.exe'))
        : Promise.reject();
}
function findGitWin32InPath() {
    return __awaiter(this, void 0, void 0, function* () {
        let dirs = (process.env['PATH'] || '').split(';');
        dirs.unshift(process.cwd());
        for (let i = 0; i < dirs.length; i++) {
            let file = path.join(dirs[i], 'git.exe');
            if (yield isExecutable(file)) {
                try {
                    return yield getGitExecutable(file);
                }
                catch (_) { }
            }
        }
        return Promise.reject();
    });
}
function isExecutable(path) {
    return new Promise(resolve => {
        fs.stat(path, (err, stat) => {
            resolve(!err && (stat.isFile() || stat.isSymbolicLink()));
        });
    });
}
function getGitExecutable(path) {
    return new Promise((resolve, reject) => {
        const cmd = cp.spawn(path, ['--version']);
        let stdout = '';
        cmd.stdout.on('data', (d) => { stdout += d; });
        cmd.on('error', () => reject());
        cmd.on('exit', (code) => {
            if (code) {
                reject();
            }
            else {
                resolve({ path: path, version: stdout.trim().replace(/^git version /, '') });
            }
        });
    });
}
exports.getGitExecutable = getGitExecutable;
function isGitAtLeastVersion(executable, version) {
    const v1 = parseVersion(executable.version);
    const v2 = parseVersion(version);
    if (v1 === null || v2 === null) {
        return false;
    }
    if (v1.major > v2.major)
        return true;
    if (v1.major < v2.major)
        return false;
    if (v1.minor > v2.minor)
        return true;
    if (v1.minor < v2.minor)
        return false;
    if (v1.patch > v2.patch)
        return true;
    if (v1.patch < v2.patch)
        return false;
    return true;
}
exports.isGitAtLeastVersion = isGitAtLeastVersion;
function parseVersion(version) {
    try {
        const v = version.split(/[^0-9\.]+/)[0].split('.');
        return {
            major: v.length > 0 ? parseInt(v[0], 10) : 0,
            minor: v.length > 1 ? parseInt(v[1], 10) : 0,
            patch: v.length > 2 ? parseInt(v[2], 10) : 0
        };
    }
    catch (_) {
        return null;
    }
}
function constructIncompatibleGitVersionMessage(executable, version) {
    return 'A newer version of Git (>= ' + version + ') is required for this feature. Git ' + executable.version + ' is currently installed. Please install a newer version of Git to use this feature.';
}
exports.constructIncompatibleGitVersionMessage = constructIncompatibleGitVersionMessage;
//# sourceMappingURL=utils.js.map