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
const iconv = require("iconv-lite");
const dbgp_1 = require("./dbgp");
/** The encoding all XDebug messages are encoded with */
const ENCODING = 'iso-8859-1';
/** The first packet we receive from XDebug. Returned by waitForInitPacket() */
class InitPacket {
    /**
     * @param  {XMLDocument} document - An XML document to read from
     * @param  {Connection} connection
     */
    constructor(document, connection) {
        const documentElement = document.documentElement;
        this.fileUri = documentElement.getAttribute('fileuri');
        this.language = documentElement.getAttribute('language');
        this.protocolVersion = documentElement.getAttribute('protocol_version');
        this.ideKey = documentElement.getAttribute('idekey');
        this.engineVersion = documentElement.getElementsByTagName('engine')[0].getAttribute('version');
        this.connection = connection;
    }
}
exports.InitPacket = InitPacket;
/** Error class for errors returned from XDebug */
class XDebugError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.message = message;
        this.name = 'XDebugError';
    }
}
exports.XDebugError = XDebugError;
/** The base class for all XDebug responses to commands executed on a connection */
class Response {
    /**
     * contructs a new Response object from an XML document.
     * If there is an error child node, an exception is thrown with the appropiate code and message.
     * @param  {XMLDocument} document - An XML document to read from
     * @param  {Connection} connection
     */
    constructor(document, connection) {
        const documentElement = document.documentElement;
        if (documentElement.firstChild && documentElement.firstChild.nodeName === 'error') {
            const errorNode = documentElement.firstChild;
            const code = parseInt(errorNode.getAttribute('code'));
            const message = errorNode.textContent;
            throw new XDebugError(message, code);
        }
        this.transactionId = parseInt(documentElement.getAttribute('transaction_id'));
        this.command = documentElement.getAttribute('command');
        this.connection = connection;
    }
}
exports.Response = Response;
/** A response to the status command */
class StatusResponse extends Response {
    constructor(document, connection) {
        super(document, connection);
        const documentElement = document.documentElement;
        this.status = documentElement.getAttribute('status');
        this.reason = documentElement.getAttribute('reason');
        if (documentElement.hasChildNodes()) {
            const messageNode = documentElement.firstChild;
            if (messageNode.hasAttribute('exception')) {
                this.exception = {
                    name: messageNode.getAttribute('exception'),
                    message: messageNode.textContent,
                };
                if (messageNode.hasAttribute('code')) {
                    this.exception.code = parseInt(messageNode.getAttribute('code'));
                }
            }
            if (messageNode.hasAttribute('filename')) {
                this.fileUri = messageNode.getAttribute('filename');
            }
            if (messageNode.hasAttribute('lineno')) {
                this.line = parseInt(messageNode.getAttribute('lineno'));
            }
        }
    }
}
exports.StatusResponse = StatusResponse;
/** Abstract base class for all breakpoints */
class Breakpoint {
    /** dynamically detects the type of breakpoint and returns the appropiate object */
    static fromXml(breakpointNode, connection) {
        switch (breakpointNode.getAttribute('type')) {
            case 'exception':
                return new ExceptionBreakpoint(breakpointNode, connection);
            case 'line':
                return new LineBreakpoint(breakpointNode, connection);
            case 'conditional':
                return new ConditionalBreakpoint(breakpointNode, connection);
            case 'call':
                return new CallBreakpoint(breakpointNode, connection);
            default:
                throw new Error(`Invalid type ${breakpointNode.getAttribute('type')}`);
        }
    }
    constructor() {
        if (typeof arguments[0] === 'object') {
            // from XML
            const breakpointNode = arguments[0];
            this.connection = arguments[1];
            this.type = breakpointNode.getAttribute('type');
            this.id = parseInt(breakpointNode.getAttribute('id'));
            this.state = breakpointNode.getAttribute('state');
        }
        else {
            this.type = arguments[0];
        }
    }
    /** Removes the breakpoint by sending a breakpoint_remove command */
    remove() {
        return this.connection.sendBreakpointRemoveCommand(this);
    }
}
exports.Breakpoint = Breakpoint;
/** class for line breakpoints. Returned from a breakpoint_list or passed to sendBreakpointSetCommand */
class LineBreakpoint extends Breakpoint {
    constructor() {
        if (typeof arguments[0] === 'object') {
            const breakpointNode = arguments[0];
            const connection = arguments[1];
            super(breakpointNode, connection);
            this.line = parseInt(breakpointNode.getAttribute('lineno'));
            this.fileUri = breakpointNode.getAttribute('filename');
        }
        else {
            // construct from arguments
            super('line');
            this.fileUri = arguments[0];
            this.line = arguments[1];
        }
    }
}
exports.LineBreakpoint = LineBreakpoint;
/** class for call breakpoints. Returned from a breakpoint_list or passed to sendBreakpointSetCommand */
class CallBreakpoint extends Breakpoint {
    constructor() {
        if (typeof arguments[0] === 'object') {
            const breakpointNode = arguments[0];
            const connection = arguments[1];
            super(breakpointNode, connection);
            this.fn = breakpointNode.getAttribute('function');
            this.expression = breakpointNode.getAttribute('expression'); // Base64 encoded?
        }
        else {
            // construct from arguments
            super('call');
            this.fn = arguments[0];
            this.expression = arguments[1];
        }
    }
}
exports.CallBreakpoint = CallBreakpoint;
/** class for exception breakpoints. Returned from a breakpoint_list or passed to sendBreakpointSetCommand */
class ExceptionBreakpoint extends Breakpoint {
    constructor() {
        if (typeof arguments[0] === 'object') {
            // from XML
            const breakpointNode = arguments[0];
            const connection = arguments[1];
            super(breakpointNode, connection);
            this.exception = breakpointNode.getAttribute('exception');
        }
        else {
            // from arguments
            super('exception');
            this.exception = arguments[0];
        }
    }
}
exports.ExceptionBreakpoint = ExceptionBreakpoint;
/** class for conditional breakpoints. Returned from a breakpoint_list or passed to sendBreakpointSetCommand */
class ConditionalBreakpoint extends Breakpoint {
    constructor() {
        if (typeof arguments[0] === 'object') {
            // from XML
            const breakpointNode = arguments[0];
            const connection = arguments[1];
            super(breakpointNode, connection);
            this.expression = breakpointNode.getAttribute('expression'); // Base64 encoded?
        }
        else {
            // from arguments
            super('conditional');
            this.expression = arguments[0];
            this.fileUri = arguments[1];
            this.line = arguments[2];
        }
    }
}
exports.ConditionalBreakpoint = ConditionalBreakpoint;
/** Response to a breakpoint_set command */
class BreakpointSetResponse extends Response {
    constructor(document, connection) {
        super(document, connection);
        this.breakpointId = parseInt(document.documentElement.getAttribute('id'));
    }
}
exports.BreakpointSetResponse = BreakpointSetResponse;
/** The response to a breakpoint_list command */
class BreakpointListResponse extends Response {
    /**
     * @param  {XMLDocument} document
     * @param  {Connection} connection
     */
    constructor(document, connection) {
        super(document, connection);
        this.breakpoints = Array.from(document.documentElement.childNodes).map((breakpointNode) => Breakpoint.fromXml(breakpointNode, connection));
    }
}
exports.BreakpointListResponse = BreakpointListResponse;
/** One stackframe inside a stacktrace retrieved through stack_get */
class StackFrame {
    /**
     * @param  {Element} stackFrameNode
     * @param  {Connection} connection
     */
    constructor(stackFrameNode, connection) {
        this.name = stackFrameNode.getAttribute('where');
        this.fileUri = stackFrameNode.getAttribute('filename');
        this.type = stackFrameNode.getAttribute('type');
        this.line = parseInt(stackFrameNode.getAttribute('lineno'));
        this.level = parseInt(stackFrameNode.getAttribute('level'));
        this.connection = connection;
    }
    /** Returns the available contexts (scopes, such as "Local" and "Superglobals") by doing a context_names command */
    getContexts() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.connection.sendContextNamesCommand(this)).contexts;
        });
    }
}
exports.StackFrame = StackFrame;
/** The response to a stack_get command */
class StackGetResponse extends Response {
    /**
     * @param  {XMLDocument} document
     * @param  {Connection} connection
     */
    constructor(document, connection) {
        super(document, connection);
        this.stack = Array.from(document.documentElement.childNodes).map((stackFrameNode) => new StackFrame(stackFrameNode, connection));
    }
}
exports.StackGetResponse = StackGetResponse;
class SourceResponse extends Response {
    constructor(document, connection) {
        super(document, connection);
        this.source = new Buffer(document.documentElement.textContent, 'base64').toString();
    }
}
exports.SourceResponse = SourceResponse;
/** A context inside a stack frame, like "Local" or "Superglobals" */
class Context {
    /**
     * @param  {Element} contextNode
     * @param  {StackFrame} stackFrame
     */
    constructor(contextNode, stackFrame) {
        this.id = parseInt(contextNode.getAttribute('id'));
        this.name = contextNode.getAttribute('name');
        this.stackFrame = stackFrame;
    }
    /**
     * Returns the properties (variables) inside this context by doing a context_get command
     * @returns Promise.<Property[]>
     */
    getProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.stackFrame.connection.sendContextGetCommand(this)).properties;
        });
    }
}
exports.Context = Context;
/** Response to a context_names command */
class ContextNamesResponse extends Response {
    /**
     * @param  {XMLDocument} document
     * @param  {StackFrame} stackFrame
     */
    constructor(document, stackFrame) {
        super(document, stackFrame.connection);
        this.contexts = Array.from(document.documentElement.childNodes).map((contextNode) => new Context(contextNode, stackFrame));
    }
}
exports.ContextNamesResponse = ContextNamesResponse;
/** The parent for properties inside a scope and properties retrieved through eval requests */
class BaseProperty {
    constructor(propertyNode) {
        if (propertyNode.hasAttribute('name')) {
            this.name = propertyNode.getAttribute('name');
        }
        this.type = propertyNode.getAttribute('type');
        if (propertyNode.hasAttribute('classname')) {
            this.class = propertyNode.getAttribute('classname');
        }
        this.hasChildren = !!parseInt(propertyNode.getAttribute('children'));
        if (this.hasChildren) {
            this.numberOfChildren = parseInt(propertyNode.getAttribute('numchildren'));
        }
        else {
            const encoding = propertyNode.getAttribute('encoding');
            if (encoding) {
                this.value = iconv.encode(propertyNode.textContent, encoding) + '';
            }
            else {
                this.value = propertyNode.textContent;
            }
        }
    }
}
exports.BaseProperty = BaseProperty;
/** a property (variable) inside a context or a child of another property */
class Property extends BaseProperty {
    /**
     * @param  {Element} propertyNode
     * @param  {Context} context
     */
    constructor(propertyNode, context) {
        super(propertyNode);
        this.fullName = propertyNode.getAttribute('fullname');
        this.context = context;
        if (this.hasChildren) {
            this.children = Array.from(propertyNode.childNodes).map((propertyNode) => new Property(propertyNode, context));
        }
    }
    /**
     * Returns the child properties of this property by doing another property_get
     * @returns Promise.<Property[]>
     */
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasChildren) {
                throw new Error('This property has no children');
            }
            return (yield this.context.stackFrame.connection.sendPropertyGetCommand(this)).children;
        });
    }
}
exports.Property = Property;
/** The response to a context_get command */
class ContextGetResponse extends Response {
    /**
     * @param  {XMLDocument} document
     * @param  {Context} context
     */
    constructor(document, context) {
        super(document, context.stackFrame.connection);
        this.properties = Array.from(document.documentElement.childNodes).map((propertyNode) => new Property(propertyNode, context));
    }
}
exports.ContextGetResponse = ContextGetResponse;
/** The response to a property_get command */
class PropertyGetResponse extends Response {
    /**
     * @param  {XMLDocument} document
     * @param  {Property} property
     */
    constructor(document, property) {
        super(document, property.context.stackFrame.connection);
        this.children = Array.from(document.documentElement.firstChild.childNodes).map((propertyNode) => new Property(propertyNode, property.context));
    }
}
exports.PropertyGetResponse = PropertyGetResponse;
/** class for properties returned from eval commands. These don't have a full name or an ID, but have all children already inlined. */
class EvalResultProperty extends BaseProperty {
    constructor(propertyNode) {
        super(propertyNode);
        if (this.hasChildren) {
            this.children = Array.from(propertyNode.childNodes).map((propertyNode) => new EvalResultProperty(propertyNode));
        }
    }
}
exports.EvalResultProperty = EvalResultProperty;
/** The response to an eval command */
class EvalResponse extends Response {
    constructor(document, connection) {
        super(document, connection);
        if (document.documentElement.hasChildNodes()) {
            this.result = new EvalResultProperty(document.documentElement.firstChild);
        }
    }
}
exports.EvalResponse = EvalResponse;
/** The response to an feature_set command */
class FeatureSetResponse extends Response {
    constructor(document, connection) {
        super(document, connection);
        this.feature = document.documentElement.getAttribute('feature');
    }
}
exports.FeatureSetResponse = FeatureSetResponse;
/**
 * This class represents a connection to XDebug and is instantiated with a socket.
 */
