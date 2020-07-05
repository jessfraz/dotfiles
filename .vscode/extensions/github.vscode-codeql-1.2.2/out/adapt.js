"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semmle_bqrs_1 = require("semmle-bqrs");
function adaptKind(kind) {
    // XXX what about 'u'?
    if (kind === 'e') {
        return { type: 'e', primitiveType: 's', locationStyle: semmle_bqrs_1.LocationStyle.FivePart, hasLabel: true };
    }
    else {
        return { type: kind };
    }
}
function adaptColumn(col) {
    return { name: col.name, type: adaptKind(col.kind) };
}
function adaptSchema(schema) {
    return {
        columns: schema.columns.map(adaptColumn),
        name: schema.name,
        tupleCount: schema.rows,
        version: 0,
    };
}
exports.adaptSchema = adaptSchema;
function adaptValue(val) {
    // XXX taking a lot of incorrect shortcuts here
    if (typeof val === 'string') {
        return val;
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
        return val + '';
    }
    const url = val.url;
    if (typeof url === 'string') {
        return url;
    }
    if (url === undefined) {
        return 'none';
    }
    return {
        label: val.label || '',
        location: {
            t: semmle_bqrs_1.LocationStyle.FivePart,
            lineStart: url.startLine,
            lineEnd: url.endLine,
            colStart: url.startColumn,
            colEnd: url.endColumn,
            // FIXME: This seems definitely wrong. Should we be using
            // something like the code in sarif-utils.ts?
            file: url.uri.replace(/file:/, ''),
        }
    };
}
exports.adaptValue = adaptValue;
function adaptRow(row) {
    return row.map(adaptValue);
}
exports.adaptRow = adaptRow;
function adaptBqrs(schema, page) {
    return {
        schema,
        rows: page.tuples.map(adaptRow),
    };
}
exports.adaptBqrs = adaptBqrs;

//# sourceMappingURL=adapt.js.map
