"use strict";
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
const path = require("path");
const vscode = require("vscode");
const config_1 = require("./config");
const dataSource_1 = require("./dataSource");
const repoFileWatcher_1 = require("./repoFileWatcher");
const utils_1 = require("./utils");
class GitGraphView {
    constructor(extensionPath, dataSource, extensionState, avatarManager, repoManager, logger, loadViewTo, column) {
        this.disposables = [];
        this.isGraphViewLoaded = false;
        this.isPanelVisible = true;
        this.currentRepo = null;
        this.loadViewTo = null;
        this.loadRepoInfoRefreshId = 0;
        this.loadCommitsRefreshId = 0;
        this.extensionPath = extensionPath;
        this.avatarManager = avatarManager;
        this.dataSource = dataSource;
        this.extensionState = extensionState;
        this.repoManager = repoManager;
        this.logger = logger;
        this.loadViewTo = loadViewTo;
        this.avatarManager.registerView(this);
        const config = config_1.getConfig();
        this.panel = vscode.window.createWebviewPanel('git-graph', 'Git Graph', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))],
            retainContextWhenHidden: config.retainContextWhenHidden
        });
        this.panel.iconPath = config.tabIconColourTheme === 0
            ? this.getResourcesUri('webview-icon.svg')
            : {
                light: this.getResourcesUri('webview-icon-light.svg'),
                dark: this.getResourcesUri('webview-icon-dark.svg')
            };
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.onDidChangeViewState(() => {
            if (this.panel.visible !== this.isPanelVisible) {
                if (this.panel.visible) {
                    this.update();
                }
                else {
                    this.currentRepo = null;
                    this.repoFileWatcher.stop();
                }
                this.isPanelVisible = this.panel.visible;
            }
        }, null, this.disposables);
        this.repoFileWatcher = new repoFileWatcher_1.RepoFileWatcher(logger, () => {
            if (this.panel.visible) {
                this.sendMessage({ command: 'refresh' });
            }
        });
        repoManager.onDidChangeRepos((event) => {
            if (!this.panel.visible)
                return;
            const loadViewTo = event.loadRepo !== null ? { repo: event.loadRepo, commitDetails: null } : null;
            if ((event.numRepos === 0 && this.isGraphViewLoaded) || (event.numRepos > 0 && !this.isGraphViewLoaded)) {
                this.loadViewTo = loadViewTo;
                this.update();
            }
            else {
                this.respondLoadRepos(event.repos, loadViewTo);
            }
        }, this.disposables);
        this.panel.webview.onDidReceiveMessage((msg) => this.respondToMessage(msg), null, this.disposables);
        this.update();
        this.logger.log('Created Git Graph View' + (loadViewTo !== null ? ' (active repo: ' + loadViewTo.repo + ')' : ''));
    }
    static createOrShow(extensionPath, dataSource, extensionState, avatarManager, repoManager, logger, loadViewTo) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (GitGraphView.currentPanel) {
            if (GitGraphView.currentPanel.isPanelVisible) {
                if (loadViewTo !== null) {
                    GitGraphView.currentPanel.respondLoadRepos(repoManager.getRepos(), loadViewTo);
                }
            }
            else {
                GitGraphView.currentPanel.loadViewTo = loadViewTo;
            }
            GitGraphView.currentPanel.panel.reveal(column);
        }
        else {
            GitGraphView.currentPanel = new GitGraphView(extensionPath, dataSource, extensionState, avatarManager, repoManager, logger, loadViewTo, column);
        }
    }
    respondToMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.repoFileWatcher.mute();
            let errorInfos;
            switch (msg.command) {
                case 'addRemote':
                    this.sendMessage({
                        command: 'addRemote',
                        error: yield this.dataSource.addRemote(msg.repo, msg.name, msg.url, msg.pushUrl, msg.fetch)
                    });
                    break;
                case 'addTag':
                    errorInfos = [yield this.dataSource.addTag(msg.repo, msg.tagName, msg.commitHash, msg.lightweight, msg.message)];
                    if (errorInfos[0] === null && msg.pushToRemote !== null) {
                        errorInfos.push(yield this.dataSource.pushTag(msg.repo, msg.tagName, msg.pushToRemote));
                    }
                    this.sendMessage({ command: 'addTag', errors: errorInfos });
                    break;
                case 'applyStash':
                    this.sendMessage({
                        command: 'applyStash',
                        error: yield this.dataSource.applyStash(msg.repo, msg.selector, msg.reinstateIndex)
                    });
                    break;
                case 'branchFromStash':
                    this.sendMessage({
                        command: 'branchFromStash',
                        error: yield this.dataSource.branchFromStash(msg.repo, msg.selector, msg.branchName)
                    });
                    break;
                case 'checkoutBranch':
                    errorInfos = [yield this.dataSource.checkoutBranch(msg.repo, msg.branchName, msg.remoteBranch)];
                    if (errorInfos[0] === null && msg.pullAfterwards !== null) {
                        errorInfos.push(yield this.dataSource.pullBranch(msg.repo, msg.pullAfterwards.branchName, msg.pullAfterwards.remote, false, false));
                    }
                    this.sendMessage({
                        command: 'checkoutBranch',
                        pullAfterwards: msg.pullAfterwards,
                        errors: errorInfos
                    });
                    break;
                case 'checkoutCommit':
                    this.sendMessage({
                        command: 'checkoutCommit',
                        error: yield this.dataSource.checkoutCommit(msg.repo, msg.commitHash)
                    });
                    break;
                case 'cherrypickCommit':
                    errorInfos = [yield this.dataSource.cherrypickCommit(msg.repo, msg.commitHash, msg.parentIndex, msg.recordOrigin, msg.noCommit)];
                    if (errorInfos[0] === null && msg.noCommit) {
                        errorInfos.push(yield utils_1.viewScm());
                    }
                    this.sendMessage({ command: 'cherrypickCommit', errors: errorInfos });
                    break;
                case 'cleanUntrackedFiles':
                    this.sendMessage({
                        command: 'cleanUntrackedFiles',
                        error: yield this.dataSource.cleanUntrackedFiles(msg.repo, msg.directories)
                    });
                    break;
                case 'codeReviewFileReviewed':
                    this.extensionState.updateCodeReviewFileReviewed(msg.repo, msg.id, msg.filePath);
                    break;
                case 'commitDetails':
                    let data = yield Promise.all([
                        msg.commitHash === utils_1.UNCOMMITTED
                            ? this.dataSource.getUncommittedDetails(msg.repo)
                            : msg.stash === null
                                ? this.dataSource.getCommitDetails(msg.repo, msg.commitHash, msg.hasParents)
                                : this.dataSource.getStashDetails(msg.repo, msg.commitHash, msg.stash),
                        msg.avatarEmail !== null ? this.avatarManager.getAvatarImage(msg.avatarEmail) : Promise.resolve(null)
                    ]);
                    this.sendMessage(Object.assign(Object.assign({ command: 'commitDetails' }, data[0]), { avatar: data[1], codeReview: msg.commitHash !== utils_1.UNCOMMITTED ? this.extensionState.getCodeReview(msg.repo, msg.commitHash) : null, refresh: msg.refresh }));
                    break;
                case 'compareCommits':
                    this.sendMessage(Object.assign(Object.assign({ command: 'compareCommits', commitHash: msg.commitHash, compareWithHash: msg.compareWithHash }, yield this.dataSource.getCommitComparison(msg.repo, msg.fromHash, msg.toHash)), { codeReview: msg.toHash !== utils_1.UNCOMMITTED ? this.extensionState.getCodeReview(msg.repo, msg.fromHash + '-' + msg.toHash) : null, refresh: msg.refresh }));
                    break;
                case 'copyFilePath':
                    this.sendMessage({
                        command: 'copyFilePath',
                        error: yield utils_1.copyFilePathToClipboard(msg.repo, msg.filePath)
                    });
                    break;
                case 'copyToClipboard':
                    this.sendMessage({
                        command: 'copyToClipboard',
                        type: msg.type,
                        error: yield utils_1.copyToClipboard(msg.data)
                    });
                    break;
                case 'createArchive':
                    this.sendMessage({
                        command: 'createArchive',
                        error: yield utils_1.archive(msg.repo, msg.ref, this.dataSource)
                    });
                    break;
                case 'createBranch':
                    this.sendMessage({
                        command: 'createBranch',
                        error: yield this.dataSource.createBranch(msg.repo, msg.branchName, msg.commitHash, msg.checkout)
                    });
                    break;
                case 'createPullRequest':
                    errorInfos = [msg.push ? yield this.dataSource.pushBranch(msg.repo, msg.sourceBranch, msg.sourceRemote, true, "") : null];
                    if (errorInfos[0] === null) {
                        errorInfos.push(yield utils_1.createPullRequest(msg.config, msg.sourceOwner, msg.sourceRepo, msg.sourceBranch));
                    }
                    this.sendMessage({
                        command: 'createPullRequest',
                        push: msg.push,
                        errors: errorInfos
                    });
                    break;
                case 'deleteBranch':
                    errorInfos = [yield this.dataSource.deleteBranch(msg.repo, msg.branchName, msg.forceDelete)];
                    for (let i = 0; i < msg.deleteOnRemotes.length; i++) {
                        errorInfos.push(yield this.dataSource.deleteRemoteBranch(msg.repo, msg.branchName, msg.deleteOnRemotes[i]));
                    }
                    this.sendMessage({ command: 'deleteBranch', errors: errorInfos });
                    break;
                case 'deleteRemote':
                    this.sendMessage({
                        command: 'deleteRemote',
                        error: yield this.dataSource.deleteRemote(msg.repo, msg.name)
                    });
                    break;
                case 'deleteRemoteBranch':
                    this.sendMessage({
                        command: 'deleteRemoteBranch',
                        error: yield this.dataSource.deleteRemoteBranch(msg.repo, msg.branchName, msg.remote)
                    });
                    break;
                case 'deleteTag':
                    this.sendMessage({
                        command: 'deleteTag',
                        error: yield this.dataSource.deleteTag(msg.repo, msg.tagName, msg.deleteOnRemote)
                    });
                    break;
                case 'deleteUserDetails':
                    errorInfos = [];
                    if (msg.name) {
                        errorInfos.push(yield this.dataSource.unsetConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_NAME, msg.location));
                    }
                    if (msg.email) {
                        errorInfos.push(yield this.dataSource.unsetConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_EMAIL, msg.location));
                    }
                    this.sendMessage({
                        command: 'deleteUserDetails',
                        errors: errorInfos
                    });
                    break;
                case 'dropCommit':
                    this.sendMessage({
                        command: 'dropCommit',
                        error: yield this.dataSource.dropCommit(msg.repo, msg.commitHash)
                    });
                    break;
                case 'dropStash':
                    this.sendMessage({
                        command: 'dropStash',
                        error: yield this.dataSource.dropStash(msg.repo, msg.selector)
                    });
                    break;
                case 'editRemote':
                    this.sendMessage({
                        command: 'editRemote',
                        error: yield this.dataSource.editRemote(msg.repo, msg.nameOld, msg.nameNew, msg.urlOld, msg.urlNew, msg.pushUrlOld, msg.pushUrlNew)
                    });
                    break;
                case 'editUserDetails':
                    errorInfos = [
                        yield this.dataSource.setConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_NAME, msg.name, msg.location),
                        yield this.dataSource.setConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_EMAIL, msg.email, msg.location)
                    ];
                    if (errorInfos[0] === null && errorInfos[1] === null) {
                        if (msg.deleteLocalName) {
                            errorInfos.push(yield this.dataSource.unsetConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_NAME, "local"));
                        }
                        if (msg.deleteLocalEmail) {
                            errorInfos.push(yield this.dataSource.unsetConfigValue(msg.repo, dataSource_1.GIT_CONFIG_USER_EMAIL, "local"));
                        }
                    }
                    this.sendMessage({
                        command: 'editUserDetails',
                        errors: errorInfos
                    });
                    break;
                case 'fetch':
                    this.sendMessage({
                        command: 'fetch',
                        error: yield this.dataSource.fetch(msg.repo, msg.name, msg.prune)
                    });
                    break;
                case 'fetchAvatar':
                    this.avatarManager.fetchAvatarImage(msg.email, msg.repo, msg.remote, msg.commits);
                    break;
                case 'fetchIntoLocalBranch':
                    this.sendMessage({
                        command: 'fetchIntoLocalBranch',
                        error: yield this.dataSource.fetchIntoLocalBranch(msg.repo, msg.remote, msg.remoteBranch, msg.localBranch)
                    });
                    break;
                case 'endCodeReview':
                    this.extensionState.endCodeReview(msg.repo, msg.id);
                    break;
                case 'getSettings':
                    this.sendMessage(Object.assign({ command: 'getSettings' }, yield this.dataSource.getRepoSettings(msg.repo)));
                    break;
                case 'loadCommits':
                    this.loadCommitsRefreshId = msg.refreshId;
                    this.sendMessage(Object.assign({ command: 'loadCommits', refreshId: msg.refreshId, onlyFollowFirstParent: msg.onlyFollowFirstParent }, yield this.dataSource.getCommits(msg.repo, msg.branches, msg.maxCommits, msg.showTags, msg.showRemoteBranches, msg.includeCommitsMentionedByReflogs, msg.onlyFollowFirstParent, msg.commitOrdering, msg.remotes, msg.hideRemotes, msg.stashes)));
                    break;
                case 'loadRepoInfo':
                    this.loadRepoInfoRefreshId = msg.refreshId;
                    let repoInfo = yield this.dataSource.getRepoInfo(msg.repo, msg.showRemoteBranches, msg.hideRemotes), isRepo = true;
                    if (repoInfo.error) {
                        isRepo = (yield this.dataSource.repoRoot(msg.repo)) !== null;
                        if (!isRepo)
                            repoInfo.error = null;
                    }
                    this.sendMessage(Object.assign(Object.assign({ command: 'loadRepoInfo', refreshId: msg.refreshId }, repoInfo), { isRepo: isRepo }));
                    if (msg.repo !== this.currentRepo) {
                        this.currentRepo = msg.repo;
                        this.extensionState.setLastActiveRepo(msg.repo);
                        this.repoFileWatcher.start(msg.repo);
                    }
                    break;
                case 'loadRepos':
                    if (!msg.check || !(yield this.repoManager.checkReposExist())) {
                        this.respondLoadRepos(this.repoManager.getRepos(), null);
                    }
                    break;
                case 'merge':
                    this.sendMessage({
                        command: 'merge', actionOn: msg.actionOn,
                        error: yield this.dataSource.merge(msg.repo, msg.obj, msg.actionOn, msg.createNewCommit, msg.squash, msg.noCommit)
                    });
                    break;
                case 'openExtensionSettings':
                    this.sendMessage({
                        command: 'openExtensionSettings',
                        error: yield utils_1.openExtensionSettings()
                    });
                    break;
                case 'openFile':
                    this.sendMessage({
                        command: 'openFile',
                        error: yield utils_1.openFile(msg.repo, msg.filePath)
                    });
                    break;
                case 'popStash':
                    this.sendMessage({
                        command: 'popStash',
                        error: yield this.dataSource.popStash(msg.repo, msg.selector, msg.reinstateIndex)
                    });
                    break;
                case 'pruneRemote':
                    this.sendMessage({
                        command: 'pruneRemote',
                        error: yield this.dataSource.pruneRemote(msg.repo, msg.name)
                    });
                    break;
                case 'pullBranch':
                    this.sendMessage({
                        command: 'pullBranch',
                        error: yield this.dataSource.pullBranch(msg.repo, msg.branchName, msg.remote, msg.createNewCommit, msg.squash)
                    });
                    break;
                case 'pushBranch':
                    this.sendMessage({
                        command: 'pushBranch',
                        error: yield this.dataSource.pushBranch(msg.repo, msg.branchName, msg.remote, msg.setUpstream, msg.mode)
                    });
                    break;
                case 'pushStash':
                    this.sendMessage({
                        command: 'pushStash',
                        error: yield this.dataSource.pushStash(msg.repo, msg.message, msg.includeUntracked)
                    });
                    break;
                case 'pushTag':
                    this.sendMessage({
                        command: 'pushTag',
                        error: yield this.dataSource.pushTag(msg.repo, msg.tagName, msg.remote)
                    });
                    break;
                case 'rebase':
                    this.sendMessage({
                        command: 'rebase', actionOn: msg.actionOn, interactive: msg.interactive,
                        error: yield this.dataSource.rebase(msg.repo, msg.obj, msg.actionOn, msg.ignoreDate, msg.interactive)
                    });
                    break;
                case 'renameBranch':
                    this.sendMessage({
                        command: 'renameBranch',
                        error: yield this.dataSource.renameBranch(msg.repo, msg.oldName, msg.newName)
                    });
                    break;
                case 'rescanForRepos':
                    if (!(yield this.repoManager.searchWorkspaceForRepos())) {
                        utils_1.showErrorMessage('No Git repositories were found in the current workspace.');
                    }
                    break;
                case 'resetToCommit':
                    this.sendMessage({
                        command: 'resetToCommit',
                        error: yield this.dataSource.resetToCommit(msg.repo, msg.commit, msg.resetMode)
                    });
                    break;
                case 'revertCommit':
                    this.sendMessage({
                        command: 'revertCommit',
                        error: yield this.dataSource.revertCommit(msg.repo, msg.commitHash, msg.parentIndex)
                    });
                    break;
                case 'setGlobalViewState':
                    this.sendMessage({
                        command: 'setGlobalViewState',
                        error: yield this.extensionState.setGlobalViewState(msg.state)
                    });
                    break;
                case 'setRepoState':
                    this.repoManager.setRepoState(msg.repo, msg.state);
                    break;
                case 'showErrorMessage':
                    utils_1.showErrorMessage(msg.message);
                    break;
                case 'startCodeReview':
                    this.sendMessage(Object.assign({ command: 'startCodeReview', commitHash: msg.commitHash, compareWithHash: msg.compareWithHash }, yield this.extensionState.startCodeReview(msg.repo, msg.id, msg.files, msg.lastViewedFile)));
                    break;
                case 'tagDetails':
                    this.sendMessage(Object.assign({ command: 'tagDetails', tagName: msg.tagName, commitHash: msg.commitHash }, yield this.dataSource.getTagDetails(msg.repo, msg.tagName)));
                    break;
                case 'viewDiff':
                    this.sendMessage({
                        command: 'viewDiff',
                        error: yield utils_1.viewDiff(msg.repo, msg.fromHash, msg.toHash, msg.oldFilePath, msg.newFilePath, msg.type)
                    });
                    break;
                case 'viewFileAtRevision':
                    this.sendMessage({
                        command: 'viewFileAtRevision',
                        error: yield utils_1.viewFileAtRevision(msg.repo, msg.hash, msg.filePath)
                    });
                    break;
                case 'viewScm':
                    this.sendMessage({
                        command: 'viewScm',
                        error: yield utils_1.viewScm()
                    });
                    break;
            }
            this.repoFileWatcher.unmute();
        });
    }
    sendMessage(msg) {
        this.panel.webview.postMessage(msg);
    }
    dispose() {
        GitGraphView.currentPanel = undefined;
        this.panel.dispose();
        this.avatarManager.deregisterView();
        this.repoFileWatcher.stop();
        this.disposables.forEach((disposable) => disposable.dispose());
        this.disposables = [];
        this.logger.log('Disposed Git Graph View');
    }
    update() {
        this.panel.webview.html = this.getHtmlForWebview();
    }
    getHtmlForWebview() {
        const config = config_1.getConfig(), nonce = utils_1.getNonce();
        const refLabelAlignment = config.refLabelAlignment;
        const initialState = {
            config: {
                autoCenterCommitDetailsView: config.autoCenterCommitDetailsView,
                branchLabelsAlignedToGraph: refLabelAlignment === 2,
                combineLocalAndRemoteBranchLabels: config.combineLocalAndRemoteBranchLabels,
                commitDetailsViewLocation: config.commitDetailsViewLocation,
                commitOrdering: config.commitOrdering,
                contextMenuActionsVisibility: config.contextMenuActionsVisibility,
                customBranchGlobPatterns: config.customBranchGlobPatterns,
                customEmojiShortcodeMappings: config.customEmojiShortcodeMappings,
                customPullRequestProviders: config.customPullRequestProviders,
                dateFormat: config.dateFormat,
                defaultColumnVisibility: config.defaultColumnVisibility,
                defaultFileViewType: config.defaultFileViewType,
                dialogDefaults: config.dialogDefaults,
                enhancedAccessibility: config.enhancedAccessibility,
                fetchAndPrune: config.fetchAndPrune,
                fetchAvatars: config.fetchAvatars && this.extensionState.isAvatarStorageAvailable(),
                graphColours: config.graphColours,
                graphStyle: config.graphStyle,
                grid: { x: 16, y: 24, offsetX: 16, offsetY: 12, expandY: 250 },
                includeCommitsMentionedByReflogs: config.includeCommitsMentionedByReflogs,
                initialLoadCommits: config.initialLoadCommits,
                loadMoreCommits: config.loadMoreCommits,
                loadMoreCommitsAutomatically: config.loadMoreCommitsAutomatically,
                muteCommitsNotAncestorsOfHead: config.muteCommitsThatAreNotAncestorsOfHead,
                muteMergeCommits: config.muteMergeCommits,
                onlyFollowFirstParent: config.onlyFollowFirstParent,
                openRepoToHead: config.openRepoToHead,
                showCurrentBranchByDefault: config.showCurrentBranchByDefault,
                showTags: config.showTags,
                tagLabelsOnRight: refLabelAlignment !== 0
            },
            lastActiveRepo: this.extensionState.getLastActiveRepo(),
            loadViewTo: this.loadViewTo,
            repos: this.repoManager.getRepos(),
            loadRepoInfoRefreshId: this.loadRepoInfoRefreshId,
            loadCommitsRefreshId: this.loadCommitsRefreshId
        };
        const globalState = this.extensionState.getGlobalViewState();
        let body, numRepos = Object.keys(initialState.repos).length, colorVars = '', colorParams = '';
        for (let i = 0; i < initialState.config.graphColours.length; i++) {
            colorVars += '--git-graph-color' + i + ':' + initialState.config.graphColours[i] + '; ';
            colorParams += '[data-color="' + i + '"]{--git-graph-color:var(--git-graph-color' + i + ');} ';
        }
        if (this.dataSource.isGitExecutableUnknown()) {
            body = `<body class="unableToLoad">
			<h2>Unable to load Git Graph</h2>
			<p class="unableToLoadMessage">${utils_1.UNABLE_TO_FIND_GIT_MSG}</p>
			</body>`;
        }
        else if (numRepos > 0) {
            body = `<body>
			<div id="view">
				<div id="controls">
					<span id="repoControl"><span class="unselectable">Repo: </span><div id="repoDropdown" class="dropdown"></div></span>
					<span id="branchControl"><span class="unselectable">Branches: </span><div id="branchDropdown" class="dropdown"></div></span>
					<label id="showRemoteBranchesControl"><input type="checkbox" id="showRemoteBranchesCheckbox" tabindex="-1"><span class="customCheckbox"></span>Show Remote Branches</label>
					<div id="findBtn" title="Find"></div>
					<div id="settingsBtn" title="Repository Settings"></div>
					<div id="fetchBtn"></div>
					<div id="refreshBtn"></div>
				</div>
				<div id="content">
					<div id="commitGraph"></div>
					<div id="commitTable"></div>
				</div>
				<div id="footer"></div>
			</div>
			<div id="scrollShadow"></div>
			<script nonce="${nonce}">var globalState = ${JSON.stringify(globalState)}, initialState = ${JSON.stringify(initialState)};</script>
			<script nonce="${nonce}" src="${this.getMediaUri('out.min.js')}"></script>
			</body>`;
        }
        else {
            body = `<body class="unableToLoad">
			<h2>Unable to load Git Graph</h2>
			<p class="unableToLoadMessage">No Git repositories were found in the current workspace when it was last scanned by Git Graph.</p>
			<p>If your repositories are in subfolders of the open workspace folder(s), make sure you have set the Git Graph Setting "git-graph.maxDepthOfRepoSearch" appropriately (read the <a href="https://github.com/mhutchie/vscode-git-graph/wiki/Extension-Settings#max-depth-of-repo-search" target="_blank">documentation</a> for more information).</p>
			<p><div id="rescanForReposBtn" class="roundedBtn">Re-scan the current workspace for repositories</div></p>
			<script nonce="${nonce}">(function(){ var api = acquireVsCodeApi(); document.getElementById('rescanForReposBtn').addEventListener('click', function(){ api.postMessage({command: 'rescanForRepos'}); }); })();</script>
			</body>`;
        }
        this.isGraphViewLoaded = numRepos > 0;
        this.loadViewTo = null;
        return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${standardiseCspSource(this.panel.webview.cspSource)} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src data:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="stylesheet" type="text/css" href="${this.getMediaUri('out.min.css')}">
				<title>Git Graph</title>
				<style>body{${colorVars}} ${colorParams}</style>
			</head>
			${body}
		</html>`;
    }
    getMediaUri(file) {
        return this.panel.webview.asWebviewUri(this.getUri('media', file));
    }
    getResourcesUri(file) {
        return this.getUri('resources', file);
    }
    getUri(...pathComps) {
        return vscode.Uri.file(path.join(this.extensionPath, ...pathComps));
    }
    respondLoadRepos(repos, loadViewTo) {
        this.sendMessage({
            command: 'loadRepos',
            repos: repos,
            lastActiveRepo: this.extensionState.getLastActiveRepo(),
            loadViewTo: loadViewTo
        });
    }
    respondWithAvatar(email, image) {
        this.sendMessage({ command: 'fetchAvatar', email: email, image: image });
    }
}
exports.GitGraphView = GitGraphView;
function standardiseCspSource(cspSource) {
    if (cspSource.startsWith('http://') || cspSource.startsWith('https://')) {
        const pathIndex = cspSource.indexOf('/', 8), queryIndex = cspSource.indexOf('?', 8), fragmentIndex = cspSource.indexOf('#', 8);
        let endOfAuthorityIndex = pathIndex;
        if (queryIndex > -1 && (queryIndex < endOfAuthorityIndex || endOfAuthorityIndex === -1))
            endOfAuthorityIndex = queryIndex;
        if (fragmentIndex > -1 && (fragmentIndex < endOfAuthorityIndex || endOfAuthorityIndex === -1))
            endOfAuthorityIndex = fragmentIndex;
        return endOfAuthorityIndex > -1 ? cspSource.substring(0, endOfAuthorityIndex) : cspSource;
    }
    else {
        return cspSource;
    }
}
exports.standardiseCspSource = standardiseCspSource;
//# sourceMappingURL=gitGraphView.js.map