"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class DiffDocProvider {
    constructor(dataSource) {
        this.docs = new Map();
        this.onDidChangeEventEmitter = new vscode.EventEmitter();
        this.dataSource = dataSource;
        this.closeDocSubscription = vscode.workspace.onDidCloseTextDocument((doc) => this.docs.delete(doc.uri.toString()));
    }
    dispose() {
        this.closeDocSubscription.dispose();
        this.docs.clear();
        this.onDidChangeEventEmitter.dispose();
    }
    get onDidChange() {
        return this.onDidChangeEventEmitter.event;
    }
    provideTextDocumentContent(uri) {
        let document = this.docs.get(uri.toString());
        if (document)
            return document.value;
        let request = decodeDiffDocUri(uri);
        if (request === null)
            return '';
        return this.dataSource.getCommitFile(request.repo, request.commit, request.filePath).then((contents) => {
            let document = new DiffDocument(contents);
            this.docs.set(uri.toString(), document);
            return document.value;
        }, (errorMessage) => {
            utils_1.showErrorMessage('Unable to retrieve file: ' + errorMessage);
            return '';
        });
    }
}
exports.DiffDocProvider = DiffDocProvider;
DiffDocProvider.scheme = 'git-graph';
class DiffDocument {
    constructor(body) {
        this.body = body;
    }
    get value() {
        return this.body;
    }
}
function encodeDiffDocUri(repo, filePath, commit, type, diffSide) {
    if (commit === utils_1.UNCOMMITTED && type !== "D") {
        return vscode.Uri.file(path.join(repo, filePath));
    }
    let data, extension;
    if ((diffSide === 0 && type === "A") || (diffSide === 1 && type === "D")) {
        data = null;
        extension = '';
    }
    else {
        data = {
            filePath: utils_1.getPathFromStr(filePath),
            commit: commit,
            repo: repo
        };
        let extIndex = data.filePath.indexOf('.', data.filePath.lastIndexOf('/') + 1);
        extension = extIndex > -1 ? data.filePath.substring(extIndex) : '';
    }
    return vscode.Uri.file('file' + extension).with({
        scheme: DiffDocProvider.scheme,
        query: Buffer.from(JSON.stringify(data)).toString('base64')
    });
}
exports.encodeDiffDocUri = encodeDiffDocUri;
function decodeDiffDocUri(uri) {
    return JSON.parse(Buffer.from(uri.query, 'base64').toString());
}
exports.decodeDiffDocUri = decodeDiffDocUri;
//# sourceMappingURL=diffDocProvider.js.map