"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const vscode = require("vscode");
/**
 * Service for creating untitled documents for SQL query
 */
class UntitledSqlDocumentService {
    constructor(vscodeWrapper) {
        this.vscodeWrapper = vscodeWrapper;
    }
    /**
     * Creates new untitled document for SQL query and opens in new editor tab
     * with optional content
     */
    newQuery(content) {
        return __awaiter(this, void 0, void 0, function* () {
            // Open an untitled document. So the  file doesn't have to exist in disk
            let doc = yield this.vscodeWrapper.openMsSqlTextDocument(content);
            // Show the new untitled document in the editor's first tab and change the focus to it.
            const editor = yield this.vscodeWrapper.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: false,
                preview: false
            });
            const position = editor.selection.active;
            let newPosition = position.with(position.line + 1, 0);
            let newSelection = new vscode.Selection(newPosition, newPosition);
            editor.selection = newSelection;
            return editor;
        });
    }
}
exports.default = UntitledSqlDocumentService;

//# sourceMappingURL=untitledSqlDocumentService.js.map
