"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
exports.default = {
    test(value) {
        return (Array.isArray(value) && value.length > 0 && value.every(graphql_1.isSelectionNode));
    },
    print(selectionNodes) {
        return selectionNodes.map(node => graphql_1.print(node)).join('\n');
    },
};
//# sourceMappingURL=selectionSetSerializer.js.map