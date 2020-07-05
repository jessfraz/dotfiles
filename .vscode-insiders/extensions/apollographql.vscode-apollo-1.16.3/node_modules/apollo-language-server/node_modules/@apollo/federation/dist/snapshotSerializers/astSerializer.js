"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
exports.default = {
    test(value) {
        return value && typeof value.kind === 'string';
    },
    serialize(value, _config, indentation, _depth, _refs, _printer) {
        return graphql_1.print(value)
            .trim()
            .replace(/\n/g, '\n' + indentation);
    },
};
//# sourceMappingURL=astSerializer.js.map