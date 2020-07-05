"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
exports.default = {
    test(value) {
        return value && value instanceof graphql_1.GraphQLError;
    },
    print(value, print) {
        return print({
            message: value.message,
            code: value.extensions ? value.extensions.code : 'MISSING_ERROR',
        });
    },
};
//# sourceMappingURL=graphqlErrorSerializer.js.map