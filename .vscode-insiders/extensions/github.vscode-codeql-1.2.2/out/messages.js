"use strict";
/**
 * Types for messages exchanged during jsonrpc communication with the
 * the CodeQL query server.
 *
 * This file exists in the queryserver and in the vscode extension, and
 * should be kept in sync between them.
 *
 * A note about the namespaces below, which look like they are
 * essentially enums, namely Severity, ResultColumnKind, and
 * QueryResultType. By design, for the sake of extensibility, clients
 * receiving messages of this protocol are supposed to accept any
 * number for any of these types. We commit to the given meaning of
 * the numbers listed in constants in the namespaces, and we commit to
 * the fact that any unknown QueryResultType value counts as an error.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rpc = require("vscode-jsonrpc");
/**
 * Severity of different messages. This namespace is intentionally not
 * an enum, see "for the sake of extensibility" comment above.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var Severity;
(function (Severity) {
    /**
     * The message is a compilation error.
     */
    Severity.ERROR = 0;
    /**
     * The message is a compilation warning.
     */
    Severity.WARNING = 1;
})(Severity = exports.Severity || (exports.Severity = {}));
/**
 * The kind of a result column. This namespace is intentionally not an enum, see "for the sake of
 * extensibility" comment above.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var ResultColumnKind;
(function (ResultColumnKind) {
    /**
     * A column of type `float`
     */
    ResultColumnKind.FLOAT = 0;
    /**
     * A column of type `int`
     */
    ResultColumnKind.INTEGER = 1;
    /**
     * A column of type `string`
     */
    ResultColumnKind.STRING = 2;
    /**
     * A column of type `boolean`
     */
    ResultColumnKind.BOOLEAN = 3;
    /**
   * A column of type `date`
   */
    ResultColumnKind.DATE = 4;
    /**
     * A column of a non-primitive type
     */
    ResultColumnKind.ENTITY = 5;
})(ResultColumnKind = exports.ResultColumnKind || (exports.ResultColumnKind = {}));
/**
 * The type of results that are going to be sent into the filter query.
 */
var ResultType;
(function (ResultType) {
    ResultType[ResultType["METRIC"] = 0] = "METRIC";
    ResultType[ResultType["DEFECT"] = 1] = "DEFECT";
})(ResultType = exports.ResultType || (exports.ResultType = {}));
/**
 * The result of running a query. This namespace is intentionally not
 * an enum, see "for the sake of extensibility" comment above.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var QueryResultType;
(function (QueryResultType) {
    /**
     * The query ran successfully
     */
    QueryResultType.SUCCESS = 0;
    /**
     * The query failed due to an reason
     * that isn't listed
     */
    QueryResultType.OTHER_ERROR = 1;
    /**
      * The query failed due to running out of
      * memory
      */
    QueryResultType.OOM = 2;
    /**
     * The query failed due to exceeding the timeout
     */
    QueryResultType.TIMEOUT = 3;
    /**
     * The query failed because it was cancelled.
     */
    QueryResultType.CANCELLATION = 4;
})(QueryResultType = exports.QueryResultType || (exports.QueryResultType = {}));
/**
 * Check a Ql query for errors without compiling it
 */
exports.checkQuery = new rpc.RequestType('compilation/checkQuery');
/**
 * Compile a Ql query into a qlo
 */
exports.compileQuery = new rpc.RequestType('compilation/compileQuery');
/**
 * Compile a dil query into a qlo
 */
exports.compileDilQuery = new rpc.RequestType('compilation/compileDilQuery');
/**
 * Check if there is a valid upgrade path between two dbschemes.
 */
exports.checkUpgrade = new rpc.RequestType('compilation/checkUpgrade');
/**
 * Compile an upgrade script to upgrade a dataset.
 */
exports.compileUpgrade = new rpc.RequestType('compilation/compileUpgrade');
/**
 * Clear the cache of a dataset
 */
exports.clearCache = new rpc.RequestType('evaluation/clearCache');
/**
 * Trim the cache of a dataset
 */
exports.trimCache = new rpc.RequestType('evaluation/trimCache');
/**
 * Run some queries on a dataset
 */
exports.runQueries = new rpc.RequestType('evaluation/runQueries');
/**
 * Run upgrades on a dataset
 */
exports.runUpgrade = new rpc.RequestType('evaluation/runUpgrade');
/**
 * Request returned to the client to notify completion of a query.
 * The full runQueries job is completed when all queries are acknowledged.
 */
exports.completeQuery = new rpc.RequestType('evaluation/queryCompleted');
/**
 * A notification that the progress has been changed.
 */
exports.progress = new rpc.NotificationType('ql/progressUpdated');

//# sourceMappingURL=messages.js.map
