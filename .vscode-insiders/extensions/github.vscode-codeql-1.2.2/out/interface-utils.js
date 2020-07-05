"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECT_TABLE_NAME = '#select';
exports.ALERTS_TABLE_NAME = 'alerts';
function getDefaultResultSet(resultSets) {
    return getDefaultResultSetName(resultSets.map(resultSet => resultSet.schema.name));
}
exports.getDefaultResultSet = getDefaultResultSet;
function getDefaultResultSetName(resultSetNames) {
    // Choose first available result set from the array
    return [exports.ALERTS_TABLE_NAME, exports.SELECT_TABLE_NAME, resultSetNames[0]].filter(resultSetName => resultSetNames.includes(resultSetName))[0];
}
exports.getDefaultResultSetName = getDefaultResultSetName;

//# sourceMappingURL=interface-utils.js.map
