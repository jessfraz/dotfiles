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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const jsSnippets = require('../snippets/snippets.json');
const tsSnippets = require('../snippets/ts-snippets.json');
const convertSnippetArrayToString = (snippetArray) => snippetArray.join('\n');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "snippet-search" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('extension.snippetSearch', () => __awaiter(this, void 0, void 0, function* () {
        const javascriptSnippets = Object.entries(jsSnippets);
        const typescriptSnippets = Object.entries(tsSnippets);
        const snippetsArray = javascriptSnippets.concat(typescriptSnippets);
        const items = snippetsArray.map(([shortDescription, { prefix, body, description }], index) => {
            const value = typeof prefix === 'string' ? prefix : prefix[0];
            return {
                id: index,
                description: description || shortDescription,
                label: value,
                value,
                body
            };
        });
        const options = {
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: 'Search snippet'
        };
        const snippet = (yield vscode.window.showQuickPick(items, options)) || {
            body: ''
        };
        const activeTextEditor = vscode.window.activeTextEditor;
        const body = typeof snippet.body === 'string'
            ? snippet.body
            : convertSnippetArrayToString(snippet.body);
        activeTextEditor &&
            activeTextEditor.insertSnippet(new vscode.SnippetString(body));
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map