"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semmle_vscode_utils_1 = require("semmle-vscode-utils");
/**
 * Base class for "discovery" operations, which scan the file system to find specific kinds of
 * files. This class automatically prevents more than one discovery operation from running at the
 * same time.
 */
class Discovery extends semmle_vscode_utils_1.DisposableObject {
    constructor() {
        super();
        this.retry = false;
        this.discoveryInProgress = false;
    }
    /**
     * Force the discovery process to run. Normally invoked by the derived class when a relevant file
     * system change is detected.
     */
    refresh() {
        // We avoid having multiple discovery operations in progress at the same time. Otherwise, if we
        // got a storm of refresh requests due to, say, the copying or deletion of a large directory
        // tree, we could potentially spawn a separate simultaneous discovery operation for each
        // individual file change notification.
        // Our approach is to spawn a discovery operation immediately upon receiving the first refresh
        // request. If we receive any additional refresh requests before the first one is complete, we
        // record this fact by setting `this.retry = true`. When the original discovery operation
        // completes, we discard its results and spawn another one to account for that additional
        // changes that have happened since.
        // The means that for the common case of a single file being modified, we'll complete the
        // discovery and update as soon as possible. If multiple files are being modified, we'll
        // probably wind up doing discovery at least twice.
        // We could choose to delay the initial discovery request by a second or two to wait for any
        // other change notifications that might be coming along. However, this would create more
        // latency in the common case, in order to save a bit of latency in the uncommon case.
        if (this.discoveryInProgress) {
            // There's already a discovery operation in progress. Tell it to restart when it's done.
            this.retry = true;
        }
        else {
            // No discovery in progress, so start one now.
            this.discoveryInProgress = true;
            this.launchDiscovery();
        }
    }
    /**
     * Starts the asynchronous discovery operation by invoking the `discover` function. When the
     * discovery operation completes, the `update` function will be invoked with the results of the
     * discovery.
     */
    launchDiscovery() {
        const discoveryPromise = this.discover();
        discoveryPromise.then(results => {
            if (!this.retry) {
                // Update any listeners with the results of the discovery.
                this.discoveryInProgress = false;
                this.update(results);
            }
        });
        discoveryPromise.finally(() => {
            if (this.retry) {
                // Another refresh request came in while we were still running a previous discovery
                // operation. Since the discovery results we just computed are now stale, we'll launch
                // another discovery operation instead of updating.
                // Note that by doing this inside of `finally`, we will relaunch discovery even if the
                // initial discovery operation failed.
                this.retry = false;
                this.launchDiscovery();
            }
        });
    }
}
exports.Discovery = Discovery;

//# sourceMappingURL=discovery.js.map