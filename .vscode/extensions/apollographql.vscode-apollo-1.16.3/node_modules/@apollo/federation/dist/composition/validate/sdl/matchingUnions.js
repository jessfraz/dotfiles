"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueUnionTypes = void 0;
const graphql_1 = require("graphql");
const lodash_xorby_1 = __importDefault(require("lodash.xorby"));
const utils_1 = require("../../utils");
const uniqueTypeNamesWithFields_1 = require("./uniqueTypeNamesWithFields");
function UniqueUnionTypes(context) {
    const knownTypes = Object.create(null);
    const schema = context.getSchema();
    return {
        UnionTypeDefinition: validateUnionTypes,
    };
    function validateUnionTypes(node) {
        const typeName = node.name.value;
        const typeFromSchema = schema && schema.getType(typeName);
        const typeNodeFromSchema = typeFromSchema &&
            typeFromSchema.astNode;
        const typeNodeFromDefs = knownTypes[typeName];
        const duplicateTypeNode = typeNodeFromSchema || typeNodeFromDefs;
        if (duplicateTypeNode) {
            const unionDiff = lodash_xorby_1.default(node.types, duplicateTypeNode.types, 'name.value');
            const diffLength = unionDiff.length;
            if (diffLength > 0) {
                context.reportError(utils_1.errorWithCode('VALUE_TYPE_UNION_TYPES_MISMATCH', `${utils_1.logServiceAndType(duplicateTypeNode.serviceName, typeName)}The union \`${typeName}\` is defined in services \`${duplicateTypeNode.serviceName}\` and \`${node.serviceName}\`, however their types do not match. Union types with the same name must also consist of identical types. The type${diffLength > 1 ? 's' : ''} ${unionDiff.map(diffEntry => diffEntry.name.value).join(', ')} ${diffLength > 1 ? 'are' : 'is'} mismatched.`, [node, duplicateTypeNode]));
            }
            return false;
        }
        if (typeFromSchema) {
            context.reportError(new graphql_1.GraphQLError(uniqueTypeNamesWithFields_1.existedTypeNameMessage(typeName), node.name));
            return;
        }
        if (knownTypes[typeName]) {
            context.reportError(new graphql_1.GraphQLError(uniqueTypeNamesWithFields_1.duplicateTypeNameMessage(typeName), [
                knownTypes[typeName],
                node.name,
            ]));
        }
        else {
            knownTypes[typeName] = node;
        }
        return false;
    }
}
exports.UniqueUnionTypes = UniqueUnionTypes;
//# sourceMappingURL=matchingUnions.js.map