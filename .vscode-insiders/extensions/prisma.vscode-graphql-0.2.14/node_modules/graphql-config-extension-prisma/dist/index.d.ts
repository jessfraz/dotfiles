import { GraphQLConfig, GraphQLConfigData, GraphQLProjectConfig } from 'graphql-config';
export declare function patchConfig<T extends GraphQLConfig | GraphQLProjectConfig>(config: T, cwd?: string, envVars?: {
    [key: string]: any;
}): Promise<T>;
export declare function getCustomDirectives(version?: string): string[];
export declare function patchEndpointsToConfig<T extends GraphQLConfig | GraphQLProjectConfig>(config: T, cwd?: string, envVars?: {
    [key: string]: any;
}, graceful?: boolean): Promise<T>;
export declare function patchEndpointsToConfigData(config: GraphQLConfigData, cwd?: string, envVars?: {
    [key: string]: any;
}, graceful?: boolean): Promise<GraphQLConfigData>;
export declare function makeConfigFromPath(cwd?: string, envVars?: {
    [key: string]: any;
}): Promise<GraphQLConfig | null>;
