"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const objectExplorerService_1 = require("./objectExplorerService");
class ObjectExplorerProvider {
    constructor(connectionManager) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._objectExplorerService = new objectExplorerService_1.ObjectExplorerService(connectionManager, this);
    }
    refresh(nodeInfo) {
        this._onDidChangeTreeData.fire(nodeInfo);
    }
    getTreeItem(node) {
        return node;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = yield this._objectExplorerService.getChildren(element);
            if (children) {
                return children;
            }
        });
    }
    createSession(promise, connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.createSession(promise, connectionCredentials);
        });
    }
    expandNode(node, sessionId, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.expandNode(node, sessionId, promise);
        });
    }
    getConnectionCredentials(sessionId) {
        if (sessionId) {
            return this._objectExplorerService.getConnectionCredentials(sessionId);
        }
        return undefined;
    }
    removeObjectExplorerNode(node, isDisconnect = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.removeObjectExplorerNode(node, isDisconnect);
        });
    }
    refreshNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.refreshNode(node);
        });
    }
    signInNodeServer(node) {
        this._objectExplorerService.signInNodeServer(node);
    }
    updateNode(node) {
        this._objectExplorerService.updateNode(node);
    }
    removeConnectionNodes(connections) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerService.removeConnectionNodes(connections);
        });
    }
    addDisconnectedNode(connectionCredentials) {
        this._objectExplorerService.addDisconnectedNode(connectionCredentials);
    }
    /** Getters */
    get currentNode() {
        return this._objectExplorerService.currentNode;
    }
    get objectExplorerExists() {
        return this._objectExplorerExists;
    }
    get rootNodeConnections() {
        return this._objectExplorerService.rootNodeConnections;
    }
    /** Setters */
    set objectExplorerExists(value) {
        this._objectExplorerExists = value;
    }
    /* Only for testing purposes */
    set objectExplorerService(value) {
        this._objectExplorerService = value;
    }
    set currentNode(node) {
        this._objectExplorerService.currentNode = node;
    }
}
exports.ObjectExplorerProvider = ObjectExplorerProvider;

//# sourceMappingURL=objectExplorerProvider.js.map
