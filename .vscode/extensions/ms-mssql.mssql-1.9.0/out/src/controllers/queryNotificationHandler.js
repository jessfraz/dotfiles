"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const serviceclient_1 = require("../languageservice/serviceclient");
const queryExecute_1 = require("../models/contracts/queryExecute");
class QueryNotificationHandler {
    constructor() {
        // public for testing only
        this._queryRunners = new Map();
        // public for testing only
        this._handlerCallbackQueue = [];
    }
    static get instance() {
        if (QueryNotificationHandler._instance) {
            return this._instance;
        }
        else {
            this._instance = new QueryNotificationHandler();
            this._instance.initialize();
            return this._instance;
        }
    }
    // register the handler to handle notifications for queries
    initialize() {
        serviceclient_1.default.instance.onNotification(queryExecute_1.QueryExecuteCompleteNotification.type, this.handleQueryCompleteNotification());
        serviceclient_1.default.instance.onNotification(queryExecute_1.QueryExecuteBatchStartNotification.type, this.handleBatchStartNotification());
        serviceclient_1.default.instance.onNotification(queryExecute_1.QueryExecuteBatchCompleteNotification.type, this.handleBatchCompleteNotification());
        serviceclient_1.default.instance.onNotification(queryExecute_1.QueryExecuteResultSetCompleteNotification.type, this.handleResultSetCompleteNotification());
        serviceclient_1.default.instance.onNotification(queryExecute_1.QueryExecuteMessageNotification.type, this.handleMessageNotification());
    }
    // Registers queryRunners with their uris to distribute notifications.
    // Ensures that notifications are handled in the correct order by handling
    // enqueued handlers first.
    // public for testing only
    registerRunner(runner, uri) {
        // If enqueueOrRun was called before registerRunner for the current query,
        // _handlerCallbackQueue will be non-empty. Run all handlers in the queue first
        // so that notifications are handled in order they arrived
        while (this._handlerCallbackQueue.length > 0) {
            let handler = this._handlerCallbackQueue.shift();
            handler(runner);
        }
        // Set the runner for any other handlers if the runner is in use by the
        // current query or a subsequent query
        if (!runner.hasCompleted) {
            this._queryRunners.set(uri, runner);
        }
    }
    // Handles logic to run the given handlerCallback at the appropriate time. If the given runner is
    // undefined, the handlerCallback is put on the _handlerCallbackQueue to be run once the runner is set
    // public for testing only
    enqueueOrRun(handlerCallback, runner) {
        if (runner === undefined) {
            this._handlerCallbackQueue.push(handlerCallback);
        }
        else {
            handlerCallback(runner);
        }
    }
    // Distributes result completion notification to appropriate methods
    // public for testing only
    handleQueryCompleteNotification() {
        const self = this;
        return (event) => {
            let handlerCallback = (runner) => {
                runner.handleQueryComplete(event);
                // There should be no more notifications for this query, so unbind the QueryRunner if it
                // is present in the map. If it is not present, handleQueryCompleteNotification must have been
                // called before registerRunner
                if (self._queryRunners.get(event.ownerUri) !== undefined) {
                    self._queryRunners.delete(event.ownerUri);
                }
            };
            self.enqueueOrRun(handlerCallback, self._queryRunners.get(event.ownerUri));
        };
    }
    // Distributes batch start notification to appropriate methods
    // public for testing only
    handleBatchStartNotification() {
        const self = this;
        return (event) => {
            let handlerCallback = (runner) => {
                runner.handleBatchStart(event);
            };
            self.enqueueOrRun(handlerCallback, self._queryRunners.get(event.ownerUri));
        };
    }
    // Distributes batch completion notification to appropriate methods
    // public for testing only
    handleBatchCompleteNotification() {
        const self = this;
        return (event) => {
            let handlerCallback = (runner) => {
                runner.handleBatchComplete(event);
            };
            self.enqueueOrRun(handlerCallback, self._queryRunners.get(event.ownerUri));
        };
    }
    // Distributes result set completion notification to appropriate methods
    // public for testing only
    handleResultSetCompleteNotification() {
        const self = this;
        return (event) => {
            let handlerCallback = (runner) => {
                runner.handleResultSetComplete(event);
            };
            self.enqueueOrRun(handlerCallback, self._queryRunners.get(event.ownerUri));
        };
    }
    // Distributes message notifications
    // public for testing only
    handleMessageNotification() {
        const self = this;
        return (event) => {
            let handlerCallback = (runner) => {
                runner.handleMessage(event);
            };
            self.enqueueOrRun(handlerCallback, self._queryRunners.get(event.ownerUri));
        };
    }
}
exports.QueryNotificationHandler = QueryNotificationHandler;

//# sourceMappingURL=queryNotificationHandler.js.map
