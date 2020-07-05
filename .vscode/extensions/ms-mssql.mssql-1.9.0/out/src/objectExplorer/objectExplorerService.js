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
const createSessionRequest_1 = require("../models/contracts/objectExplorer/createSessionRequest");
const expandNodeRequest_1 = require("../models/contracts/objectExplorer/expandNodeRequest");
const vscode_1 = require("vscode");
const refreshSessionRequest_1 = require("../models/contracts/objectExplorer/refreshSessionRequest");
const closeSessionRequest_1 = require("../models/contracts/objectExplorer/closeSessionRequest");
const treeNodeInfo_1 = require("./treeNodeInfo");
const LocalizedConstants = require("../constants/localizedConstants");
const addConnectionTreeNode_1 = require("./addConnectionTreeNode");
const accountSignInTreeNode_1 = require("./accountSignInTreeNode");
const connectTreeNode_1 = require("./connectTreeNode");
const protocol_1 = require("../protocol");
const Constants = require("../constants/constants");
const objectExplorerUtils_1 = require("./objectExplorerUtils");
const Utils = require("../models/utils");
const connectionCredentials_1 = require("../models/connectionCredentials");
class ObjectExplorerService {
    constructor(_connectionManager, _objectExplorerProvider) {
        this._connectionManager = _connectionManager;
        this._objectExplorerProvider = _objectExplorerProvider;
        this._client = this._connectionManager.client;
        this._treeNodeToChildrenMap = new Map();
        this._rootTreeNodeArray = new Array();
        this._sessionIdToConnectionCredentialsMap = new Map();
        this._nodePathToNodeLabelMap = new Map();
        this._sessionIdToPromiseMap = new Map();
        this._expandParamsToPromiseMap = new Map();
        this._expandParamsToTreeNodeInfoMap = new Map();
        this._client.onNotification(createSessionRequest_1.CreateSessionCompleteNotification.type, this.handleSessionCreatedNotification());
        this._client.onNotification(expandNodeRequest_1.ExpandCompleteNotification.type, this.handleExpandSessionNotification());
    }
    handleSessionCreatedNotification() {
        const self = this;
        const handler = (result) => __awaiter(this, void 0, void 0, function* () {
            if (result.success) {
                let nodeLabel = this._nodePathToNodeLabelMap.get(result.rootNode.nodePath);
                // if no node label, check if it has a name in saved profiles
                // in case this call came from new query
                let savedConnections = this._connectionManager.connectionStore.loadAllConnections();
                let nodeConnection = this._sessionIdToConnectionCredentialsMap.get(result.sessionId);
                for (let connection of savedConnections) {
                    if (Utils.isSameConnection(connection.connectionCreds, nodeConnection)) {
                        // if it's not the defaul label
                        if (connection.label !== connection.connectionCreds.server) {
                            nodeLabel = connection.label;
                        }
                        break;
                    }
                }
                // set connection and other things
                let node;
                if (self._currentNode && (self._currentNode.sessionId === result.sessionId)) {
                    nodeLabel = !nodeLabel ? self.createNodeLabel(self._currentNode.connectionCredentials) : nodeLabel;
                    node = treeNodeInfo_1.TreeNodeInfo.fromNodeInfo(result.rootNode, result.sessionId, undefined, self._currentNode.connectionCredentials, nodeLabel, Constants.serverLabel);
                }
                else {
                    nodeLabel = !nodeLabel ? self.createNodeLabel(nodeConnection) : nodeLabel;
                    node = treeNodeInfo_1.TreeNodeInfo.fromNodeInfo(result.rootNode, result.sessionId, undefined, nodeConnection, nodeLabel, Constants.serverLabel);
                }
                // make a connection if not connected already
                const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
                if (!this._connectionManager.isConnected(nodeUri) &&
                    !this._connectionManager.isConnecting(nodeUri)) {
                    const profile = node.connectionCredentials;
                    yield this._connectionManager.connect(nodeUri, profile);
                }
                self.updateNode(node);
                self._objectExplorerProvider.objectExplorerExists = true;
                const promise = self._sessionIdToPromiseMap.get(result.sessionId);
                // remove the sign in node once the session is created
                if (self._treeNodeToChildrenMap.has(node)) {
                    self._treeNodeToChildrenMap.delete(node);
                }
                return promise.resolve(node);
            }
            else {
                // create session failure
                if (self._currentNode.connectionCredentials.password) {
                    self._currentNode.connectionCredentials.password = '';
                }
                let error = LocalizedConstants.connectErrorLabel;
                if (result.errorMessage) {
                    error += ` : ${result.errorMessage}`;
                }
                self._connectionManager.vscodeWrapper.showErrorMessage(error);
                const promise = self._sessionIdToPromiseMap.get(result.sessionId);
                // handle session failure because of firewall issue
                if (objectExplorerUtils_1.ObjectExplorerUtils.isFirewallError(result.errorMessage)) {
                    let handleFirewallResult = yield self._connectionManager.firewallService.handleFirewallRule(Constants.errorFirewallRule, result.errorMessage);
                    if (handleFirewallResult.result && handleFirewallResult.ipAddress) {
                        const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(self._currentNode);
                        const profile = self._currentNode.connectionCredentials;
                        self.updateNode(self._currentNode);
                        self._connectionManager.connectionUI.handleFirewallError(nodeUri, profile, handleFirewallResult.ipAddress);
                    }
                }
                if (promise) {
                    return promise.resolve(undefined);
                }
            }
        });
        return handler;
    }
    getParentFromExpandParams(params) {
        for (let key of this._expandParamsToTreeNodeInfoMap.keys()) {
            if (key.sessionId === params.sessionId &&
                key.nodePath === params.nodePath) {
                return this._expandParamsToTreeNodeInfoMap.get(key);
            }
        }
        return undefined;
    }
    handleExpandSessionNotification() {
        const self = this;
        const handler = (result) => {
            if (result && result.nodes) {
                const credentials = self._sessionIdToConnectionCredentialsMap.get(result.sessionId);
                const expandParams = {
                    sessionId: result.sessionId,
                    nodePath: result.nodePath
                };
                const parentNode = self.getParentFromExpandParams(expandParams);
                const children = result.nodes.map(node => treeNodeInfo_1.TreeNodeInfo.fromNodeInfo(node, result.sessionId, parentNode, credentials));
                self._treeNodeToChildrenMap.set(parentNode, children);
                for (let key of self._expandParamsToPromiseMap.keys()) {
                    if (key.sessionId === expandParams.sessionId &&
                        key.nodePath === expandParams.nodePath) {
                        let promise = self._expandParamsToPromiseMap.get(key);
                        promise.resolve(children);
                        self._expandParamsToPromiseMap.delete(key);
                        self._expandParamsToTreeNodeInfoMap.delete(key);
                        return;
                    }
                }
            }
        };
        return handler;
    }
    expandNode(node, sessionId, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            const expandParams = {
                sessionId: sessionId,
                nodePath: node.nodePath
            };
            this._expandParamsToPromiseMap.set(expandParams, promise);
            this._expandParamsToTreeNodeInfoMap.set(expandParams, node);
            const response = yield this._connectionManager.client.sendRequest(expandNodeRequest_1.ExpandRequest.type, expandParams);
            if (response) {
                return response;
            }
            else {
                this._expandParamsToPromiseMap.delete(expandParams);
                this._expandParamsToTreeNodeInfoMap.delete(expandParams);
                promise.resolve(undefined);
                return undefined;
            }
        });
    }
    updateNode(node) {
        for (let rootTreeNode of this._rootTreeNodeArray) {
            if (Utils.isSameConnection(node.connectionCredentials, rootTreeNode.connectionCredentials) &&
                rootTreeNode.label === node.label) {
                const index = this._rootTreeNodeArray.indexOf(rootTreeNode);
                delete this._rootTreeNodeArray[index];
                this._rootTreeNodeArray[index] = node;
                return;
            }
        }
        this._rootTreeNodeArray.push(node);
    }
    /**
     * Clean all children of the node
     * @param node Node to cleanup
     */
    cleanNodeChildren(node) {
        if (this._treeNodeToChildrenMap.has(node)) {
            let stack = this._treeNodeToChildrenMap.get(node);
            while (stack.length > 0) {
                let child = stack.pop();
                if (this._treeNodeToChildrenMap.has(child)) {
                    stack.concat(this._treeNodeToChildrenMap.get(child));
                }
                this._treeNodeToChildrenMap.delete(child);
            }
            this._treeNodeToChildrenMap.delete(node);
        }
    }
    /**
     * Sort the array based on server names
     * Public only for testing purposes
     * @param array array that needs to be sorted
     */
    sortByServerName(array) {
        const sortedNodeArray = array.sort((a, b) => {
            return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
        });
        return sortedNodeArray;
    }
    /**
     * Get nodes from saved connections
     */
    getSavedConnections() {
        let savedConnections = this._connectionManager.connectionStore.loadAllConnections();
        savedConnections.forEach((conn) => {
            let nodeLabel = conn.label === conn.connectionCreds.server ?
                this.createNodeLabel(conn.connectionCreds) : conn.label;
            this._nodePathToNodeLabelMap.set(conn.connectionCreds.server, nodeLabel);
            let node = new treeNodeInfo_1.TreeNodeInfo(nodeLabel, Constants.disconnectedServerLabel, vscode_1.TreeItemCollapsibleState.Collapsed, undefined, undefined, Constants.disconnectedServerLabel, undefined, conn.connectionCreds, undefined);
            this._rootTreeNodeArray.push(node);
        });
    }
    /**
     * Clean up expansion promises for a node
     * @param node The selected node
     */
    cleanExpansionPromise(node) {
        for (const key of this._expandParamsToPromiseMap.keys()) {
            if (key.sessionId === node.sessionId &&
                key.nodePath === node.nodePath) {
                this._expandParamsToPromiseMap.delete(key);
                this._expandParamsToTreeNodeInfoMap.delete(key);
            }
        }
    }
    /**
     * Helper to show the Add Connection node
     */
    getAddConnectionNode() {
        this._rootTreeNodeArray = [];
        this._objectExplorerProvider.objectExplorerExists = true;
        return [new addConnectionTreeNode_1.AddConnectionTreeNode()];
    }
    /**
     * Handles a generic OE create session failure by creating a
     * sign in node
     */
    createSignInNode(element) {
        const signInNode = new accountSignInTreeNode_1.AccountSignInTreeNode(element);
        this._treeNodeToChildrenMap.set(element, [signInNode]);
        return [signInNode];
    }
    /**
     * Handles a connection error after an OE session is
     * sucessfully created by creating a connect node
     */
    createConnectTreeNode(element) {
        const connectNode = new connectTreeNode_1.ConnectTreeNode(element);
        this._treeNodeToChildrenMap.set(element, [connectNode]);
        return [connectNode];
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element) {
                // set current node for very first expansion of disconnected node
                if (this._currentNode !== element) {
                    this._currentNode = element;
                }
                // get cached children
                if (this._treeNodeToChildrenMap.has(element)) {
                    return this._treeNodeToChildrenMap.get(element);
                }
                else {
                    // check if session exists
                    if (element.sessionId) {
                        // clean created session promise
                        this._sessionIdToPromiseMap.delete(element.sessionId);
                        // node expansion
                        let promise = new protocol_1.Deferred();
                        yield this.expandNode(element, element.sessionId, promise);
                        let children = yield promise;
                        if (children) {
                            // clean expand session promise
                            this.cleanExpansionPromise(element);
                            return children;
                        }
                        else {
                            return undefined;
                        }
                    }
                    else {
                        // start node session
                        let promise = new protocol_1.Deferred();
                        const sessionId = yield this.createSession(promise, element.connectionCredentials);
                        if (sessionId) {
                            let node = yield promise;
                            // if the server was found but connection failed
                            if (!node) {
                                let profile = element.connectionCredentials;
                                let password = yield this._connectionManager.connectionStore.lookupPassword(profile);
                                if (password) {
                                    return this.createSignInNode(element);
                                }
                                else {
                                    return this.createConnectTreeNode(element);
                                }
                            }
                        }
                        else {
                            // If node create session failed (server wasn't found)
                            return this.createSignInNode(element);
                        }
                        // otherwise expand the node by refreshing the root
                        // to add connected context key
                        this._objectExplorerProvider.refresh(undefined);
                    }
                }
            }
            else {
                // retrieve saved connections first when opening object explorer
                // for the first time
                let savedConnections = this._connectionManager.connectionStore.loadAllConnections();
                // if there are no saved connections
                // show the add connection node
                if (savedConnections.length === 0) {
                    return this.getAddConnectionNode();
                }
                // if OE doesn't exist the first time
                // then build the nodes off of saved connections
                if (!this._objectExplorerProvider.objectExplorerExists) {
                    // if there are actually saved connections
                    this._rootTreeNodeArray = [];
                    this.getSavedConnections();
                    this._objectExplorerProvider.objectExplorerExists = true;
                    return this.sortByServerName(this._rootTreeNodeArray);
                }
                else {
                    // otherwise returned the cached nodes
                    return this.sortByServerName(this._rootTreeNodeArray);
                }
            }
        });
    }
    /**
     * Create an OE session for the given connection credentials
     * otherwise prompt the user to select a connection to make an
     * OE out of
     * @param connectionCredentials Connection Credentials for a node
     */
    createSession(promise, connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!connectionCredentials) {
                const connectionUI = this._connectionManager.connectionUI;
                connectionCredentials = yield connectionUI.showConnections(false);
            }
            if (connectionCredentials) {
                // connection string based credential
                if (connectionCredentials.connectionString) {
                    if (connectionCredentials.savePassword) {
                        // look up connection string
                        let connectionString = yield this._connectionManager.connectionStore.lookupPassword(connectionCredentials, true);
                        connectionCredentials.connectionString = connectionString;
                    }
                }
                else {
                    if (connectionCredentials_1.ConnectionCredentials.isPasswordBasedCredential(connectionCredentials)) {
                        // show password prompt if SQL Login and password isn't saved
                        let password = connectionCredentials.password;
                        if (Utils.isEmpty(password)) {
                            // if password isn't saved
                            if (!connectionCredentials.savePassword) {
                                // prompt for password
                                password = yield this._connectionManager.connectionUI.promptForPassword();
                                if (!password) {
                                    promise.resolve(undefined);
                                    return undefined;
                                }
                            }
                            else {
                                // look up saved password
                                password = yield this._connectionManager.connectionStore.lookupPassword(connectionCredentials);
                            }
                            connectionCredentials.password = password;
                        }
                    }
                }
                const connectionDetails = connectionCredentials_1.ConnectionCredentials.createConnectionDetails(connectionCredentials);
                const response = yield this._connectionManager.client.sendRequest(createSessionRequest_1.CreateSessionRequest.type, connectionDetails);
                if (response) {
                    this._sessionIdToConnectionCredentialsMap.set(response.sessionId, connectionCredentials);
                    this._sessionIdToPromiseMap.set(response.sessionId, promise);
                    return response.sessionId;
                }
            }
            else {
                // no connection was made
                promise.resolve(undefined);
                return undefined;
            }
        });
    }
    getConnectionCredentials(sessionId) {
        if (this._sessionIdToConnectionCredentialsMap.has(sessionId)) {
            return this._sessionIdToConnectionCredentialsMap.get(sessionId);
        }
        return undefined;
    }
    removeObjectExplorerNode(node, isDisconnect = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.closeSession(node);
            const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
            yield this._connectionManager.disconnect(nodeUri);
            if (!isDisconnect) {
                const index = this._rootTreeNodeArray.indexOf(node, 0);
                if (index > -1) {
                    this._rootTreeNodeArray.splice(index, 1);
                }
            }
            else {
                node.nodeType = Constants.disconnectedServerLabel;
                node.contextValue = Constants.disconnectedServerLabel;
                node.sessionId = undefined;
                if (!node.connectionCredentials.savePassword) {
                    node.connectionCredentials.password = '';
                }
                // make a new node to show disconnected behavior
                let disconnectedNode = new treeNodeInfo_1.TreeNodeInfo(node.label, Constants.disconnectedServerLabel, node.collapsibleState, node.nodePath, node.nodeStatus, Constants.disconnectedServerLabel, undefined, node.connectionCredentials, node.parentNode);
                this.updateNode(disconnectedNode);
                this._currentNode = disconnectedNode;
                this._treeNodeToChildrenMap.set(this._currentNode, [new connectTreeNode_1.ConnectTreeNode(this._currentNode)]);
            }
            this._nodePathToNodeLabelMap.delete(node.nodePath);
            this.cleanNodeChildren(node);
        });
    }
    removeConnectionNodes(connections) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let conn of connections) {
                for (let node of this._rootTreeNodeArray) {
                    if (Utils.isSameConnection(node.connectionCredentials, conn)) {
                        yield this.removeObjectExplorerNode(node);
                    }
                }
            }
        });
    }
    refreshNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshParams = {
                sessionId: node.sessionId,
                nodePath: node.nodePath
            };
            let response = yield this._connectionManager.client.sendRequest(refreshSessionRequest_1.RefreshRequest.type, refreshParams);
            if (response) {
                this._treeNodeToChildrenMap.delete(node);
            }
            return this._objectExplorerProvider.refresh(node);
        });
    }
    signInNodeServer(node) {
        if (this._treeNodeToChildrenMap.has(node)) {
            this._treeNodeToChildrenMap.delete(node);
        }
    }
    addDisconnectedNode(connectionCredentials) {
        const label = connectionCredentials.profileName ?
            connectionCredentials.profileName :
            this.createNodeLabel(connectionCredentials);
        const node = new treeNodeInfo_1.TreeNodeInfo(label, Constants.disconnectedServerLabel, vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, Constants.disconnectedServerLabel, undefined, connectionCredentials, undefined);
        this.updateNode(node);
    }
    createNodeLabel(credentials) {
        let database = credentials.database;
        const server = credentials.server;
        const authType = credentials.authenticationType;
        let userOrAuthType = authType;
        if (authType === Constants.sqlAuthentication) {
            userOrAuthType = credentials.user;
        }
        if (!database || database === '') {
            database = LocalizedConstants.defaultDatabaseLabel;
        }
        return `${server}, ${database} (${userOrAuthType})`;
    }
    /**
     * Sends a close session request
     * @param node
     */
    closeSession(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.sessionId) {
                const closeSessionParams = {
                    sessionId: node.sessionId
                };
                const response = yield this._connectionManager.client.sendRequest(closeSessionRequest_1.CloseSessionRequest.type, closeSessionParams);
                if (response && response.success) {
                    this._sessionIdToConnectionCredentialsMap.delete(response.sessionId);
                    if (this._sessionIdToPromiseMap.has(node.sessionId)) {
                        this._sessionIdToPromiseMap.delete(node.sessionId);
                    }
                    const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
                    yield this._connectionManager.disconnect(nodeUri);
                    this.cleanNodeChildren(node);
                    return;
                }
            }
            return;
        });
    }
    /** Getters */
    get currentNode() {
        return this._currentNode;
    }
    get rootTreeNodeArray() {
        return this._rootTreeNodeArray;
    }
    get rootNodeConnections() {
        const connections = this._rootTreeNodeArray.map(node => node.connectionCredentials);
        return connections;
    }
    /**
     * Setters
     */
    set currentNode(node) {
        this._currentNode = node;
    }
}
exports.ObjectExplorerService = ObjectExplorerService;

//# sourceMappingURL=objectExplorerService.js.map
