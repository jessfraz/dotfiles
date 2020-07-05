"use strict";
// 'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const jsbeautify = require('js-beautify');
const mkdirp = require('mkdirp');
function format(document, range) {
    if (range === null) {
        var start = new vscode.Position(0, 0);
        var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
        range = new vscode.Range(start, end);
    }
    var result = [];
    var content = document.getText(range);
    var formatted = beatify(content, document.languageId);
    if (formatted) {
        result.push(new vscode.TextEdit(range, formatted));
    }
    return result;
}
exports.format = format;
;
function getRootPath() {
    return vscode.workspace.rootPath || '.';
}
function beatify(documentContent, languageId) {
    var global = path.join(__dirname, 'formatter.json');
    var local = path.join(getRootPath(), '.vscode', 'formatter.json');
    var beatiFunc = null;
    switch (languageId) {
        case 'scss':
            languageId = 'css';
        case 'css':
            beatiFunc = jsbeautify.css;
            break;
        case 'json':
            languageId = 'javascript';
        case 'javascript':
            beatiFunc = jsbeautify.js;
            break;
        case 'html':
            beatiFunc = jsbeautify.html;
            break;
        default:
            showMesage('Sorry, this language is not supported. Only support Javascript, CSS and HTML.');
            break;
    }
    if (!beatiFunc)
        return;
    var beutifyOptions;
    try {
        beutifyOptions = require(local)[languageId];
    }
    catch (error) {
        try {
            beutifyOptions = require(global)[languageId];
        }
        catch (error) {
            beutifyOptions = {};
        }
    }
    return beatiFunc(documentContent, beutifyOptions);
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var docType = ['css', 'scss', 'javascript', 'html', 'json'];
    for (var i = 0, l = docType.length; i < l; i++) {
        registerDocType(docType[i]);
    }
    let formatter = new Formatter();
    context.subscriptions.push(vscode.commands.registerCommand('Lonefy.formatting', () => {
        formatter.beautify();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('Lonefy.formatterConfig', () => {
        formatter.openConfig(path.join(getRootPath(), '.vscode', 'formatter.json'), function () {
            showMesage('[Local]  After editing the file, remember to Restart VScode');
        }, function () {
            var fileName = path.join(__dirname, 'formatter.json');
            formatter.openConfig(fileName, function () {
                showMesage('[Golbal]  After editing the file, remember to Restart VScode');
            }, function () {
                showMesage('Not found file: ' + fileName);
            });
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('Lonefy.formatterCreateLocalConfig', () => {
        formatter.generateLocalConfig();
    }));
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
        formatter.onSave(e);
    }));
    function registerDocType(type) {
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(type, {
            provideDocumentFormattingEdits: (document, options, token) => {
                return formatter.registerBeautify(null);
            }
        }));
        context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(type, {
            provideDocumentRangeFormattingEdits: (document, range, options, token) => {
                var start = new vscode.Position(0, 0);
                var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                return formatter.registerBeautify(new vscode.Range(start, end));
            }
        }));
    }
}
exports.activate = activate;
class Formatter {
    beautify() {
        // Create as needed
        let window = vscode.window;
        let range;
        // Get the current text editor
        let activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let document = activeEditor.document;
        if (range === null) {
            var start = new vscode.Position(0, 0);
            var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            range = new vscode.Range(start, end);
        }
        var result = [];
        var content = document.getText(range);
        var formatted = beatify(content, document.languageId);
        if (formatted) {
            return activeEditor.edit(function (editor) {
                var start = new vscode.Position(0, 0);
                var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                range = new vscode.Range(start, end);
                return editor.replace(range, formatted);
            });
        }
    }
    registerBeautify(range) {
        // Create as needed
        let window = vscode.window;
        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        let document = editor.document;
        return format(document, range);
    }
    generateLocalConfig() {
        var local = path.join(getRootPath(), '.vscode', 'formatter.json');
        var content = fs.readFileSync(path.join(__dirname, 'formatter.json')).toString('utf8');
        mkdirp.sync(path.dirname(local));
        fs.stat(local, function (err, stat) {
            if (err == null) {
                showMesage('Local config file existed: ' + local);
            }
            else if (err.code == 'ENOENT') {
                fs.writeFile(local, content, function (e) {
                    showMesage('Generate local config file: ' + local);
                });
            }
            else {
                showMesage('Some other error: ' + err.code);
            }
        });
    }
    openConfig(filename, succ, fail) {
        vscode.workspace.openTextDocument(filename).then(function (textDocument) {
            if (!textDocument) {
                showMesage('Can not open file!');
                return;
            }
            vscode.window.showTextDocument(textDocument).then(function (editor) {
                if (!editor) {
                    showMesage('Can not show document!');
                    return;
                }
                !!succ && succ();
            }, function () {
                showMesage('Can not Show file: ' + filename);
                return;
            });
        }, function () {
            !!fail && fail();
            return;
        });
    }
    onSave(e) {
        var { document } = e;
        var docType = ['css', 'scss', 'javascript', 'html', 'json'];
        var global = path.join(__dirname, 'formatter.json');
        var local = path.join(getRootPath(), '.vscode', 'formatter.json');
        var onSave;
        try {
            onSave = require(local).onSave;
        }
        catch (error) {
            try {
                onSave = require(global).onSave;
            }
            catch (error) {
                onSave = true;
            }
        }
        if (!onSave) {
            return;
        }
        if (docType.indexOf(document.languageId) == -1) {
            return;
        }
        var start = new vscode.Position(0, 0);
        var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
        var range = new vscode.Range(start, end);
        var result = [];
        var content = document.getText(range);
        var formatted = beatify(content, document.languageId);
        if (formatted) {
            var start = new vscode.Position(0, 0);
            var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            range = new vscode.Range(start, end);
            var edit = vscode.TextEdit.replace(range, formatted);
            e.waitUntil(Promise.resolve([edit]));
        }
    }
}
function showMesage(msg) {
    vscode.window.showInformationMessage(msg);
}
//# sourceMappingURL=extension.js.map