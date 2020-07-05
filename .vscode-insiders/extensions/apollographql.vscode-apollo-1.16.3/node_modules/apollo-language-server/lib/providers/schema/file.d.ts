import { GraphQLSchema } from "graphql";
import { GraphQLSchemaProvider, SchemaChangeUnsubscribeHandler } from "./base";
import { NotificationHandler } from "vscode-languageserver";
export interface FileSchemaProviderConfig {
    path?: string;
    paths?: string[];
}
export declare class FileSchemaProvider implements GraphQLSchemaProvider {
    private config;
    private schema?;
    private federatedServiceSDL?;
    constructor(config: FileSchemaProviderConfig);
    resolveSchema(): Promise<GraphQLSchema>;
    loadFileAndGetDocument(path: string): import("graphql").DocumentNode;
    onSchemaChange(_handler: NotificationHandler<GraphQLSchema>): SchemaChangeUnsubscribeHandler;
    resolveFederatedServiceSDL(): Promise<string | void>;
    loadFileAndGetSDL(path: string): string | void;
}
//# sourceMappingURL=file.d.ts.map