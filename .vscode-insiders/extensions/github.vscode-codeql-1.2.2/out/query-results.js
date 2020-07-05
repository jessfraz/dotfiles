"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_queries_1 = require("./run-queries");
const messages = require("./messages");
const helpers = require("./helpers");
const fs = require("fs-extra");
const path = require("path");
class CompletedQuery {
    constructor(evaluation, config) {
        this.config = config;
        this.query = evaluation.query;
        this.result = evaluation.result;
        this.database = evaluation.database;
        this.logFileLocation = evaluation.logFileLocation;
        this.options = evaluation.options;
        this.dispose = evaluation.dispose;
        this.time = new Date().toLocaleString();
        this.sortedResultsInfo = new Map();
    }
    get databaseName() {
        return this.database.name;
    }
    get queryName() {
        return helpers.getQueryName(this.query);
    }
    get statusString() {
        switch (this.result.resultType) {
            case messages.QueryResultType.CANCELLATION:
                return `cancelled after ${this.result.evaluationTime / 1000} seconds`;
            case messages.QueryResultType.OOM:
                return `out of memory`;
            case messages.QueryResultType.SUCCESS:
                return `finished in ${this.result.evaluationTime / 1000} seconds`;
            case messages.QueryResultType.TIMEOUT:
                return `timed out after ${this.result.evaluationTime / 1000} seconds`;
            case messages.QueryResultType.OTHER_ERROR:
            default:
                return this.result.message ? `failed: ${this.result.message}` : 'failed';
        }
    }
    interpolate(template) {
        const { databaseName, queryName, time, statusString } = this;
        const replacements = {
            t: time,
            q: queryName,
            d: databaseName,
            s: statusString,
            '%': '%',
        };
        return template.replace(/%(.)/g, (match, key) => {
            const replacement = replacements[key];
            return replacement !== undefined ? replacement : match;
        });
    }
    getLabel() {
        if (this.options.label !== undefined)
            return this.options.label;
        return this.config.format;
    }
    get didRunSuccessfully() {
        return this.result.resultType === messages.QueryResultType.SUCCESS;
    }
    toString() {
        return this.interpolate(this.getLabel());
    }
    async updateSortState(server, resultSetName, sortState) {
        if (sortState === undefined) {
            this.sortedResultsInfo.delete(resultSetName);
            return;
        }
        const sortedResultSetInfo = {
            resultsPath: path.join(run_queries_1.tmpDir.name, `sortedResults${this.query.queryID}-${resultSetName}.bqrs`),
            sortState
        };
        await server.sortBqrs(this.query.resultsPaths.resultsPath, sortedResultSetInfo.resultsPath, resultSetName, [sortState.columnIndex], [sortState.sortDirection]);
        this.sortedResultsInfo.set(resultSetName, sortedResultSetInfo);
    }
    async updateInterpretedSortState(_server, sortState) {
        this.interpretedResultsSortState = sortState;
    }
}
exports.CompletedQuery = CompletedQuery;
/**
 * Call cli command to interpret results.
 */
async function interpretResults(server, metadata, resultsPaths, sourceInfo) {
    const { resultsPath, interpretedResultsPath } = resultsPaths;
    if (await fs.pathExists(interpretedResultsPath)) {
        return JSON.parse(await fs.readFile(interpretedResultsPath, 'utf8'));
    }
    if (metadata === undefined) {
        throw new Error('Can\'t interpret results without query metadata');
    }
    let { kind, id } = metadata;
    if (kind === undefined) {
        throw new Error('Can\'t interpret results without query metadata including kind');
    }
    if (id === undefined) {
        // Interpretation per se doesn't really require an id, but the
        // SARIF format does, so in the absence of one, we use a dummy id.
        id = "dummy-id";
    }
    return await server.interpretBqrs({ kind, id }, resultsPath, interpretedResultsPath, sourceInfo);
}
exports.interpretResults = interpretResults;

//# sourceMappingURL=query-results.js.map
