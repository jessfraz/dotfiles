import { GraphQLSchema, GraphQLError } from 'graphql';
import { ServiceDefinition } from '../types';
export declare function validateServicesBeforeNormalization(services: ServiceDefinition[]): GraphQLError[];
export declare const validateServicesBeforeComposition: (services: ServiceDefinition[]) => GraphQLError[];
export declare const validateComposedSchema: ({ schema, serviceList, }: {
    schema: GraphQLSchema;
    serviceList: ServiceDefinition[];
}) => GraphQLError[];
//# sourceMappingURL=index.d.ts.map