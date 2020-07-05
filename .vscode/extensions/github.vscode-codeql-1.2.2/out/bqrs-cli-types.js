"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_SIZE = 1000;
/**
 * The single-character codes used in the bqrs format for the the kind
 * of a result column. This namespace is intentionally not an enum, see
 * the "for the sake of extensibility" comment in messages.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var ColumnKindCode;
(function (ColumnKindCode) {
    ColumnKindCode.FLOAT = "f";
    ColumnKindCode.INTEGER = "i";
    ColumnKindCode.STRING = "s";
    ColumnKindCode.BOOLEAN = "b";
    ColumnKindCode.DATE = "d";
    ColumnKindCode.ENTITY = "e";
})(ColumnKindCode = exports.ColumnKindCode || (exports.ColumnKindCode = {}));
function getResultSetSchema(resultSetName, resultSets) {
    for (const schema of resultSets["result-sets"]) {
        if (schema.name === resultSetName) {
            return schema;
        }
    }
    return undefined;
}
exports.getResultSetSchema = getResultSetSchema;

//# sourceMappingURL=bqrs-cli-types.js.map