class Connection extends dbgp_1.DbgpConnection {
    /** Constructs a new connection that uses the given socket to communicate with XDebug. */
    constructor(socket) {
        super(socket);
        /** a counter for unique transaction IDs. */
        this._transactionCounter = 1;
        /**
         * a map from transaction IDs to pending commands that have been sent to XDebug and are awaiting a response.
         * This should in theory only contain max one element at any time.
         */
        this._pendingCommands = new Map();
        /**
         * XDebug does NOT support async communication.
         * This means before sending a new command, we have to wait until we get a response for the previous.
         * This array is a stack of commands that get passed to _sendCommand once XDebug can accept commands again.
         */
        this._commandQueue = [];
        this._pendingExecuteCommand = false;
        this.id = Connection._connectionCounter++;
        this.timeEstablished = new Date();
        this._initPromise = new Promise((resolve, reject) => {
            this._initPromiseResolveFn = resolve;
            this._initPromiseRejectFn = reject;
        });
        this.on('message', (response) => {
            if (response.documentElement.nodeName === 'init') {
                this._initPromiseResolveFn(new InitPacket(response, this));
            }
            else {
                const transactionId = parseInt(response.documentElement.getAttribute('transaction_id'));
                if (this._pendingCommands.has(transactionId)) {
                    const command = this._pendingCommands.get(transactionId);
                    this._pendingCommands.delete(transactionId);
                    this._pendingExecuteCommand = false;
                    command.resolveFn(response);
                }
                if (this._commandQueue.length > 0) {
                    const command = this._commandQueue.shift();
                    this._executeCommand(command).catch(command.rejectFn);
                }
            }
        });
    }
    /**
     * Whether a command was started that executes PHP, which means the connection will be blocked from
     * running any additional commands until the execution gets to the next stopping point or exits.
     */
    get isPendingExecuteCommand() {
        return this._pendingExecuteCommand;
    }
    /** Returns a promise that gets resolved once the init packet arrives */
    waitForInitPacket() {
        return this._initPromise;
    }
    /**
     * Pushes a new command to the queue that will be executed after all the previous commands have finished and we received a response.
     * If the queue is empty AND there are no pending transactions (meaning we already received a response and XDebug is waiting for
     * commands) the command will be executed immediately.
     */
    _enqueueCommand(name, args, data) {
        return new Promise((resolveFn, rejectFn) => {
            this._enqueue({ name, args, data, resolveFn, rejectFn, isExecuteCommand: false });
        });
    }
    /**
     * Pushes a new execute command (one that results in executing PHP code) to the queue that will be executed after all the previous
     * commands have finished and we received a response.
     * If the queue is empty AND there are no pending transactions (meaning we already received a response and XDebug is waiting for
     * commands) the command will be executed immediately.
     */
    _enqueueExecuteCommand(name, args, data) {
        return new Promise((resolveFn, rejectFn) => {
            this._enqueue({ name, args, data, resolveFn, rejectFn, isExecuteCommand: true });
        });
    }
    /** Adds the given command to the queue, or executes immediately if no commands are currently being processed. */
    _enqueue(command) {
        if (this._commandQueue.length === 0 && this._pendingCommands.size === 0) {
            this._executeCommand(command);
        }
        else {
            this._commandQueue.push(command);
        }
    }
    /**
     * Sends a command to XDebug with a new transaction ID and calls the callback on the command. This can
     * only be called when XDebug can actually accept commands, which is after we received a response for the
     * previous command.
     */
    _executeCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionId = this._transactionCounter++;
            let commandString = command.name + ' -i ' + transactionId;
            if (command.args) {
                commandString += ' ' + command.args;
            }
            if (command.data) {
                commandString += ' -- ' + new Buffer(command.data).toString('base64');
            }
            commandString += '\0';
            const data = iconv.encode(commandString, ENCODING);
            this._pendingCommands.set(transactionId, command);
            this._pendingExecuteCommand = command.isExecuteCommand;
            yield this.write(data);
        });
    }
    close() {
        this._commandQueue = [];
        this._initPromiseRejectFn(new Error('connection closed'));
        return super.close();
    }
    // ------------------------ status --------------------------------------------
    /** Sends a status command */
    sendStatusCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueCommand('status'), this);
        });
    }
    // ------------------------ feature negotiation --------------------------------
    /**
     * Sends a feature_get command
     * feature can be one of
     *  - language_supports_threads
     *  - language_name
     *  - language_version
     *  - encoding
     *  - protocol_version
     *  - supports_async
     *  - data_encoding
     *  - breakpoint_languages
     *  - breakpoint_types
     *  - multiple_sessions
     *  - max_children
     *  - max_data
     *  - max_depth
     *  - extended_properties
     * optional features:
     *  - supports_postmortem
     *  - show_hidden
     *  - notify_ok
     * or any command.
     */
    sendFeatureGetCommand(feature) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._enqueueCommand('feature_get', `-n feature`);
        });
    }
    /**
     * Sends a feature_set command
     * feature can be one of
     *  - multiple_sessions
     *  - max_children
     *  - max_data
     *  - max_depth
     *  - extended_properties
     * optional features:
     *  - show_hidden
     *  - notify_ok
     */
    sendFeatureSetCommand(feature, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return new FeatureSetResponse(yield this._enqueueCommand('feature_set', `-n ${feature} -v ${value}`), this);
        });
    }
    // ---------------------------- breakpoints ------------------------------------
    /**
     * Sends a breakpoint_set command that sets a breakpoint.
     * @param {Breakpoint} breakpoint - an instance of LineBreakpoint, ConditionalBreakpoint or ExceptionBreakpoint
     * @returns Promise.<BreakpointSetResponse>
     */
    sendBreakpointSetCommand(breakpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            let args = `-t ${breakpoint.type}`;
            let data;
            if (breakpoint instanceof LineBreakpoint) {
                args += ` -f ${breakpoint.fileUri} -n ${breakpoint.line}`;
            }
            else if (breakpoint instanceof ExceptionBreakpoint) {
                args += ` -x ${breakpoint.exception}`;
            }
            else if (breakpoint instanceof ConditionalBreakpoint) {
                args += ` -f ${breakpoint.fileUri}`;
                if (typeof breakpoint.line === 'number') {
                    args += ` -n ${breakpoint.line}`;
                }
                data = breakpoint.expression;
            }
            else if (breakpoint instanceof CallBreakpoint) {
                args += ` -m ${breakpoint.fn}`;
                data = breakpoint.expression;
            }
            return new BreakpointSetResponse(yield this._enqueueCommand('breakpoint_set', args, data), this);
        });
    }
    /** sends a breakpoint_list command */
    sendBreakpointListCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new BreakpointListResponse(yield this._enqueueCommand('breakpoint_list'), this);
        });
    }
    /** sends a breakpoint_remove command */
    sendBreakpointRemoveCommand(breakpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Response(yield this._enqueueCommand('breakpoint_remove', `-d ${breakpoint.id}`), this);
        });
    }
    // ----------------------------- continuation ---------------------------------
    /** sends a run command */
    sendRunCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueExecuteCommand('run'), this);
        });
    }
    /** sends a step_into command */
    sendStepIntoCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueExecuteCommand('step_into'), this);
        });
    }
    /** sends a step_over command */
    sendStepOverCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueExecuteCommand('step_over'), this);
        });
    }
    /** sends a step_out command */
    sendStepOutCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueExecuteCommand('step_out'), this);
        });
    }
    /** sends a stop command */
    sendStopCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StatusResponse(yield this._enqueueCommand('stop'), this);
        });
    }
    // ------------------------------ stack ----------------------------------------
    /** Sends a stack_get command */
    sendStackGetCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            return new StackGetResponse(yield this._enqueueCommand('stack_get'), this);
        });
    }
    sendSourceCommand(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return new SourceResponse(yield this._enqueueCommand('source', `-f ${uri}`), this);
        });
    }
    // ------------------------------ context --------------------------------------
    /** Sends a context_names command. */
    sendContextNamesCommand(stackFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ContextNamesResponse(yield this._enqueueCommand('context_names', `-d ${stackFrame.level}`), stackFrame);
        });
    }
    /** Sends a context_get comand */
    sendContextGetCommand(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ContextGetResponse(yield this._enqueueCommand('context_get', `-d ${context.stackFrame.level} -c ${context.id}`), context);
        });
    }
    /** Sends a property_get command */
    sendPropertyGetCommand(property) {
        return __awaiter(this, void 0, void 0, function* () {
            const escapedFullName = '"' + property.fullName.replace(/("|\\)/g, '\\$1') + '"';
            return new PropertyGetResponse(yield this._enqueueCommand('property_get', `-d ${property.context.stackFrame.level} -c ${property.context.id} -n ${escapedFullName}`), property);
        });
    }
    // ------------------------------- eval -----------------------------------------
    /** sends an eval command */
    sendEvalCommand(expression) {
        return __awaiter(this, void 0, void 0, function* () {
            return new EvalResponse(yield this._enqueueCommand('eval', undefined, expression), this);
        });
    }
}
/** a counter for unique connection IDs */
Connection._connectionCounter = 1;
exports.Connection = Connection;
//# sourceMappingURL=xdebugConnection.js.map