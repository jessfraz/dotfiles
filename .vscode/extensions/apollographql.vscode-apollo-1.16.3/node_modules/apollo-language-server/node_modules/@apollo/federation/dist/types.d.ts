import { GraphQLFieldConfig, GraphQLUnionType, GraphQLObjectType, GraphQLScalarType, GraphQLType, GraphQLNamedType, GraphQLResolveInfo } from 'graphql';
export declare const EntityType: GraphQLUnionType;
export declare const ServiceType: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const AnyType: GraphQLScalarType;
export declare type GraphQLReferenceResolver<TContext> = (reference: object, context: TContext, info: GraphQLResolveInfo) => any;
declare module 'graphql/type/definition' {
    interface GraphQLObjectType {
        resolveReference?: GraphQLReferenceResolver<any>;
    }
    interface GraphQLObjectTypeConfig<TSource, TContext> {
        resolveReference?: GraphQLReferenceResolver<TContext>;
    }
}
export declare const entitiesField: GraphQLFieldConfig<any, any>;
export declare const serviceField: GraphQLFieldConfig<any, any>;
export declare const federationTypes: GraphQLNamedType[];
export declare function isFederationType(type: GraphQLType): boolean;
//# sourceMappingURL=types.d.ts.map