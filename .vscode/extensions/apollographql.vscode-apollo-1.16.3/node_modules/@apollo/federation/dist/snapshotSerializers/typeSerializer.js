"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
exports.default = {
    test(value) {
        return value && graphql_1.isNamedType(value);
    },
    print(value) {
        return graphql_1.printType(value);
    },
};
//# sourceMappingURL=typeSerializer.js.map