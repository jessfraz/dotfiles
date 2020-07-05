"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["NONE"] = 0] = "NONE";
    LogLevel[LogLevel["ERROR"] = 1] = "ERROR";
    LogLevel[LogLevel["WARNING"] = 2] = "WARNING";
    LogLevel[LogLevel["INFO"] = 3] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
const logLevels = [
    [LogLevel[LogLevel.NONE], LogLevel.NONE],
    [LogLevel[LogLevel.ERROR], LogLevel.ERROR],
    [LogLevel[LogLevel.WARNING], LogLevel.WARNING],
    [LogLevel[LogLevel.INFO], LogLevel.INFO],
    [LogLevel[LogLevel.DEBUG], LogLevel.DEBUG],
    ['INFORMATION', LogLevel.INFO],
];
const levelMap = new Map(logLevels);
const stub = () => { };
class Logger {
    constructor(logLevel = LogLevel.DEBUG, connection) {
        this.logLevel = logLevel;
        this.seq = 0;
        this.logs = [];
        this.loggers = {
            [LogLevel.NONE]: stub,
            [LogLevel.ERROR]: stub,
            [LogLevel.WARNING]: stub,
            [LogLevel.INFO]: stub,
            [LogLevel.DEBUG]: stub,
        };
        if (connection) {
            this.setConnection(connection);
        }
    }
    writeLog(entry) {
        if (!this.connection) {
            this.logs.push(entry);
        }
        else {
            if (entry.level > this.logLevel) {
                return;
            }
            const message = `${entry.seq}\t${entry.ts.toISOString()}\t${entry.msg}`;
            const logger = this.loggers[entry.level];
            if (logger) {
                // console.log(message);
                logger(message);
            }
            else {
                console.error(`Unknown log level: ${entry.level}; msg: ${entry.msg}`);
            }
        }
    }
    logMessage(level, msg) {
        const seq = ++this.seq;
        const entry = {
            seq,
            level,
            ts: new Date(),
            msg
        };
        this.writeLog(entry);
    }
    set level(level) {
        this.logLevel = toLogLevel(level);
    }
    get level() {
        return this.logLevel;
    }
    setConnection(connection) {
        this.connection = connection;
        this.connection.onExit(() => {
            this.connection = undefined;
            this.loggers[LogLevel.ERROR] = stub;
            this.loggers[LogLevel.WARNING] = stub;
            this.loggers[LogLevel.INFO] = stub;
            this.loggers[LogLevel.DEBUG] = stub;
        });
        this.loggers[LogLevel.ERROR] = (msg) => { connection.console.error(msg); };
        this.loggers[LogLevel.WARNING] = (msg) => { connection.console.warn(msg); };
        this.loggers[LogLevel.INFO] = (msg) => { connection.console.info(msg); };
        this.loggers[LogLevel.DEBUG] = (msg) => { connection.console.log(msg); };
        this.logs.forEach(log => this.writeLog(log));
        this.logs.length = 0;
    }
    error(msg) {
        this.logMessage(LogLevel.ERROR, msg);
    }
    warn(msg) {
        this.logMessage(LogLevel.WARNING, msg);
    }
    info(msg) {
        this.logMessage(LogLevel.INFO, msg);
    }
    debug(msg) {
        this.logMessage(LogLevel.DEBUG, msg);
    }
    log(msg) {
        this.debug(msg);
    }
    getPendingEntries() {
        return this.logs;
    }
}
exports.Logger = Logger;
function toLogLevel(level) {
    const lvl = typeof level === 'string'
        ? levelMap.get(level.toUpperCase()) || LogLevel.NONE
        : level;
    return typeof lvl !== 'number' || lvl < LogLevel.NONE || lvl > LogLevel.DEBUG
        ? LogLevel.DEBUG
        : lvl;
}
//# sourceMappingURL=logger.js.map