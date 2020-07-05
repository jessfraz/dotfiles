"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
// Import from the specific module within `semmle-vscode-utils`, rather than via `index.ts`, because
// we avoid taking an accidental runtime dependency on `vscode` this way.
const disposable_object_1 = require("semmle-vscode-utils/out/disposable-object");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
const cli = require("./cli");
const messages_1 = require("./messages");
const messages = require("./messages");
/** A running query server process and its associated message connection. */
class ServerProcess {
    constructor(child, connection, logger) {
        this.child = child;
        this.connection = connection;
        this.logger = logger;
    }
    dispose() {
        this.logger.log('Stopping query server...');
        this.connection.dispose();
        this.child.stdin.end();
        this.child.stderr.destroy();
        // TODO kill the process if it doesn't terminate after a certain time limit.
        // On Windows, we usually have to terminate the process before closing its stdout.
        this.child.stdout.destroy();
        this.logger.log('Stopped query server.');
    }
}
/**
 * Client that manages a query server process.
 * The server process is started upon initialization and tracked during its lifetime.
 * The server process is disposed when the client is disposed, or if the client asks
 * to restart it (which disposes the existing process and starts a new one).
 */
class QueryServerClient extends disposable_object_1.DisposableObject {
    constructor(config, cliServer, opts, withProgressReporting) {
        super();
        this.config = config;
        this.cliServer = cliServer;
        this.opts = opts;
        // When the query server configuration changes, restart the query server.
        if (config.onDidChangeQueryServerConfiguration !== undefined) {
            this.push(config.onDidChangeQueryServerConfiguration(async () => {
                this.logger.log('Restarting query server due to configuration changes...');
                await this.restartQueryServer();
            }, this));
        }
        this.withProgressReporting = withProgressReporting;
        this.nextCallback = 0;
        this.nextProgress = 0;
        this.progressCallbacks = {};
        this.evaluationResultCallbacks = {};
    }
    get logger() {
        return this.opts.logger;
    }
    /** Stops the query server by disposing of the current server process. */
    stopQueryServer() {
        if (this.serverProcess !== undefined) {
            this.disposeAndStopTracking(this.serverProcess);
        }
        else {
            this.logger.log('No server process to be stopped.');
        }
    }
    /** Restarts the query server by disposing of the current server process and then starting a new one. */
    async restartQueryServer() {
        this.stopQueryServer();
        await this.startQueryServer();
    }
    showLog() {
        this.logger.show();
    }
    /** Starts a new query server process, sending progress messages to the status bar. */
    async startQueryServer() {
        // Use an arrow function to preserve the value of `this`.
        return this.withProgressReporting((progress, _) => this.startQueryServerImpl(progress));
    }
    /** Starts a new query server process, sending progress messages to the given reporter. */
    async startQueryServerImpl(progressReporter) {
        const ramArgs = await this.cliServer.resolveRam(this.config.queryMemoryMb, progressReporter);
        const args = ['--threads', this.config.numThreads.toString()].concat(ramArgs);
        if (this.config.debug) {
            args.push('--debug', '--tuple-counting');
        }
        const child = cli.spawnServer(this.config.codeQlPath, 'CodeQL query server', ['execute', 'query-server'], args, this.logger, data => this.logger.log(data.toString(), {
            trailingNewline: false,
            additionalLogLocation: this.activeQueryName
        }), undefined, // no listener for stdout
        progressReporter);
        progressReporter.report({ message: 'Connecting to CodeQL query server' });
        const connection = vscode_jsonrpc_1.createMessageConnection(child.stdout, child.stdin);
        connection.onRequest(messages_1.completeQuery, res => {
            if (!(res.runId in this.evaluationResultCallbacks)) {
                this.logger.log(`No callback associated with run id ${res.runId}, continuing without executing any callback`);
            }
            else {
                const baseLocation = this.logger.getBaseLocation();
                if (baseLocation && this.activeQueryName) {
                    res.logFileLocation = path.join(baseLocation, this.activeQueryName);
                }
                this.evaluationResultCallbacks[res.runId](res);
            }
            return {};
        });
        connection.onNotification(messages_1.progress, res => {
            const callback = this.progressCallbacks[res.id];
            if (callback) {
                callback(res);
            }
        });
        this.serverProcess = new ServerProcess(child, connection, this.opts.logger);
        // Ensure the server process is disposed together with this client.
        this.track(this.serverProcess);
        connection.listen();
        progressReporter.report({ message: 'Connected to CodeQL query server' });
        this.nextCallback = 0;
        this.nextProgress = 0;
        this.progressCallbacks = {};
        this.evaluationResultCallbacks = {};
    }
    registerCallback(callback) {
        const id = this.nextCallback++;
        this.evaluationResultCallbacks[id] = callback;
        return id;
    }
    unRegisterCallback(id) {
        delete this.evaluationResultCallbacks[id];
    }
    get serverProcessPid() {
        return this.serverProcess.child.pid;
    }
    async sendRequest(type, parameter, token, progress) {
        const id = this.nextProgress++;
        this.progressCallbacks[id] = progress;
        this.updateActiveQuery(type.method, parameter);
        try {
            if (this.serverProcess === undefined) {
                throw new Error('No query server process found.');
            }
            return await this.serverProcess.connection.sendRequest(type, { body: parameter, progressId: id }, token);
        }
        finally {
            delete this.progressCallbacks[id];
        }
    }
    /**
     * Updates the active query every time there is a new request to compile.
     * The active query is used to specify the side log.
     *
     * This isn't ideal because in situations where there are queries running
     * in parallel, each query's log messages are interleaved. Fixing this
     * properly will require a change in the query server.
     */
    updateActiveQuery(method, parameter) {
        var _a;
        if (method === messages.compileQuery.method) {
            const queryPath = ((_a = parameter === null || parameter === void 0 ? void 0 : parameter.queryToCheck) === null || _a === void 0 ? void 0 : _a.queryPath) || 'unknown';
            this.activeQueryName = `query-${path.basename(queryPath)}-${this.nextProgress}.log`;
        }
    }
}
exports.QueryServerClient = QueryServerClient;

//# sourceMappingURL=queryserver-client.js.map
