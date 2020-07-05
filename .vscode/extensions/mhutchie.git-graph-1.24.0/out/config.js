"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const VIEW_COLUMN_MAPPING = {
    'Active': vscode.ViewColumn.Active,
    'Beside': vscode.ViewColumn.Beside,
    'One': vscode.ViewColumn.One,
    'Two': vscode.ViewColumn.Two,
    'Three': vscode.ViewColumn.Three,
    'Four': vscode.ViewColumn.Four,
    'Five': vscode.ViewColumn.Five,
    'Six': vscode.ViewColumn.Six,
    'Seven': vscode.ViewColumn.Seven,
    'Eight': vscode.ViewColumn.Eight,
    'Nine': vscode.ViewColumn.Nine
};
class Config {
    constructor() {
        this.config = vscode.workspace.getConfiguration('git-graph');
    }
    get autoCenterCommitDetailsView() {
        return !!this.config.get('autoCenterCommitDetailsView', true);
    }
    get combineLocalAndRemoteBranchLabels() {
        return !!this.config.get('combineLocalAndRemoteBranchLabels', true);
    }
    get commitDetailsViewLocation() {
        return this.config.get('commitDetailsViewLocation', 'Inline') === 'Docked to Bottom'
            ? 1
            : 0;
    }
    get commitOrdering() {
        const ordering = this.config.get('commitOrdering', 'date');
        return ordering === 'author-date'
            ? "author-date"
            : ordering === 'topo'
                ? "topo"
                : "date";
    }
    get contextMenuActionsVisibility() {
        let userConfig = this.config.get('contextMenuActionsVisibility', {});
        let config = {
            branch: { checkout: true, rename: true, delete: true, merge: true, rebase: true, push: true, createPullRequest: true, createArchive: true, copyName: true },
            commit: { addTag: true, createBranch: true, checkout: true, cherrypick: true, revert: true, drop: true, merge: true, rebase: true, reset: true, copyHash: true, copySubject: true },
            remoteBranch: { checkout: true, delete: true, fetch: true, pull: true, createPullRequest: true, createArchive: true, copyName: true },
            stash: { apply: true, createBranch: true, pop: true, drop: true, copyName: true, copyHash: true },
            tag: { viewDetails: true, delete: true, push: true, createArchive: true, copyName: true },
            uncommittedChanges: { stash: true, reset: true, clean: true, openSourceControlView: true }
        };
        mergeConfigObjects(config, userConfig);
        return config;
    }
    get customBranchGlobPatterns() {
        let inPatterns = this.config.get('customBranchGlobPatterns', []);
        let outPatterns = [];
        for (let i = 0; i < inPatterns.length; i++) {
            if (typeof inPatterns[i].name === 'string' && typeof inPatterns[i].glob === 'string') {
                outPatterns.push({ name: inPatterns[i].name, glob: '--glob=' + inPatterns[i].glob });
            }
        }
        return outPatterns;
    }
    get customEmojiShortcodeMappings() {
        let inMappings = this.config.get('customEmojiShortcodeMappings', []);
        let outMappings = [];
        for (let i = 0; i < inMappings.length; i++) {
            if (typeof inMappings[i].shortcode === 'string' && typeof inMappings[i].emoji === 'string') {
                outMappings.push({ shortcode: inMappings[i].shortcode, emoji: inMappings[i].emoji });
            }
        }
        return outMappings;
    }
    get customPullRequestProviders() {
        let providers = this.config.get('customPullRequestProviders', []);
        return Array.isArray(providers)
            ? providers
                .filter((provider) => typeof provider.name === 'string' && typeof provider.templateUrl === 'string')
                .map((provider) => ({ name: provider.name, templateUrl: provider.templateUrl }))
            : [];
    }
    get dateFormat() {
        let configValue = this.config.get('dateFormat', 'Date & Time'), type = 0, iso = false;
        if (configValue === 'Relative') {
            type = 2;
        }
        else {
            if (configValue.endsWith('Date Only'))
                type = 1;
            if (configValue.startsWith('ISO'))
                iso = true;
        }
        return { type: type, iso: iso };
    }
    get dateType() {
        return this.config.get('dateType', 'Author Date') === 'Commit Date'
            ? 1
            : 0;
    }
    get defaultColumnVisibility() {
        let obj = this.config.get('defaultColumnVisibility', {});
        if (typeof obj === 'object' && obj !== null && typeof obj['Date'] === 'boolean' && typeof obj['Author'] === 'boolean' && typeof obj['Commit'] === 'boolean') {
            return { author: obj['Author'], commit: obj['Commit'], date: obj['Date'] };
        }
        else {
            return { author: true, commit: true, date: true };
        }
    }
    get defaultFileViewType() {
        return this.config.get('defaultFileViewType', 'File Tree') === 'File List'
            ? 2
            : 1;
    }
    get dialogDefaults() {
        let resetCommitMode = this.config.get('dialog.resetCurrentBranchToCommit.mode', 'Mixed');
        let resetUncommittedMode = this.config.get('dialog.resetUncommittedChanges.mode', 'Mixed');
        return {
            addTag: {
                pushToRemote: !!this.config.get('dialog.addTag.pushToRemote', false),
                type: this.config.get('dialog.addTag.type', 'Annotated') === 'Lightweight' ? 'lightweight' : 'annotated'
            },
            applyStash: {
                reinstateIndex: !!this.config.get('dialog.applyStash.reinstateIndex', false)
            },
            cherryPick: {
                recordOrigin: !!this.config.get('dialog.cherryPick.recordOrigin', false)
            },
            createBranch: {
                checkout: !!this.config.get('dialog.createBranch.checkOut', false)
            },
            deleteBranch: {
                forceDelete: !!this.config.get('dialog.deleteBranch.forceDelete', false)
            },
            merge: {
                noCommit: !!this.config.get('dialog.merge.noCommit', false),
                noFastForward: !!this.config.get('dialog.merge.noFastForward', true),
                squash: !!this.config.get('dialog.merge.squashCommits', false)
            },
            popStash: {
                reinstateIndex: !!this.config.get('dialog.popStash.reinstateIndex', false)
            },
            rebase: {
                ignoreDate: !!this.config.get('dialog.rebase.ignoreDate', true),
                interactive: !!this.config.get('dialog.rebase.launchInteractiveRebase', false)
            },
            resetCommit: {
                mode: resetCommitMode === 'Soft' ? "soft" : (resetCommitMode === 'Hard' ? "hard" : "mixed")
            },
            resetUncommitted: {
                mode: resetUncommittedMode === 'Hard' ? "hard" : "mixed"
            },
            stashUncommittedChanges: {
                includeUntracked: !!this.config.get('dialog.stashUncommittedChanges.includeUntracked', true)
            }
        };
    }
    get enhancedAccessibility() {
        return !!this.config.get('enhancedAccessibility', false);
    }
    get fetchAndPrune() {
        return !!this.config.get('fetchAndPrune', false);
    }
    get fetchAvatars() {
        return !!this.config.get('fetchAvatars', false);
    }
    get fileEncoding() {
        return this.config.get('fileEncoding', 'utf8');
    }
    get graphColours() {
        const colours = this.config.get('graphColours', []);
        return Array.isArray(colours) && colours.length > 0
            ? colours.filter((v) => v.match(/^\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgb[a]?\s*\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\))\s*$/) !== null)
            : ['#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9', '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23', '#6f24d6', '#ffcc00'];
    }
    get graphStyle() {
        return this.config.get('graphStyle', 'rounded') === 'angular'
            ? 1
            : 0;
    }
    get includeCommitsMentionedByReflogs() {
        return !!this.config.get('includeCommitsMentionedByReflogs', false);
    }
    get initialLoadCommits() {
        return this.config.get('initialLoadCommits', 300);
    }
    get integratedTerminalShell() {
        return this.config.get('integratedTerminalShell', '');
    }
    get loadMoreCommits() {
        return this.config.get('loadMoreCommits', 100);
    }
    get loadMoreCommitsAutomatically() {
        return !!this.config.get('loadMoreCommitsAutomatically', true);
    }
    get maxDepthOfRepoSearch() {
        return this.config.get('maxDepthOfRepoSearch', 0);
    }
    get muteCommitsThatAreNotAncestorsOfHead() {
        return !!this.config.get('muteCommitsThatAreNotAncestorsOfHead', false);
    }
    get muteMergeCommits() {
        return !!this.config.get('muteMergeCommits', true);
    }
    get onlyFollowFirstParent() {
        return !!this.config.get('onlyFollowFirstParent', false);
    }
    get openDiffTabLocation() {
        const location = this.config.get('openDiffTabLocation', 'Active');
        return typeof location === 'string' && typeof VIEW_COLUMN_MAPPING[location] !== 'undefined'
            ? VIEW_COLUMN_MAPPING[location]
            : vscode.ViewColumn.Active;
    }
    get openRepoToHead() {
        return !!this.config.get('openRepoToHead', false);
    }
    get openToTheRepoOfTheActiveTextEditorDocument() {
        return !!this.config.get('openToTheRepoOfTheActiveTextEditorDocument', false);
    }
    get refLabelAlignment() {
        let configValue = this.config.get('referenceLabelAlignment', 'Normal');
        return configValue === 'Branches (on the left) & Tags (on the right)'
            ? 1
            : configValue === 'Branches (aligned to the graph) & Tags (on the right)'
                ? 2
                : 0;
    }
    get retainContextWhenHidden() {
        return !!this.config.get('retainContextWhenHidden', true);
    }
    get showCommitsOnlyReferencedByTags() {
        return !!this.config.get('showCommitsOnlyReferencedByTags', true);
    }
    get showCurrentBranchByDefault() {
        return !!this.config.get('showCurrentBranchByDefault', false);
    }
    get showSignatureStatus() {
        return !!this.config.get('showSignatureStatus', false);
    }
    get showStatusBarItem() {
        return !!this.config.get('showStatusBarItem', true);
    }
    get showTags() {
        return !!this.config.get('showTags', true);
    }
    get showUncommittedChanges() {
        return !!this.config.get('showUncommittedChanges', true);
    }
    get showUntrackedFiles() {
        return !!this.config.get('showUntrackedFiles', true);
    }
    get tabIconColourTheme() {
        return this.config.get('tabIconColourTheme', 'colour') === 'grey'
            ? 1
            : 0;
    }
    get useMailmap() {
        return !!this.config.get('useMailmap', false);
    }
    get gitPath() {
        return vscode.workspace.getConfiguration('git').get('path', null);
    }
}
function getConfig() {
    return new Config();
}
exports.getConfig = getConfig;
function mergeConfigObjects(base, user) {
    if (typeof base !== typeof user)
        return;
    let keys = Object.keys(base);
    for (let i = 0; i < keys.length; i++) {
        if (typeof base[keys[i]] === 'object') {
            if (typeof user[keys[i]] === 'object') {
                mergeConfigObjects(base[keys[i]], user[keys[i]]);
            }
        }
        else if (typeof user[keys[i]] === typeof base[keys[i]]) {
            base[keys[i]] = user[keys[i]];
        }
    }
}
//# sourceMappingURL=config.js.map