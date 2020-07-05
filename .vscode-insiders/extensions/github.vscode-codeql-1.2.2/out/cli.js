"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/camelcase */
const cpp = require("child-process-promise");
const child_process = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const string_decoder_1 = require("string_decoder");
const tk = require("tree-kill");
const util = require("util");
const helpers_pure_1 = require("./helpers-pure");
const interface_types_1 = require("./interface-types");
/**
 * The version of the SARIF format that we are using.
 */
const SARIF_FORMAT = "sarifv2.1.0";
/**
 * Flags to pass to all cli commands.
 */
const LOGGING_FLAGS = ['-v', '--log-to-stderr'];
/**
 * This class manages a cli server started by `codeql execute cli-server` to
 * run commands without the overhead of starting a new java
 * virtual machine each time. This class also controls access to the server
 * by queueing the commands sent to it.
 */
class CodeQLCliServer {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.commandQueue = [];
        this.commandInProcess = false;
        this.nullBuffer = Buffer.alloc(1);
        if (this.config.onDidChangeDistribution) {
            this.config.onDidChangeDistribution(() => {
                this.restartCliServer();
            });
        }
    }
    dispose() {
        this.killProcessIfRunning();
    }
    killProcessIfRunning() {
        if (this.process) {
            // Tell the Java CLI server process to shut down.
            this.logger.log('Sending shutdown request');
            try {
                this.process.stdin.write(JSON.stringify(["shutdown"]), "utf8");
                this.process.stdin.write(this.nullBuffer);
                this.logger.log('Sent shutdown request');
            }
            catch (e) {
                // We are probably fine here, the process has already closed stdin.
                this.logger.log(`Shutdown request failed: process stdin may have already closed. The error was ${e}`);
                this.logger.log('Stopping the process anyway.');
            }
            // Close the stdin and stdout streams.
            // This is important on Windows where the child process may not die cleanly.
            this.process.stdin.end();
            this.process.kill();
            this.process.stdout.destroy();
            this.process.stderr.destroy();
            this.process = undefined;
        }
    }
    /**
     * Restart the server when the current command terminates
     */
    restartCliServer() {
        const callback = () => {
            try {
                this.killProcessIfRunning();
            }
            finally {
                this.runNext();
            }
        };
        // If the server is not running a command run this immediately
        // otherwise add to the front of the queue (as we want to run this after the next command()).
        if (this.commandInProcess) {
            this.commandQueue.unshift(callback);
        }
        else {
            callback();
        }
    }
    /**
     * Get the path to the CodeQL CLI distribution, or throw an exception if not found.
     */
    async getCodeQlPath() {
        const codeqlPath = await this.config.getCodeQlPathWithoutVersionCheck();
        if (!codeqlPath) {
            throw new Error('Failed to find CodeQL distribution.');
        }
        return codeqlPath;
    }
    /**
     * Launch the cli server
     */
    async launchProcess() {
        const config = await this.getCodeQlPath();
        return spawnServer(config, "CodeQL CLI Server", ["execute", "cli-server"], [], this.logger, _data => { });
    }
    async runCodeQlCliInternal(command, commandArgs, description) {
        const stderrBuffers = [];
        if (this.commandInProcess) {
            throw new Error("runCodeQlCliInternal called while cli was running");
        }
        this.commandInProcess = true;
        try {
            //Launch the process if it doesn't exist
            if (!this.process) {
                this.process = await this.launchProcess();
            }
            // Grab the process so that typescript know that it is always defined.
            const process = this.process;
            // The array of fragments of stdout
            const stdoutBuffers = [];
            // Compute the full args array
            const args = command.concat(LOGGING_FLAGS).concat(commandArgs);
            const argsString = args.join(" ");
            this.logger.log(`${description} using CodeQL CLI: ${argsString}...`);
            try {
                await new Promise((resolve, reject) => {
                    // Start listening to stdout
                    process.stdout.addListener('data', (newData) => {
                        stdoutBuffers.push(newData);
                        // If the buffer ends in '0' then exit.
                        // We don't have to check the middle as no output will be written after the null until
                        // the next command starts
                        if (newData.length > 0 && newData.readUInt8(newData.length - 1) === 0) {
                            resolve();
                        }
                    });
                    // Listen to stderr
                    process.stderr.addListener('data', (newData) => {
                        stderrBuffers.push(newData);
                    });
                    // Listen for process exit.
                    process.addListener("close", (code) => reject(code));
                    // Write the command followed by a null terminator.
                    process.stdin.write(JSON.stringify(args), "utf8");
                    process.stdin.write(this.nullBuffer);
                });
                // Join all the data together
                const fullBuffer = Buffer.concat(stdoutBuffers);
                // Make sure we remove the terminator;
                const data = fullBuffer.toString("utf8", 0, fullBuffer.length - 1);
                this.logger.log(`CLI command succeeded.`);
                return data;
            }
            catch (err) {
                // Kill the process if it isn't already dead.
                this.killProcessIfRunning();
                // Report the error (if there is a stderr then use that otherwise just report the error cod or nodejs error)
                const newError = stderrBuffers.length == 0
                    ? new Error(`${description} failed: ${err}`)
                    : new Error(`${description} failed: ${Buffer.concat(stderrBuffers).toString("utf8")}`);
                newError.stack += (err.stack || '');
                throw newError;
            }
            finally {
                this.logger.log(Buffer.concat(stderrBuffers).toString("utf8"));
                // Remove the listeners we set up.
                process.stdout.removeAllListeners('data');
                process.stderr.removeAllListeners('data');
                process.removeAllListeners("close");
            }
        }
        finally {
            this.commandInProcess = false;
            // start running the next command immediately
            this.runNext();
        }
    }
    /**
     * Run the next command in the queue
     */
    runNext() {
        const callback = this.commandQueue.shift();
        if (callback) {
            callback();
        }
    }
    /**
     * Runs an asynchronous CodeQL CLI command without invoking the CLI server, returning any events
     * fired by the command as an asynchronous generator.
     *
     * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
     * @param commandArgs The arguments to pass to the `codeql` command.
     * @param cancellationToken CancellationToken to terminate the test process.
     * @param logger Logger to write text output from the command.
     * @returns The sequence of async events produced by the command.
     */
    runAsyncCodeQlCliCommandInternal(command, commandArgs, cancellationToken, logger) {
        return __asyncGenerator(this, arguments, function* runAsyncCodeQlCliCommandInternal_1() {
            var e_1, _a;
            // Add format argument first, in case commandArgs contains positional parameters.
            const args = [
                ...command,
                '--format', 'jsonz',
                ...commandArgs
            ];
            // Spawn the CodeQL process
            const codeqlPath = yield __await(this.getCodeQlPath());
            const childPromise = cpp.spawn(codeqlPath, args);
            const child = childPromise.childProcess;
            let cancellationRegistration = undefined;
            try {
                if (cancellationToken !== undefined) {
                    cancellationRegistration = cancellationToken.onCancellationRequested(_e => {
                        tk(child.pid);
                    });
                }
                if (logger !== undefined) {
                    // The human-readable output goes to stderr.
                    logStream(child.stderr, logger);
                }
                try {
                    for (var _b = __asyncValues(yield __await(splitStreamAtSeparators(child.stdout, ['\0']))), _c; _c = yield __await(_b.next()), !_c.done;) {
                        const event = _c.value;
                        yield yield __await(event);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                yield __await(childPromise);
            }
            finally {
                if (cancellationRegistration !== undefined) {
                    cancellationRegistration.dispose();
                }
            }
        });
    }
    /**
     * Runs an asynchronous CodeQL CLI command without invoking the CLI server, returning any events
     * fired by the command as an asynchronous generator.
     *
     * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
     * @param commandArgs The arguments to pass to the `codeql` command.
     * @param description Description of the action being run, to be shown in log and error messages.
     * @param cancellationToken CancellationToken to terminate the test process.
     * @param logger Logger to write text output from the command.
     * @returns The sequence of async events produced by the command.
     */
    runAsyncCodeQlCliCommand(command, commandArgs, description, cancellationToken, logger) {
        return __asyncGenerator(this, arguments, function* runAsyncCodeQlCliCommand_1() {
            var e_2, _a;
            try {
                for (var _b = __asyncValues(yield __await(this.runAsyncCodeQlCliCommandInternal(command, commandArgs, cancellationToken, logger))), _c; _c = yield __await(_b.next()), !_c.done;) {
                    const event = _c.value;
                    try {
                        yield yield __await(JSON.parse(event));
                    }
                    catch (err) {
                        throw new Error(`Parsing output of ${description} failed: ${err.stderr || err}`);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
    }
    /**
     * Runs a CodeQL CLI command on the server, returning the output as a string.
     * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
     * @param commandArgs The arguments to pass to the `codeql` command.
     * @param description Description of the action being run, to be shown in log and error messages.
     * @param progressReporter Used to output progress messages, e.g. to the status bar.
     * @returns The contents of the command's stdout, if the command succeeded.
     */
    runCodeQlCliCommand(command, commandArgs, description, progressReporter) {
        if (progressReporter) {
            progressReporter.report({ message: description });
        }
        return new Promise((resolve, reject) => {
            // Construct the command that actually does the work
            const callback = () => {
                try {
                    this.runCodeQlCliInternal(command, commandArgs, description).then(resolve, reject);
                }
                catch (err) {
                    reject(err);
                }
            };
            // If the server is not running a command, then run the given command immediately,
            // otherwise add to the queue
            if (this.commandInProcess) {
                this.commandQueue.push(callback);
            }
            else {
                callback();
            }
        });
    }
    /**
     * Runs a CodeQL CLI command, returning the output as JSON.
     * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
     * @param commandArgs The arguments to pass to the `codeql` command.
     * @param description Description of the action being run, to be shown in log and error messages.
     * @param progressReporter Used to output progress messages, e.g. to the status bar.
     * @returns The contents of the command's stdout, if the command succeeded.
     */
    async runJsonCodeQlCliCommand(command, commandArgs, description, progressReporter) {
        // Add format argument first, in case commandArgs contains positional parameters.
        const args = ['--format', 'json'].concat(commandArgs);
        const result = await this.runCodeQlCliCommand(command, args, description, progressReporter);
        try {
            return JSON.parse(result);
        }
        catch (err) {
            throw new Error(`Parsing output of ${description} failed: ${err.stderr || err}`);
        }
    }
    /**
     * Resolve the library path and dbscheme for a query.
     * @param workspaces The current open workspaces
     * @param queryPath The path to the query
     */
    async resolveLibraryPath(workspaces, queryPath) {
        const subcommandArgs = [
            '--query', queryPath,
            "--additional-packs",
            workspaces.join(path.delimiter)
        ];
        return await this.runJsonCodeQlCliCommand(['resolve', 'library-path'], subcommandArgs, "Resolving library paths");
    }
    /**
     * Finds all available QL tests in a given directory.
     * @param testPath Root of directory tree to search for tests.
     * @returns The list of tests that were found.
     */
    async resolveTests(testPath) {
        const subcommandArgs = [
            testPath
        ];
        return await this.runJsonCodeQlCliCommand(['resolve', 'tests'], subcommandArgs, 'Resolving tests');
    }
    /**
     * Runs QL tests.
     * @param testPaths Full paths of the tests to run.
     * @param workspaces Workspace paths to use as search paths for QL packs.
     * @param options Additional options.
     */
    runTests(testPaths, workspaces, options) {
        return __asyncGenerator(this, arguments, function* runTests_1() {
            var e_3, _a;
            const subcommandArgs = [
                '--additional-packs', workspaces.join(path.delimiter),
                '--threads', '8',
                ...testPaths
            ];
            try {
                for (var _b = __asyncValues(yield __await(this.runAsyncCodeQlCliCommand(['test', 'run'], subcommandArgs, 'Run CodeQL Tests', options.cancellationToken, options.logger))), _c; _c = yield __await(_b.next()), !_c.done;) {
                    const event = _c.value;
                    yield yield __await(event);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    }
    /**
     * Gets the metadata for a query.
     * @param queryPath The path to the query.
     */
    async resolveMetadata(queryPath) {
        return await this.runJsonCodeQlCliCommand(['resolve', 'metadata'], [queryPath], "Resolving query metadata");
    }
    /**
     * Gets the RAM setting for the query server.
     * @param queryMemoryMb The maximum amount of RAM to use, in MB.
     * Leave `undefined` for CodeQL to choose a limit based on the available system memory.
     * @param progressReporter The progress reporter to send progress information to.
     * @returns String arguments that can be passed to the CodeQL query server,
     * indicating how to split the given RAM limit between heap and off-heap memory.
     */
    async resolveRam(queryMemoryMb, progressReporter) {
        const args = [];
        if (queryMemoryMb !== undefined) {
            args.push('--ram', queryMemoryMb.toString());
        }
        return await this.runJsonCodeQlCliCommand(['resolve', 'ram'], args, "Resolving RAM settings", progressReporter);
    }
    /**
     * Gets the headers (and optionally pagination info) of a bqrs.
     * @param bqrsPath The path to the bqrs.
     * @param pageSize The page size to precompute offsets into the binary file for.
     */
    async bqrsInfo(bqrsPath, pageSize) {
        const subcommandArgs = (pageSize ? ["--paginate-rows", pageSize.toString()] : []).concat(bqrsPath);
        return await this.runJsonCodeQlCliCommand(['bqrs', 'info'], subcommandArgs, "Reading bqrs header");
    }
    /**
    * Gets the results from a bqrs.
    * @param bqrsPath The path to the bqrs.
    * @param resultSet The result set to get.
    * @param pageSize How many results to get.
    * @param offset The 0-based index of the first result to get.
    */
    async bqrsDecode(bqrsPath, resultSet, pageSize, offset) {
        const subcommandArgs = [
            "--entities=url,string",
            "--result-set", resultSet,
        ].concat(pageSize ? ["--rows", pageSize.toString()] : []).concat(offset ? ["--start-at", offset.toString()] : []).concat([bqrsPath]);
        return await this.runJsonCodeQlCliCommand(['bqrs', 'decode'], subcommandArgs, "Reading bqrs data");
    }
    async interpretBqrs(metadata, resultsPath, interpretedResultsPath, sourceInfo) {
        const args = [
            `-t=kind=${metadata.kind}`,
            `-t=id=${metadata.id}`,
            "--output", interpretedResultsPath,
            "--format", SARIF_FORMAT,
            // TODO: This flag means that we don't group interpreted results
            // by primary location. We may want to revisit whether we call
            // interpretation with and without this flag, or do some
            // grouping client-side.
            "--no-group-results",
        ];
        if (sourceInfo !== undefined) {
            args.push("--source-archive", sourceInfo.sourceArchive, "--source-location-prefix", sourceInfo.sourceLocationPrefix);
        }
        args.push(resultsPath);
        await this.runCodeQlCliCommand(['bqrs', 'interpret'], args, "Interpreting query results");
        let output;
        try {
            output = await fs.readFile(interpretedResultsPath, 'utf8');
        }
        catch (err) {
            throw new Error(`Reading output of interpretation failed: ${err.stderr || err}`);
        }
        try {
            return JSON.parse(output);
        }
        catch (err) {
            throw new Error(`Parsing output of interpretation failed: ${err.stderr || err}`);
        }
    }
    async sortBqrs(resultsPath, sortedResultsPath, resultSet, sortKeys, sortDirections) {
        const sortDirectionStrings = sortDirections.map(direction => {
            switch (direction) {
                case interface_types_1.SortDirection.asc:
                    return "asc";
                case interface_types_1.SortDirection.desc:
                    return "desc";
                default:
                    return helpers_pure_1.assertNever(direction);
            }
        });
        await this.runCodeQlCliCommand(['bqrs', 'decode'], [
            "--format=bqrs",
            `--result-set=${resultSet}`,
            `--output=${sortedResultsPath}`,
            `--sort-key=${sortKeys.join(",")}`,
            `--sort-direction=${sortDirectionStrings.join(",")}`,
            resultsPath
        ], "Sorting query results");
    }
    /**
     * Returns the `DbInfo` for a database.
     * @param databasePath Path to the CodeQL database to obtain information from.
     */
    resolveDatabase(databasePath) {
        return this.runJsonCodeQlCliCommand(['resolve', 'database'], [databasePath], "Resolving database");
    }
    /**
     * Gets information necessary for upgrading a database.
     * @param dbScheme the path to the dbscheme of the database to be upgraded.
     * @param searchPath A list of directories to search for upgrade scripts.
     * @returns A list of database upgrade script directories
     */
    resolveUpgrades(dbScheme, searchPath) {
        const args = ['--additional-packs', searchPath.join(path.delimiter), '--dbscheme', dbScheme];
        return this.runJsonCodeQlCliCommand(['resolve', 'upgrades'], args, "Resolving database upgrade scripts");
    }
    /**
     * Gets information about available qlpacks
     * @param additionalPacks A list of directories to search for qlpacks before searching in `searchPath`.
     * @param searchPath A list of directories to search for packs not found in `additionalPacks`. If undefined,
     *   the default CLI search path is used.
     * @returns A dictionary mapping qlpack name to the directory it comes from
     */
    resolveQlpacks(additionalPacks, searchPath) {
        const args = ['--additional-packs', additionalPacks.join(path.delimiter)];
        if (searchPath !== undefined) {
            args.push('--search-path', path.join(...searchPath));
        }
        return this.runJsonCodeQlCliCommand(['resolve', 'qlpacks'], args, "Resolving qlpack information");
    }
    /**
     * Gets information about queries in a query suite.
     * @param suite The suite to resolve.
     * @param additionalPacks A list of directories to search for qlpacks before searching in `searchPath`.
     * @param searchPath A list of directories to search for packs not found in `additionalPacks`. If undefined,
     *   the default CLI search path is used.
     * @returns A list of query files found.
     */
    resolveQueriesInSuite(suite, additionalPacks, searchPath) {
        const args = ['--additional-packs', additionalPacks.join(path.delimiter)];
        if (searchPath !== undefined) {
            args.push('--search-path', path.join(...searchPath));
        }
        args.push(suite);
        return this.runJsonCodeQlCliCommand(['resolve', 'queries'], args, "Resolving queries");
    }
}
exports.CodeQLCliServer = CodeQLCliServer;
/**
 * Spawns a child server process using the CodeQL CLI
 * and attaches listeners to it.
 *
 * @param config The configuration containing the path to the CLI.
 * @param name Name of the server being started, to be shown in log and error messages.
 * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
 * @param commandArgs The arguments to pass to the `codeql` command.
 * @param logger Logger to write startup messages.
 * @param stderrListener Listener for log messages from the server's stderr stream.
 * @param stdoutListener Optional listener for messages from the server's stdout stream.
 * @param progressReporter Used to output progress messages, e.g. to the status bar.
 * @returns The started child process.
 */
function spawnServer(codeqlPath, name, command, commandArgs, logger, stderrListener, stdoutListener, progressReporter) {
    // Enable verbose logging.
    const args = command.concat(commandArgs).concat(LOGGING_FLAGS);
    // Start the server process.
    const base = codeqlPath;
    const argsString = args.join(" ");
    if (progressReporter !== undefined) {
        progressReporter.report({ message: `Starting ${name}` });
    }
    logger.log(`Starting ${name} using CodeQL CLI: ${base} ${argsString}`);
    const child = child_process.spawn(base, args);
    if (!child || !child.pid) {
        throw new Error(`Failed to start ${name} using command ${base} ${argsString}.`);
    }
    // Set up event listeners.
    child.on('close', (code) => logger.log(`Child process exited with code ${code}`));
    child.stderr.on('data', stderrListener);
    if (stdoutListener !== undefined) {
        child.stdout.on('data', stdoutListener);
    }
    if (progressReporter !== undefined) {
        progressReporter.report({ message: `Started ${name}` });
    }
    logger.log(`${name} started on PID: ${child.pid}`);
    return child;
}
exports.spawnServer = spawnServer;
/**
 * Runs a CodeQL CLI command without invoking the CLI server, returning the output as a string.
 * @param config The configuration containing the path to the CLI.
 * @param command The `codeql` command to be run, provided as an array of command/subcommand names.
 * @param commandArgs The arguments to pass to the `codeql` command.
 * @param description Description of the action being run, to be shown in log and error messages.
 * @param logger Logger to write command log messages, e.g. to an output channel.
 * @param progressReporter Used to output progress messages, e.g. to the status bar.
 * @returns The contents of the command's stdout, if the command succeeded.
 */
async function runCodeQlCliCommand(codeQlPath, command, commandArgs, description, logger, progressReporter) {
    // Add logging arguments first, in case commandArgs contains positional parameters.
    const args = command.concat(LOGGING_FLAGS).concat(commandArgs);
    const argsString = args.join(" ");
    try {
        if (progressReporter !== undefined) {
            progressReporter.report({ message: description });
        }
        logger.log(`${description} using CodeQL CLI: ${codeQlPath} ${argsString}...`);
        const result = await util.promisify(child_process.execFile)(codeQlPath, args);
        logger.log(result.stderr);
        logger.log(`CLI command succeeded.`);
        return result.stdout;
    }
    catch (err) {
        throw new Error(`${description} failed: ${err.stderr || err}`);
    }
}
exports.runCodeQlCliCommand = runCodeQlCliCommand;
/**
 * Buffer to hold state used when splitting a text stream into lines.
 */
class SplitBuffer {
    constructor(separators) {
        this.separators = separators;
        this.decoder = new string_decoder_1.StringDecoder('utf8');
        this.buffer = '';
        this.searchIndex = 0;
        this.maxSeparatorLength = separators.map(s => s.length).reduce((a, b) => Math.max(a, b), 0);
    }
    /**
     * Append new text data to the buffer.
     * @param chunk The chunk of data to append.
     */
    addChunk(chunk) {
        this.buffer += this.decoder.write(chunk);
    }
    /**
     * Signal that the end of the input stream has been reached.
     */
    end() {
        this.buffer += this.decoder.end();
        this.buffer += this.separators[0]; // Append a separator to the end to ensure the last line is returned.
    }
    /**
     * Extract the next full line from the buffer, if one is available.
     * @returns The text of the next available full line (without the separator), or `undefined` if no
     * line is available.
     */
    getNextLine() {
        while (this.searchIndex <= (this.buffer.length - this.maxSeparatorLength)) {
            for (const separator of this.separators) {
                if (this.buffer.startsWith(separator, this.searchIndex)) {
                    const line = this.buffer.substr(0, this.searchIndex);
                    this.buffer = this.buffer.substr(this.searchIndex + separator.length);
                    this.searchIndex = 0;
                    return line;
                }
            }
            this.searchIndex++;
        }
        return undefined;
    }
}
/**
 * Splits a text stream into lines based on a list of valid line separators.
 * @param stream The text stream to split. This stream will be fully consumed.
 * @param separators The list of strings that act as line separators.
 * @returns A sequence of lines (not including separators).
 */
function splitStreamAtSeparators(stream, separators) {
    return __asyncGenerator(this, arguments, function* splitStreamAtSeparators_1() {
        var e_4, _a;
        const buffer = new SplitBuffer(separators);
        try {
            for (var stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), !stream_1_1.done;) {
                const chunk = stream_1_1.value;
                buffer.addChunk(chunk);
                let line;
                do {
                    line = buffer.getNextLine();
                    if (line !== undefined) {
                        yield yield __await(line);
                    }
                } while (line !== undefined);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (stream_1_1 && !stream_1_1.done && (_a = stream_1.return)) yield __await(_a.call(stream_1));
            }
            finally { if (e_4) throw e_4.error; }
        }
        buffer.end();
        let line;
        do {
            line = buffer.getNextLine();
            if (line !== undefined) {
                yield yield __await(line);
            }
        } while (line !== undefined);
    });
}
/**
 *  Standard line endings for splitting human-readable text.
 */
const lineEndings = ['\r\n', '\r', '\n'];
/**
 * Log a text stream to a `Logger` interface.
 * @param stream The stream to log.
 * @param logger The logger that will consume the stream output.
 */
async function logStream(stream, logger) {
    var e_5, _a;
    try {
        for (var _b = __asyncValues(await splitStreamAtSeparators(stream, lineEndings)), _c; _c = await _b.next(), !_c.done;) {
            const line = _c.value;
            logger.log(line);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
        }
        finally { if (e_5) throw e_5.error; }
    }
}

//# sourceMappingURL=cli.js.map
