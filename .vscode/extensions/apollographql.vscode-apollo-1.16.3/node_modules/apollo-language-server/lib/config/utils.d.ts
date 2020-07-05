import { ApolloConfig, ClientConfig, ClientServiceConfig, LocalServiceConfig, ServiceConfig, ApolloConfigFormat } from "./config";
import { ServiceSpecifier, ServiceIDAndTag } from "../engine";
export declare function isClientConfig(config: ApolloConfig): config is ClientConfig;
export declare function isLocalServiceConfig(config: ClientServiceConfig): config is LocalServiceConfig;
export declare function isServiceConfig(config: ApolloConfig): config is ServiceConfig;
export declare function isServiceKey(key?: string): boolean | "" | undefined;
export declare function getServiceFromKey(key?: string): string | undefined;
export declare function getGraphIdFromConfig(config: ApolloConfigFormat): string | undefined;
export declare function parseServiceSpecifier(specifier: ServiceSpecifier): ServiceIDAndTag;
//# sourceMappingURL=utils.d.ts.map