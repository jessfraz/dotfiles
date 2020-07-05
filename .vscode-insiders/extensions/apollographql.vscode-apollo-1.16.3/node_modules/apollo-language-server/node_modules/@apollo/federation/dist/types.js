"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFederationType = exports.federationTypes = exports.serviceField = exports.entitiesField = exports.AnyType = exports.ServiceType = exports.EntityType = void 0;
const graphql_1 = require("graphql");
exports.EntityType = new graphql_1.GraphQLUnionType({
    name: '_Entity',
    types: [],
});
exports.ServiceType = new graphql_1.GraphQLObjectType({
    name: '_Service',
    fields: {
        sdl: {
            type: graphql_1.GraphQLString,
            description: 'The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied',
        },
    },
});
exports.AnyType = new graphql_1.GraphQLScalarType({
    name: '_Any',
    serialize(value) {
        return value;
    },
});
function isPromise(value) {
    return Boolean(value && 'then' in value && typeof value.then === 'function');
}
function addTypeNameToPossibleReturn(maybeObject, typename) {
    if (maybeObject !== null && typeof maybeObject === 'object') {
        Object.defineProperty(maybeObject, '__typename', {
            value: typename,
        });
    }
    return maybeObject;
}
exports.entitiesField = {
    type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(exports.EntityType)),
    args: {
        representations: {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AnyType))),
        },
    },
    resolve(_source, { representations }, context, info) {
        return representations.map((reference) => {
            const { __typename } = reference;
            const type = info.schema.getType(__typename);
            if (!type || !graphql_1.isObjectType(type)) {
                throw new Error(`The _entities resolver tried to load an entity for type "${__typename}", but no object type of that name was found in the schema`);
            }
            const resolveReference = type.resolveReference
                ? type.resolveReference
                : function defaultResolveReference() {
                    return reference;
                };
            const result = resolveReference(reference, context, info);
            if (isPromise(result)) {
                return result.then((x) => addTypeNameToPossibleReturn(x, __typename));
            }
            return addTypeNameToPossibleReturn(result, __typename);
        });
    },
};
exports.serviceField = {
    type: new graphql_1.GraphQLNonNull(exports.ServiceType),
};
exports.federationTypes = [
    exports.ServiceType,
    exports.AnyType,
    exports.EntityType,
];
function isFederationType(type) {
    return (graphql_1.isNamedType(type) && exports.federationTypes.some(({ name }) => name === type.name));
}
exports.isFederationType = isFederationType;
//# sourceMappingURL=types.js.map