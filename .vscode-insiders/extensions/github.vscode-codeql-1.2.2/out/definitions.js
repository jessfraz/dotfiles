"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const yaml = require("js-yaml");
const tmp = require("tmp");
const vscode = require("vscode");
const archive_filesystem_provider_1 = require("./archive-filesystem-provider");
const bqrs_cli_types_1 = require("./bqrs-cli-types");
const helpers = require("./helpers");
const helpers_1 = require("./helpers");
const messages = require("./messages");
const run_queries_1 = require("./run-queries");
/**
 * Run templated CodeQL queries to find definitions and references in
 * source-language files. We may eventually want to find a way to
 * generalize this to other custom queries, e.g. showing dataflow to
 * or from a selected identifier.
 */
const TEMPLATE_NAME = "selectedSourceFile";
const SELECT_QUERY_NAME = "#select";
var KeyType;
(function (KeyType) {
    KeyType["DefinitionQuery"] = "DefinitionQuery";
    KeyType["ReferenceQuery"] = "ReferenceQuery";
})(KeyType || (KeyType = {}));
function tagOfKeyType(keyType) {
    switch (keyType) {
        case KeyType.DefinitionQuery: return "ide-contextual-queries/local-definitions";
        case KeyType.ReferenceQuery: return "ide-contextual-queries/local-references";
    }
}
function nameOfKeyType(keyType) {
    switch (keyType) {
        case KeyType.DefinitionQuery: return "definitions";
        case KeyType.ReferenceQuery: return "references";
    }
}
async function resolveQueries(cli, qlpack, keyType) {
    const suiteFile = tmp.fileSync({ postfix: '.qls' }).name;
    const suiteYaml = { qlpack, include: { kind: 'definitions', 'tags contain': tagOfKeyType(keyType) } };
    await fs.writeFile(suiteFile, yaml.safeDump(suiteYaml), 'utf8');
    const queries = await cli.resolveQueriesInSuite(suiteFile, helpers.getOnDiskWorkspaceFolders());
    if (queries.length === 0) {
        vscode.window.showErrorMessage(`No ${nameOfKeyType(keyType)} queries (tagged "${tagOfKeyType(keyType)}") could be found in the current library path. It might be necessary to upgrade the CodeQL libraries.`);
        throw new Error(`Couldn't find any queries tagged ${tagOfKeyType(keyType)} for qlpack ${qlpack}`);
    }
    return queries;
}
async function qlpackOfDatabase(cli, db) {
    if (db.contents === undefined)
        return undefined;
    const datasetPath = db.contents.datasetUri.fsPath;
    const { qlpack } = await helpers.resolveDatasetFolder(cli, datasetPath);
    return qlpack;
}
class TemplateQueryDefinitionProvider {
    constructor(cli, qs, dbm) {
        this.cli = cli;
        this.qs = qs;
        this.dbm = dbm;
        this.cache = new helpers_1.CachedOperation(this.getDefinitions.bind(this));
    }
    async getDefinitions(uriString) {
        return getLinksForUriString(this.cli, this.qs, this.dbm, uriString, KeyType.DefinitionQuery, (src, _dest) => src === uriString);
    }
    async provideDefinition(document, position, _token) {
        const fileLinks = await this.cache.get(document.uri.toString());
        const locLinks = [];
        for (const link of fileLinks) {
            if (link.originSelectionRange.contains(position)) {
                locLinks.push(link);
            }
        }
        return locLinks;
    }
}
exports.TemplateQueryDefinitionProvider = TemplateQueryDefinitionProvider;
class TemplateQueryReferenceProvider {
    constructor(cli, qs, dbm) {
        this.cli = cli;
        this.qs = qs;
        this.dbm = dbm;
        this.cache = new helpers_1.CachedOperation(this.getReferences.bind(this));
    }
    async getReferences(uriString) {
        return getLinksForUriString(this.cli, this.qs, this.dbm, uriString, KeyType.ReferenceQuery, (_src, dest) => dest === uriString);
    }
    async provideReferences(document, position, _context, _token) {
        const fileLinks = await this.cache.get(document.uri.toString());
        const locLinks = [];
        for (const link of fileLinks) {
            if (link.targetRange.contains(position)) {
                locLinks.push({ range: link.originSelectionRange, uri: link.originUri });
            }
        }
        return locLinks;
    }
}
exports.TemplateQueryReferenceProvider = TemplateQueryReferenceProvider;
async function getLinksFromResults(results, cli, db, filter) {
    const localLinks = [];
    const bqrsPath = results.query.resultsPaths.resultsPath;
    const info = await cli.bqrsInfo(bqrsPath);
    const selectInfo = bqrs_cli_types_1.getResultSetSchema(SELECT_QUERY_NAME, info);
    if (selectInfo && selectInfo.columns.length == 3
        && selectInfo.columns[0].kind == bqrs_cli_types_1.ColumnKindCode.ENTITY
        && selectInfo.columns[1].kind == bqrs_cli_types_1.ColumnKindCode.ENTITY
        && selectInfo.columns[2].kind == bqrs_cli_types_1.ColumnKindCode.STRING) {
        // TODO: Page this
        const allTuples = await cli.bqrsDecode(bqrsPath, SELECT_QUERY_NAME);
        for (const tuple of allTuples.tuples) {
            const src = tuple[0];
            const dest = tuple[1];
            const srcFile = src.url && fileRangeFromURI(src.url, db);
            const destFile = dest.url && fileRangeFromURI(dest.url, db);
            if (srcFile && destFile && filter(srcFile.file.toString(), destFile.file.toString())) {
                localLinks.push({ targetRange: destFile.range, targetUri: destFile.file, originSelectionRange: srcFile.range, originUri: srcFile.file });
            }
        }
    }
    return localLinks;
}
async function getLinksForUriString(cli, qs, dbm, uriString, keyType, filter) {
    const uri = archive_filesystem_provider_1.decodeSourceArchiveUri(vscode.Uri.parse(uriString));
    const sourceArchiveUri = vscode.Uri.file(uri.sourceArchiveZipPath).with({ scheme: archive_filesystem_provider_1.zipArchiveScheme });
    const db = dbm.findDatabaseItemBySourceArchive(sourceArchiveUri);
    if (db) {
        const qlpack = await qlpackOfDatabase(cli, db);
        if (qlpack === undefined) {
            throw new Error("Can't infer qlpack from database source archive");
        }
        const links = [];
        for (const query of await resolveQueries(cli, qlpack, keyType)) {
            const templates = {
                [TEMPLATE_NAME]: {
                    values: {
                        tuples: [[{
                                    stringValue: uri.pathWithinSourceArchive
                                }]]
                    }
                }
            };
            const results = await run_queries_1.compileAndRunQueryAgainstDatabase(cli, qs, db, false, vscode.Uri.file(query), templates);
            if (results.result.resultType == messages.QueryResultType.SUCCESS) {
                links.push(...await getLinksFromResults(results, cli, db, filter));
            }
        }
        return links;
    }
    else {
        return [];
    }
}
function fileRangeFromURI(uri, db) {
    if (typeof uri === "string") {
        return undefined;
    }
    else if ('startOffset' in uri) {
        return undefined;
    }
    else {
        const loc = uri;
        const range = new vscode.Range(Math.max(0, loc.startLine - 1), Math.max(0, loc.startColumn - 1), Math.max(0, loc.endLine - 1), Math.max(0, loc.endColumn));
        try {
            const parsed = vscode.Uri.parse(uri.uri, true);
            if (parsed.scheme === "file") {
                return { file: db.resolveSourceFile(parsed.fsPath), range };
            }
            return undefined;
        }
        catch (e) {
            return undefined;
        }
    }
}

//# sourceMappingURL=definitions.js.map
