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
const vscode = require("vscode-debugadapter");
const net = require("net");
const xdebug = require("./xdebugConnection");
const moment = require("moment");
const url = require("url");
const childProcess = require("child_process");
const path = require("path");
const util = require("util");
const fs = require("fs");
const terminal_1 = require("./terminal");
const paths_1 = require("./paths");
const minimatch = require("minimatch");
if (process.env['VSCODE_NLS_CONFIG']) {
    try {
        moment.locale(JSON.parse(process.env['VSCODE_NLS_CONFIG']).locale);
    }
    catch (e) {
        // ignore
    }
}
/** formats a xdebug property value for VS Code */
function formatPropertyValue(property) {
    let displayValue;
    if (property.hasChildren || property.type === 'array' || property.type === 'object') {
        if (property.type === 'array') {
            // for arrays, show the length, like a var_dump would do
            displayValue = 'array(' + (property.hasChildren ? property.numberOfChildren : 0) + ')';
        }
        else if (property.type === 'object' && property.class) {
            // for objects, show the class name as type (if specified)
            displayValue = property.class;
        }
        else {
            // edge case: show the type of the property as the value
            displayValue = property.type;
        }
    }
    else {
        // for null, uninitialized, resource, etc. show the type
        displayValue = property.value || property.type === 'string' ? property.value : property.type;
        if (property.type === 'string') {
            displayValue = '"' + displayValue + '"';
        }
        else if (property.type === 'bool') {
            displayValue = !!parseInt(displayValue) + '';
        }
    }
    return displayValue;
}
class PhpDebugSession extends vscode.DebugSession {
    constructor() {
        super();
        /**
         * A map from VS Code thread IDs to XDebug Connections.
         * XDebug makes a new connection for each request to the webserver, we present these as threads to VS Code.
         * The threadId key is equal to the id attribute of the connection.
         */
        this._connections = new Map();
        /** A set of connections which are not yet running and are waiting for configurationDoneRequest */
        this._waitingConnections = new Set();
        /** A counter for unique source IDs */
        this._sourceIdCounter = 1;
        /** A map of VS Code source IDs to XDebug file URLs for virtual files (dpgp://whatever) and the corresponding connection */
        this._sources = new Map();
        /** A counter for unique stackframe IDs */
        this._stackFrameIdCounter = 1;
        /** A map from unique stackframe IDs (even across connections) to XDebug stackframes */
        this._stackFrames = new Map();
        /** A map from XDebug connections to their current status */
        this._statuses = new Map();
        /** A counter for unique context, property and eval result properties (as these are all requested by a VariableRequest from VS Code) */
        this._variableIdCounter = 1;
        /** A map from unique VS Code variable IDs to XDebug statuses for virtual error stack frames */
        this._errorStackFrames = new Map();
        /** A map from unique VS Code variable IDs to XDebug statuses for virtual error scopes */
        this._errorScopes = new Map();
        /** A map from unique VS Code variable IDs to an XDebug contexts */
        this._contexts = new Map();
        /** A map from unique VS Code variable IDs to a XDebug properties */
        this._properties = new Map();
        /** A map from unique VS Code variable IDs to XDebug eval result properties, because property children returned from eval commands are always inlined */
        this._evalResultProperties = new Map();
        this.setDebuggerColumnsStartAt1(true);
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerPathFormat('uri');
    }
    initializeRequest(response, args) {
        response.body = {
            supportsConfigurationDoneRequest: true,
            supportsEvaluateForHovers: false,
            supportsConditionalBreakpoints: true,
            supportsFunctionBreakpoints: true,
            exceptionBreakpointFilters: [
                {
                    filter: 'Notice',
                    label: 'Notices',
                },
                {
                    filter: 'Warning',
                    label: 'Warnings',
                },
                {
                    filter: 'Error',
                    label: 'Errors',
                },
                {
                    filter: 'Exception',
                    label: 'Exceptions',
                },
                {
                    filter: '*',
                    label: 'Everything',
                    default: true,
                },
            ],
        };
        this.sendResponse(response);
    }
    attachRequest(response, args) {
        this.sendErrorResponse(response, new Error('Attach requests are not supported'));
        this.shutdown();
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.localSourceRoot && args.serverSourceRoot) {
                let pathMappings = {};
                if (args.pathMappings) {
                    pathMappings = args.pathMappings;
                }
                pathMappings[args.serverSourceRoot] = args.localSourceRoot;
                args.pathMappings = pathMappings;
            }
            this._args = args;
            /** launches the script as CLI */
            const launchScript = () => __awaiter(this, void 0, void 0, function* () {
                // check if program exists
                yield new Promise((resolve, reject) => fs.access(args.program, fs.constants.F_OK, err => (err ? reject(err) : resolve())));
                const runtimeArgs = args.runtimeArgs || [];
                const runtimeExecutable = args.runtimeExecutable || 'php';
                const programArgs = args.args || [];
                const cwd = args.cwd || process.cwd();
                const env = args.env || process.env;
                // launch in CLI mode
                if (args.externalConsole) {
                    const script = yield terminal_1.Terminal.launchInTerminal(cwd, [runtimeExecutable, ...runtimeArgs, args.program, ...programArgs], env);
                    // we only do this for CLI mode. In normal listen mode, only a thread exited event is send.
                    script.on('exit', () => {
                        this.sendEvent(new vscode.TerminatedEvent());
                    });
                }
                else {
                    const script = childProcess.spawn(runtimeExecutable, [...runtimeArgs, args.program, ...programArgs], {
                        cwd,
                        env,
                    });
                    // redirect output to debug console
                    script.stdout.on('data', (data) => {
                        this.sendEvent(new vscode.OutputEvent(data + '', 'stdout'));
                    });
                    script.stderr.on('data', (data) => {
                        this.sendEvent(new vscode.OutputEvent(data + '', 'stderr'));
                    });
                    // we only do this for CLI mode. In normal listen mode, only a thread exited event is send.
                    script.on('exit', () => {
                        this.sendEvent(new vscode.TerminatedEvent());
                    });
                    script.on('error', (error) => {
                        this.sendEvent(new vscode.OutputEvent(util.inspect(error) + '\n'));
                    });
                    this._phpProcess = script;
                }
            });
            /** sets up a TCP server to listen for XDebug connections */
            const createServer = () => new Promise((resolve, reject) => {
                const server = (this._server = net.createServer());
                server.on('connection', (socket) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // new XDebug connection
                        const connection = new xdebug.Connection(socket);
                        if (args.log) {
                            this.sendEvent(new vscode.OutputEvent('new connection ' + connection.id + '\n'), true);
                        }
                        this._connections.set(connection.id, connection);
                        this._waitingConnections.add(connection);
                        const disposeConnection = (error) => {
                            if (this._connections.has(connection.id)) {
                                if (args.log) {
                                    this.sendEvent(new vscode.OutputEvent('connection ' + connection.id + ' closed\n'));
                                }
                                if (error) {
                                    this.sendEvent(new vscode.OutputEvent('connection ' + connection.id + ': ' + error.message + '\n'));
                                }
                                this.sendEvent(new vscode.ThreadEvent('exited', connection.id));
                                connection.close();
                                this._connections.delete(connection.id);
                                this._waitingConnections.delete(connection);
                            }
                        };
                        connection.on('warning', (warning) => {
                            this.sendEvent(new vscode.OutputEvent(warning + '\n'));
                        });
                        connection.on('error', disposeConnection);
                        connection.on('close', disposeConnection);
                        yield connection.waitForInitPacket();
                        // override features from launch.json
                        try {
                            const xdebugSettings = args.xdebugSettings || {};
                            yield Promise.all(Object.keys(xdebugSettings).map(setting => connection.sendFeatureSetCommand(setting, xdebugSettings[setting])));
                        }
                        catch (error) {
                            throw new Error('Error applying xdebugSettings: ' + (error instanceof Error ? error.message : error));
                        }
                        this.sendEvent(new vscode.ThreadEvent('started', connection.id));
                        // request breakpoints from VS Code
                        yield this.sendEvent(new vscode.InitializedEvent());
                    }
                    catch (error) {
                        this.sendEvent(new vscode.OutputEvent((error instanceof Error ? error.message : error) + '\n', 'stderr'));
                        this.shutdown();
                    }
                }));
                server.on('error', (error) => {
                    this.sendEvent(new vscode.OutputEvent(util.inspect(error) + '\n'));
                    this.sendErrorResponse(response, error);
                });
                server.listen(args.port || 9000, args.hostname, (error) => (error ? reject(error) : resolve()));
            });
            try {
                if (!args.noDebug) {
                    yield createServer();
                }
                if (args.program) {
                    yield launchScript();
                }
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /**
     * Checks the status of a StatusResponse and notifies VS Code accordingly
     * @param {xdebug.StatusResponse} response
     */
    _checkStatus(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = response.connection;
            this._statuses.set(connection, response);
            if (response.status === 'stopping') {
                const response = yield connection.sendStopCommand();
                this._checkStatus(response);
            }
            else if (response.status === 'stopped') {
                this._connections.delete(connection.id);
                this.sendEvent(new vscode.ThreadEvent('exited', connection.id));
                connection.close();
            }
            else if (response.status === 'break') {
                // StoppedEvent reason can be 'step', 'breakpoint', 'exception' or 'pause'
                let stoppedEventReason;
                let exceptionText;
                if (response.exception) {
                    // If one of the ignore patterns matches, ignore this exception
                    if (this._args.ignore &&
                        this._args.ignore.some(glob => minimatch(paths_1.convertDebuggerPathToClient(response.fileUri).replace(/\\/g, '/'), glob))) {
                        const response = yield connection.sendRunCommand();
                        yield this._checkStatus(response);
                        return;
                    }
                    stoppedEventReason = 'exception';
                    exceptionText = response.exception.name + ': ' + response.exception.message; // this seems to be ignored currently by VS Code
                }
                else if (this._args.stopOnEntry) {
                    stoppedEventReason = 'entry';
                }
                else if (response.command.indexOf('step') === 0) {
                    stoppedEventReason = 'step';
                }
                else {
                    stoppedEventReason = 'breakpoint';
                }
                const event = new vscode.StoppedEvent(stoppedEventReason, connection.id, exceptionText);
                event.body.allThreadsStopped = false;
                this.sendEvent(event);
            }
        });
    }
    /** Logs all requests before dispatching */
    dispatchRequest(request) {
        if (this._args && this._args.log) {
            const log = `-> ${request.command}Request\n${util.inspect(request, { depth: Infinity })}\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.dispatchRequest(request);
    }
    sendEvent(event, bypassLog = false) {
        if (this._args && this._args.log && !bypassLog) {
            const log = `<- ${event.event}Event\n${util.inspect(event, { depth: Infinity })}\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.sendEvent(event);
    }
    sendResponse(response) {
        if (this._args && this._args.log) {
            const log = `<- ${response.command}Response\n${util.inspect(response, { depth: Infinity })}\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.sendResponse(response);
    }
    sendErrorResponse(response) {
        if (arguments[1] instanceof Error) {
            const error = arguments[1];
            const dest = arguments[2];
            let code;
            if (typeof error.code === 'number') {
                code = error.code;
            }
            else if (typeof error.errno === 'number') {
                code = error.errno;
            }
            else {
                code = 0;
            }
            super.sendErrorResponse(response, code, error.message, dest);
        }
        else {
            super.sendErrorResponse(response, arguments[1], arguments[2], arguments[3], arguments[4]);
        }
    }
    /** This is called for each source file that has breakpoints with all the breakpoints in that file and whenever these change. */
    setBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileUri = paths_1.convertClientPathToDebugger(args.source.path, this._args.pathMappings);
                const connections = Array.from(this._connections.values());
                let xdebugBreakpoints;
                response.body = { breakpoints: [] };
                // this is returned to VS Code
                let vscodeBreakpoints;
                if (connections.length === 0) {
                    // if there are no connections yet, we cannot verify any breakpoint
                    vscodeBreakpoints = args.breakpoints.map(breakpoint => ({ verified: false, line: breakpoint.line }));
                }
                else {
                    vscodeBreakpoints = [];
                    // create XDebug breakpoints from the arguments
                    xdebugBreakpoints = args.breakpoints.map(breakpoint => {
                        if (breakpoint.condition) {
                            return new xdebug.ConditionalBreakpoint(breakpoint.condition, fileUri, breakpoint.line);
                        }
                        else {
                            return new xdebug.LineBreakpoint(fileUri, breakpoint.line);
                        }
                    });
                    // for all connections
                    yield Promise.all(connections.map((connection, connectionIndex) => __awaiter(this, void 0, void 0, function* () {
                        const promise = (() => __awaiter(this, void 0, void 0, function* () {
                            const { breakpoints } = yield connection.sendBreakpointListCommand();
                            // clear breakpoints for this file
                            // in the future when VS Code returns the breakpoint IDs it would be better to calculate the diff
                            yield Promise.all(breakpoints
                                .filter(breakpoint => breakpoint instanceof xdebug.LineBreakpoint &&
                                paths_1.isSameUri(fileUri, breakpoint.fileUri))
                                .map(breakpoint => breakpoint.remove()));
                            // set new breakpoints
                            yield Promise.all(xdebugBreakpoints.map((breakpoint, index) => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    yield connection.sendBreakpointSetCommand(breakpoint);
                                    vscodeBreakpoints[index] = { verified: true, line: breakpoint.line };
                                }
                                catch (error) {
                                    vscodeBreakpoints[index] = {
                                        verified: false,
                                        line: breakpoint.line,
                                        message: error.message,
                                    };
                                }
                            })));
                        }))();
                        if (connection.isPendingExecuteCommand) {
                            // There is a pending execute command which could lock the connection up, so do not
                            // wait on the response before continuing or it can get into a deadlock
                            promise.catch(err => this.sendEvent(new vscode.OutputEvent(util.inspect(err) + '\n')));
                        }
                        else {
                            yield promise;
                        }
                    })));
                }
                response.body = { breakpoints: vscodeBreakpoints };
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /** This is called once after all line breakpoints have been set and whenever the breakpoints settings change */
    setExceptionBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connections = Array.from(this._connections.values());
                yield Promise.all(connections.map((connection) => __awaiter(this, void 0, void 0, function* () {
                    const promise = (() => __awaiter(this, void 0, void 0, function* () {
                        const { breakpoints } = yield connection.sendBreakpointListCommand();
                        yield Promise.all(breakpoints
                            .filter(breakpoint => breakpoint.type === 'exception')
                            .map(breakpoint => breakpoint.remove()));
                        yield Promise.all(args.filters.map(filter => connection.sendBreakpointSetCommand(new xdebug.ExceptionBreakpoint(filter))));
                    }))();
                    if (connection.isPendingExecuteCommand) {
                        // There is a pending execute command which could lock the connection up, so do not
                        // wait on the response before continuing or it can get into a deadlock
                        promise.catch(err => this.sendEvent(new vscode.OutputEvent(util.inspect(err) + '\n')));
                    }
                    else {
                        yield promise;
                    }
                })));
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    setFunctionBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connections = Array.from(this._connections.values());
                // this is returned to VS Code
                let vscodeBreakpoints;
                if (connections.length === 0) {
                    // if there are no connections yet, we cannot verify any breakpoint
                    vscodeBreakpoints = args.breakpoints.map(breakpoint => ({ verified: false, message: 'No connection' }));
                }
                else {
                    vscodeBreakpoints = [];
                    // for all connections
                    yield Promise.all(connections.map((connection, connectionIndex) => __awaiter(this, void 0, void 0, function* () {
                        const promise = (() => __awaiter(this, void 0, void 0, function* () {
                            const { breakpoints } = yield connection.sendBreakpointListCommand();
                            yield Promise.all(breakpoints
                                .filter(breakpoint => breakpoint.type === 'call')
                                .map(breakpoint => breakpoint.remove()));
                            yield Promise.all(args.breakpoints.map((functionBreakpoint, index) => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    yield connection.sendBreakpointSetCommand(new xdebug.CallBreakpoint(functionBreakpoint.name, functionBreakpoint.condition));
                                    vscodeBreakpoints[index] = { verified: true };
                                }
                                catch (error) {
                                    vscodeBreakpoints[index] = {
                                        verified: false,
                                        message: error instanceof Error ? error.message : error,
                                    };
                                }
                            })));
                        }))();
                        if (connection.isPendingExecuteCommand) {
                            // There is a pending execute command which could lock the connection up, so do not
                            // wait on the response before continuing or it can get into a deadlock
                            promise.catch(err => this.sendEvent(new vscode.OutputEvent(util.inspect(err) + '\n')));
                        }
                        else {
                            yield promise;
                        }
                    })));
                }
                response.body = { breakpoints: vscodeBreakpoints };
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /** Executed after all breakpoints have been set by VS Code */
    configurationDoneRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponses = [];
            try {
                xdebugResponses = yield Promise.all(Array.from(this._waitingConnections).map(connection => {
                    this._waitingConnections.delete(connection);
                    // either tell VS Code we stopped on entry or run the script
                    if (this._args.stopOnEntry) {
                        // do one step to the first statement
                        return connection.sendStepIntoCommand();
                    }
                    else {
                        return connection.sendRunCommand();
                    }
                }));
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                for (const response of xdebugResponses) {
                    this._checkStatus(response);
                }
                return;
            }
            this.sendResponse(response);
            for (const response of xdebugResponses) {
                this._checkStatus(response);
            }
        });
    }
    /** Executed after a successfull launch or attach request and after a ThreadEvent */
    threadsRequest(response) {
        // PHP doesn't have threads, but it may have multiple requests in parallel.
        // Think about a website that makes multiple, parallel AJAX requests to your PHP backend.
        // XDebug opens a new socket connection for each of them, we tell VS Code that these are our threads.
        const connections = Array.from(this._connections.values());
        response.body = {
            threads: connections.map(connection => new vscode.Thread(connection.id, `Request ${connection.id} (${moment(connection.timeEstablished).format('LTS')})`)),
        };
        this.sendResponse(response);
    }
    /** Called by VS Code after a StoppedEvent */
    stackTraceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID');
                }
                const { stack } = yield connection.sendStackGetCommand();
                // First delete the old stack trace info ???
                // this._stackFrames.clear();
                // this._properties.clear();
                // this._contexts.clear();
                const status = this._statuses.get(connection);
                if (stack.length === 0 && status && status.exception) {
                    // special case: if a fatal error occurs (for example after an uncaught exception), the stack trace is EMPTY.
                    // in that case, VS Code would normally not show any information to the user at all
                    // to avoid this, we create a virtual stack frame with the info from the last status response we got
                    const status = this._statuses.get(connection);
                    const id = this._stackFrameIdCounter++;
                    const name = status.exception.name;
                    let line = status.line;
                    let source;
                    const urlObject = url.parse(status.fileUri);
                    if (urlObject.protocol === 'dbgp:') {
                        const sourceReference = this._sourceIdCounter++;
                        this._sources.set(sourceReference, { connection, url: status.fileUri });
                        // for eval code, we need to include .php extension to get syntax highlighting
                        source = { name: status.exception.name + '.php', sourceReference, origin: status.exception.name };
                        // for eval code, we add a "<?php" line at the beginning to get syntax highlighting (see sourceRequest)
                        line++;
                    }
                    else {
                        // XDebug paths are URIs, VS Code file paths
                        const filePath = paths_1.convertDebuggerPathToClient(urlObject, this._args.pathMappings);
                        // "Name" of the source and the actual file path
                        source = { name: path.basename(filePath), path: filePath };
                    }
                    this._errorStackFrames.set(id, status);
                    response.body = { stackFrames: [{ id, name, source, line, column: 1 }] };
                }
                else {
                    response.body = {
                        stackFrames: stack.map((stackFrame) => {
                            let source;
                            let line = stackFrame.line;
                            const urlObject = url.parse(stackFrame.fileUri);
                            if (urlObject.protocol === 'dbgp:') {
                                const sourceReference = this._sourceIdCounter++;
                                this._sources.set(sourceReference, { connection, url: stackFrame.fileUri });
                                // for eval code, we need to include .php extension to get syntax highlighting
                                source = {
                                    name: stackFrame.type === 'eval' ? 'eval.php' : stackFrame.name,
                                    sourceReference,
                                    origin: stackFrame.type,
                                };
                                // for eval code, we add a "<?php" line at the beginning to get syntax highlighting (see sourceRequest)
                                line++;
                            }
                            else {
                                // XDebug paths are URIs, VS Code file paths
                                const filePath = paths_1.convertDebuggerPathToClient(urlObject, this._args.pathMappings);
                                // "Name" of the source and the actual file path
                                source = { name: path.basename(filePath), path: filePath };
                            }
                            // a new, unique ID for scopeRequests
                            const stackFrameId = this._stackFrameIdCounter++;
                            // save the connection this stackframe belongs to and the level of the stackframe under the stacktrace id
                            this._stackFrames.set(stackFrameId, stackFrame);
                            // prepare response for VS Code (column is always 1 since XDebug doesn't tell us the column)
                            return { id: stackFrameId, name: stackFrame.name, source, line, column: 1 };
                        }),
                    };
                }
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    sourceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._sources.has(args.sourceReference)) {
                    throw new Error(`Unknown sourceReference ${args.sourceReference}`);
                }
                const { connection, url } = this._sources.get(args.sourceReference);
                let { source } = yield connection.sendSourceCommand(url);
                if (!/^\s*<\?(php|=)/.test(source)) {
                    // we do this because otherwise VS Code would not show syntax highlighting for eval() code
                    source = '<?php\n' + source;
                }
                response.body = { content: source, mimeType: 'application/x-php' };
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    scopesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let scopes = [];
                if (this._errorStackFrames.has(args.frameId)) {
                    // VS Code is requesting the scopes for a virtual error stack frame
                    const status = this._errorStackFrames.get(args.frameId);
                    if (status.exception) {
                        const variableId = this._variableIdCounter++;
                        this._errorScopes.set(variableId, status);
                        scopes = [new vscode.Scope(status.exception.name.replace(/^(.*\\)+/g, ''), variableId)];
                    }
                }
                else {
                    const stackFrame = this._stackFrames.get(args.frameId);
                    if (!stackFrame) {
                        throw new Error(`Unknown frameId ${args.frameId}`);
                    }
                    const contexts = yield stackFrame.getContexts();
                    scopes = contexts.map(context => {
                        const variableId = this._variableIdCounter++;
                        // remember that this new variable ID is assigned to a SCOPE (in XDebug "context"), not a variable (in XDebug "property"),
                        // so when VS Code does a variablesRequest with that ID we do a context_get and not a property_get
                        this._contexts.set(variableId, context);
                        // send VS Code the variable ID as identifier
                        return new vscode.Scope(context.name, variableId);
                    });
                    const status = this._statuses.get(stackFrame.connection);
                    if (status && status.exception) {
                        const variableId = this._variableIdCounter++;
                        this._errorScopes.set(variableId, status);
                        scopes.unshift(new vscode.Scope(status.exception.name.replace(/^(.*\\)+/g, ''), variableId));
                    }
                }
                response.body = { scopes };
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    variablesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const variablesReference = args.variablesReference;
                let variables;
                if (this._errorScopes.has(variablesReference)) {
                    // this is a virtual error scope
                    const status = this._errorScopes.get(variablesReference);
                    variables = [
                        new vscode.Variable('type', status.exception.name),
                        new vscode.Variable('message', '"' + status.exception.message + '"'),
                    ];
                    if (status.exception.code !== undefined) {
                        variables.push(new vscode.Variable('code', status.exception.code + ''));
                    }
                }
                else {
                    // it is a real scope
                    let properties;
                    if (this._contexts.has(variablesReference)) {
                        // VS Code is requesting the variables for a SCOPE, so we have to do a context_get
                        const context = this._contexts.get(variablesReference);
                        properties = yield context.getProperties();
                    }
                    else if (this._properties.has(variablesReference)) {
                        // VS Code is requesting the subelements for a variable, so we have to do a property_get
                        const property = this._properties.get(variablesReference);
                        if (property.hasChildren) {
                            if (property.children.length === property.numberOfChildren) {
                                properties = property.children;
                            }
                            else {
                                properties = yield property.getChildren();
                            }
                        }
                        else {
                            properties = [];
                        }
                    }
                    else if (this._evalResultProperties.has(variablesReference)) {
                        // the children of properties returned from an eval command are always inlined, so we simply resolve them
                        const property = this._evalResultProperties.get(variablesReference);
                        properties = property.hasChildren ? property.children : [];
                    }
                    else {
                        throw new Error('Unknown variable reference');
                    }
                    variables = properties.map(property => {
                        const displayValue = formatPropertyValue(property);
                        let variablesReference;
                        let evaluateName;
                        if (property.hasChildren || property.type === 'array' || property.type === 'object') {
                            // if the property has children, we have to send a variableReference back to VS Code
                            // so it can receive the child elements in another request.
                            // for arrays and objects we do it even when it does not have children so the user can still expand/collapse the entry
                            variablesReference = this._variableIdCounter++;
                            if (property instanceof xdebug.Property) {
                                this._properties.set(variablesReference, property);
                            }
                            else if (property instanceof xdebug.EvalResultProperty) {
                                this._evalResultProperties.set(variablesReference, property);
                            }
                        }
                        else {
                            variablesReference = 0;
                        }
                        if (property instanceof xdebug.Property) {
                            evaluateName = property.fullName;
                        }
                        else {
                            evaluateName = property.name;
                        }
                        const variable = {
                            name: property.name,
                            value: displayValue,
                            type: property.type,
                            variablesReference,
                            evaluateName,
                        };
                        return variable;
                    });
                }
                response.body = { variables };
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    continueRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendRunCommand();
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            response.body = {
                allThreadsContinued: false,
            };
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    nextRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepOverCommand();
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    stepInRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepIntoCommand();
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    stepOutRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepOutCommand();
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    pauseRequest(response, args) {
        this.sendErrorResponse(response, new Error('Pausing the execution is not supported by XDebug'));
    }
    disconnectRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all(Array.from(this._connections).map(([id, connection]) => __awaiter(this, void 0, void 0, function* () {
                    // Try to send stop command for 500ms
                    // If the script is running, just close the connection
                    yield Promise.race([connection.sendStopCommand(), new Promise(resolve => setTimeout(resolve, 500))]);
                    yield connection.close();
                    this._connections.delete(id);
                    this._waitingConnections.delete(connection);
                })));
                // If listening for connections, close server
                if (this._server) {
                    yield new Promise(resolve => this._server.close(resolve));
                }
                // If launched as CLI, kill process
                if (this._phpProcess) {
                    this._phpProcess.kill();
                }
            }
            catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
            this.shutdown();
        });
    }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!args.frameId) {
                    throw new Error('Cannot evaluate code without a connection');
                }
                if (!this._stackFrames.has(args.frameId)) {
                    throw new Error(`Unknown frameId ${args.frameId}`);
                }
                const connection = this._stackFrames.get(args.frameId).connection;
                const { result } = yield connection.sendEvalCommand(args.expression);
                if (result) {
                    const displayValue = formatPropertyValue(result);
                    let variablesReference;
                    // if the property has children, generate a variable ID and save the property (including children) so VS Code can request them
                    if (result.hasChildren || result.type === 'array' || result.type === 'object') {
                        variablesReference = this._variableIdCounter++;
                        this._evalResultProperties.set(variablesReference, result);
                    }
                    else {
                        variablesReference = 0;
                    }
                    response.body = { result: displayValue, variablesReference };
                }
                else {
                    response.body = { result: 'no result', variablesReference: 0 };
                }
                this.sendResponse(response);
            }
            catch (error) {
                this.sendErrorResponse(response, error);
            }
        });
    }
}
vscode.DebugSession.run(PhpDebugSession);
//# sourceMappingURL=phpDebug.js.map