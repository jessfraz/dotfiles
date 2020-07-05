import { NotificationHandler } from "vscode-languageserver";
import { GraphQLSchema } from "graphql";
import { RemoteServiceConfig } from "../../config";
import { GraphQLSchemaProvider, SchemaChangeUnsubscribeHandler } from "./base";
export declare class EndpointSchemaProvider implements GraphQLSchemaProvider {
    private config;
    private schema?;
    private federatedServiceSDL?;
    constructor(config: Exclude<RemoteServiceConfig, "name">);
    resolveSchema(): Promise<GraphQLSchema>;
    onSchemaChange(_handler: NotificationHandler<GraphQLSchema>): SchemaChangeUnsubscribeHandler;
    resolveFederatedServiceSDL(): Promise<string | void>;
}
//# sourceMappingURL=endpoint.d.ts.map