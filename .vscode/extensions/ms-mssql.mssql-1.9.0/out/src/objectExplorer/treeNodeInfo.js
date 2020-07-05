"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const objectExplorerUtils_1 = require("./objectExplorerUtils");
const Constants = require("../constants/constants");
class TreeNodeInfo extends vscode.TreeItem {
    constructor(label, contextValue, collapsibleState, nodePath, nodeStatus, nodeType, sessionId, connectionCredentials, parentNode, objectMetadata) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this._nodePath = nodePath;
        this._nodeStatus = nodeStatus;
        this._nodeType = nodeType;
        this._sessionId = sessionId;
        this._parentNode = parentNode;
        this._connectionCredentials = connectionCredentials;
        this._metadata = objectMetadata;
        this.iconPath = objectExplorerUtils_1.ObjectExplorerUtils.iconPath(this.nodeType);
    }
    static fromNodeInfo(nodeInfo, sessionId, parentNode, connectionCredentials, label, nodeType) {
        let type = nodeType ? nodeType : nodeInfo.nodeType;
        const treeNodeInfo = new TreeNodeInfo(label ? label : nodeInfo.label, type, nodeInfo.isLeaf ? vscode.TreeItemCollapsibleState.None :
            (type === Constants.serverLabel ? vscode.TreeItemCollapsibleState.Expanded :
                vscode.TreeItemCollapsibleState.Collapsed), nodeInfo.nodePath, nodeInfo.nodeStatus, type, sessionId, connectionCredentials, parentNode, nodeInfo.metadata);
        return treeNodeInfo;
    }
    /** Getters */
    get nodePath() {
        return this._nodePath;
    }
    get nodeStatus() {
        return this._nodeStatus;
    }
    get nodeType() {
        return this._nodeType;
    }
    get sessionId() {
        return this._sessionId;
    }
    get nodeSubType() {
        return this._nodeSubType;
    }
    get isLeaf() {
        return this._isLeaf;
    }
    get errorMessage() {
        return this._errorMessage;
    }
    get parentNode() {
        return this._parentNode;
    }
    get connectionCredentials() {
        return this._connectionCredentials;
    }
    get metadata() {
        return this._metadata;
    }
    /** Setters */
    set nodePath(value) {
        this._nodePath = value;
    }
    set nodeStatus(value) {
        this._nodeStatus = value;
    }
    set nodeType(value) {
        this._nodeType = value;
    }
    set nodeSubType(value) {
        this._nodeSubType = value;
    }
    set isLeaf(value) {
        this._isLeaf = value;
    }
    set errorMessage(value) {
        this._errorMessage = value;
    }
    set sessionId(value) {
        this._sessionId = value;
    }
    set parentNode(value) {
        this._parentNode = value;
    }
    set connectionCredentials(value) {
        this._connectionCredentials = value;
    }
}
exports.TreeNodeInfo = TreeNodeInfo;

//# sourceMappingURL=treeNodeInfo.js.map
