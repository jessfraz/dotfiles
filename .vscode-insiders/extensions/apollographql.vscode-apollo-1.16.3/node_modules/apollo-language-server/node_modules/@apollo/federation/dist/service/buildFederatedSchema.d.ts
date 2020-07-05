import { DocumentNode, GraphQLSchema } from 'graphql';
import { GraphQLSchemaModule, GraphQLResolverMap } from 'apollo-graphql';
import 'apollo-server-env';
declare type LegacySchemaModule = {
    typeDefs: DocumentNode | DocumentNode[];
    resolvers?: GraphQLResolverMap<any>;
};
export declare function buildFederatedSchema(modulesOrSDL: (GraphQLSchemaModule | DocumentNode)[] | DocumentNode | LegacySchemaModule): GraphQLSchema;
export {};
//# sourceMappingURL=buildFederatedSchema.d.ts.map