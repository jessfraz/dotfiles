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
const vscode = require("vscode");
const config_1 = require("./config");
const gitGraphView_1 = require("./gitGraphView");
const utils_1 = require("./utils");
class CommandManager {
    constructor(extensionPath, avatarManger, dataSource, extensionState, repoManager, gitExecutable, onDidChangeGitExecutable, logger) {
        this.disposables = [];
        this.extensionPath = extensionPath;
        this.avatarManager = avatarManger;
        this.dataSource = dataSource;
        this.extensionState = extensionState;
        this.logger = logger;
        this.repoManager = repoManager;
        this.gitExecutable = gitExecutable;
        this.registerCommand('git-graph.view', (arg) => this.view(arg));
        this.registerCommand('git-graph.addGitRepository', () => this.addGitRepository());
        this.registerCommand('git-graph.removeGitRepository', () => this.removeGitRepository());
        this.registerCommand('git-graph.clearAvatarCache', () => this.clearAvatarCache());
        this.registerCommand('git-graph.endAllWorkspaceCodeReviews', () => this.endAllWorkspaceCodeReviews());
        this.registerCommand('git-graph.endSpecificWorkspaceCodeReview', () => this.endSpecificWorkspaceCodeReview());
        this.registerCommand('git-graph.resumeWorkspaceCodeReview', () => this.resumeWorkspaceCodeReview());
        onDidChangeGitExecutable((gitExecutable) => {
            this.gitExecutable = gitExecutable;
        }, this.disposables);
    }
    dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
        this.disposables = [];
    }
    registerCommand(command, callback) {
        this.disposables.push(vscode.commands.registerCommand(command, callback));
    }
    view(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            let loadRepo = null;
            if (typeof arg === 'object' && arg.rootUri) {
                const repoPath = utils_1.getPathFromUri(arg.rootUri);
                loadRepo = yield this.repoManager.getKnownRepo(repoPath);
                if (loadRepo === null) {
                    loadRepo = (yield this.repoManager.registerRepo(yield utils_1.resolveToSymbolicPath(repoPath), true)).root;
                }
            }
            else if (config_1.getConfig().openToTheRepoOfTheActiveTextEditorDocument && vscode.window.activeTextEditor) {
                loadRepo = this.repoManager.getRepoContainingFile(utils_1.getPathFromUri(vscode.window.activeTextEditor.document.uri));
            }
            gitGraphView_1.GitGraphView.createOrShow(this.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, loadRepo !== null ? { repo: loadRepo, commitDetails: null } : null);
        });
    }
    addGitRepository() {
        if (this.gitExecutable === null) {
            utils_1.showErrorMessage(utils_1.UNABLE_TO_FIND_GIT_MSG);
            return;
        }
        vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false }).then(uris => {
            if (uris && uris.length > 0) {
                let path = utils_1.getPathFromUri(uris[0]);
                if (utils_1.isPathInWorkspace(path)) {
                    this.repoManager.registerRepo(path, false).then(status => {
                        if (status.error === null) {
                            utils_1.showInformationMessage('The repository "' + status.root + '" was added to Git Graph.');
                        }
                        else {
                            utils_1.showErrorMessage(status.error + ' Therefore it could not be added to Git Graph.');
                        }
                    });
                }
                else {
                    utils_1.showErrorMessage('The folder "' + path + '" is not within the opened Visual Studio Code workspace, and therefore could not be added to Git Graph.');
                }
            }
        }, () => { });
    }
    removeGitRepository() {
        if (this.gitExecutable === null) {
            utils_1.showErrorMessage(utils_1.UNABLE_TO_FIND_GIT_MSG);
            return;
        }
        let repoPaths = Object.keys(this.repoManager.getRepos());
        let items = repoPaths.map(path => ({ label: utils_1.getRepoName(path), description: path }));
        vscode.window.showQuickPick(items, {
            placeHolder: 'Select a repository to remove from Git Graph:',
            canPickMany: false
        }).then((item) => {
            if (item && item.description !== undefined) {
                if (this.repoManager.ignoreRepo(item.description)) {
                    utils_1.showInformationMessage('The repository "' + item.label + '" was removed from Git Graph.');
                }
                else {
                    utils_1.showErrorMessage('The repository "' + item.label + '" is not known to Git Graph.');
                }
            }
        }, () => { });
    }
    clearAvatarCache() {
        this.avatarManager.clearCache();
    }
    endAllWorkspaceCodeReviews() {
        this.extensionState.endAllWorkspaceCodeReviews();
        utils_1.showInformationMessage('Ended All Code Reviews in Workspace');
    }
    endSpecificWorkspaceCodeReview() {
        const codeReviews = this.extensionState.getCodeReviews();
        if (Object.keys(codeReviews).length === 0) {
            utils_1.showErrorMessage('There are no Code Reviews in progress within the current workspace.');
            return;
        }
        vscode.window.showQuickPick(this.getCodeReviewQuickPickItems(codeReviews), {
            placeHolder: 'Select the Code Review you want to end:',
            canPickMany: false
        }).then((item) => {
            if (item) {
                this.extensionState.endCodeReview(item.codeReviewRepo, item.codeReviewId).then((errorInfo) => {
                    if (errorInfo === null) {
                        utils_1.showInformationMessage('Successfully ended Code Review "' + item.label + '".');
                    }
                    else {
                        utils_1.showErrorMessage(errorInfo);
                    }
                }, () => { });
            }
        }, () => {
            utils_1.showErrorMessage('An unexpected error occurred while running the command "End a specific Code Review in Workspace...".');
        });
    }
    resumeWorkspaceCodeReview() {
        const codeReviews = this.extensionState.getCodeReviews();
        if (Object.keys(codeReviews).length === 0) {
            utils_1.showErrorMessage('There are no Code Reviews in progress within the current workspace.');
            return;
        }
        vscode.window.showQuickPick(this.getCodeReviewQuickPickItems(codeReviews), {
            placeHolder: 'Select the Code Review you want to resume:',
            canPickMany: false
        }).then((item) => {
            if (item) {
                const commitHashes = item.codeReviewId.split('-');
                gitGraphView_1.GitGraphView.createOrShow(this.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, {
                    repo: item.codeReviewRepo,
                    commitDetails: {
                        commitHash: commitHashes[commitHashes.length > 1 ? 1 : 0],
                        compareWithHash: commitHashes.length > 1 ? commitHashes[0] : null
                    }
                });
            }
        }, () => {
            utils_1.showErrorMessage('An unexpected error occurred while running the command "Resume a specific Code Review in Workspace...".');
        });
    }
    getCodeReviewQuickPickItems(codeReviews) {
        const enrichedCodeReviews = [];
        const fetchCommits = [];
        Object.keys(codeReviews).forEach((repo) => {
            Object.keys(codeReviews[repo]).forEach((id) => {
                const commitHashes = id.split('-');
                commitHashes.forEach((commitHash) => fetchCommits.push({ repo: repo, commitHash: commitHash }));
                enrichedCodeReviews.push({
                    repo: repo, id: id, review: codeReviews[repo][id],
                    fromCommitHash: commitHashes[0], toCommitHash: commitHashes[commitHashes.length > 1 ? 1 : 0]
                });
            });
        });
        return Promise.all(fetchCommits.map((fetch) => this.dataSource.getCommitSubject(fetch.repo, fetch.commitHash))).then((subjects) => {
            const commitSubjects = {};
            subjects.forEach((subject, i) => {
                if (typeof commitSubjects[fetchCommits[i].repo] === 'undefined') {
                    commitSubjects[fetchCommits[i].repo] = {};
                }
                commitSubjects[fetchCommits[i].repo][fetchCommits[i].commitHash] = subject !== null ? subject : '<Unknown Commit Subject>';
            });
            return enrichedCodeReviews.sort((a, b) => b.review.lastActive - a.review.lastActive).map((codeReview) => {
                const fromSubject = commitSubjects[codeReview.repo][codeReview.fromCommitHash];
                const toSubject = commitSubjects[codeReview.repo][codeReview.toCommitHash];
                const isComparison = codeReview.fromCommitHash !== codeReview.toCommitHash;
                return {
                    codeReviewRepo: codeReview.repo,
                    codeReviewId: codeReview.id,
                    label: utils_1.getRepoName(codeReview.repo) + ': ' + utils_1.abbrevCommit(codeReview.fromCommitHash) + (isComparison ? ' ↔ ' + utils_1.abbrevCommit(codeReview.toCommitHash) : ''),
                    description: utils_1.getRelativeTimeDiff(Math.round(codeReview.review.lastActive / 1000)),
                    detail: isComparison
                        ? utils_1.abbrevText(fromSubject, 50) + ' ↔ ' + utils_1.abbrevText(toSubject, 50)
                        : fromSubject
                };
            });
        });
    }
}
exports.CommandManager = CommandManager;
//# sourceMappingURL=commands.js.map