// EngineSchemaProvider (engine schema reg => schema)
import { NotificationHandler } from "vscode-languageserver";
import gql from "graphql-tag";
import { GraphQLSchema, buildClientSchema } from "graphql";
import { ApolloEngineClient, ClientIdentity } from "../../engine";
import { ClientConfig, keyEnvVar, parseServiceSpecifier } from "../../config";
import { getServiceFromKey, isServiceKey } from "../../config";
import {
  GraphQLSchemaProvider,
  SchemaChangeUnsubscribeHandler,
  SchemaResolveConfig
} from "./base";

import { GetSchemaByTag } from "../../graphqlTypes";
import { Debug } from "../../utilities";

export class EngineSchemaProvider implements GraphQLSchemaProvider {
  private schema?: GraphQLSchema;
  private client?: ApolloEngineClient;

  constructor(
    private config: ClientConfig,
    private clientIdentity?: ClientIdentity
  ) {}

  async resolveSchema(override: SchemaResolveConfig) {
    if (this.schema && (!override || !override.force)) return this.schema;
    const { engine, client } = this.config;

    if (!this.config.graph) {
      throw new Error(
        `No graph ID found for client. Please specify a graph ID via the config or the --graph flag`
      );
    }

    // create engine client
    if (!this.client) {
      if (!engine.apiKey) {
        throw new Error(
          `No API key found. Please set ${keyEnvVar} or use --key`
        );
      }
      this.client = new ApolloEngineClient(
        engine.apiKey,
        engine.endpoint,
        this.clientIdentity
      );
    }

    const { data, errors } = await this.client.execute<GetSchemaByTag>({
      query: SCHEMA_QUERY,
      variables: {
        id: this.config.graph,
        tag: override && override.tag ? override.tag : this.config.variant
      }
    });
    if (errors) {
      // XXX better error handling of GraphQL errors
      throw new Error(errors.map(({ message }: Error) => message).join("\n"));
    }

    if (!(data && data.service && data.service.__typename === "Service")) {
      throw new Error(
        `Unable to get schema from Apollo Graph Manager for graph ${this.config.graph}`
      );
    }

    // @ts-ignore
    // XXX Types of `data.service.schema` won't match closely enough with `IntrospectionQuery`
    this.schema = buildClientSchema(data.service.schema);
    return this.schema;
  }

  onSchemaChange(
    _handler: NotificationHandler<GraphQLSchema>
  ): SchemaChangeUnsubscribeHandler {
    throw new Error("Polling of Apollo Graph Manager not implemented yet");
    return () => {};
  }

  async resolveFederatedServiceSDL() {
    Debug.error(
      "Cannot resolve a federated service's SDL from Apollo Graph Manager. Use an endpoint or a file instead"
    );
    return;
  }
}

export const SCHEMA_QUERY = gql`
  query GetSchemaByTag($tag: String!, $id: ID!) {
    service(id: $id) {
      ... on Service {
        __typename
        schema(tag: $tag) {
          hash
          __schema: introspection {
            queryType {
              name
            }
            mutationType {
              name
            }
            subscriptionType {
              name
            }
            types(filter: { includeBuiltInTypes: true }) {
              ...IntrospectionFullType
            }
            directives {
              name
              description
              locations
              args {
                ...IntrospectionInputValue
              }
            }
          }
        }
      }
    }
  }

  fragment IntrospectionFullType on IntrospectionType {
    kind
    name
    description
    fields {
      name
      description
      args {
        ...IntrospectionInputValue
      }
      type {
        ...IntrospectionTypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...IntrospectionInputValue
    }
    interfaces {
      ...IntrospectionTypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...IntrospectionTypeRef
    }
  }

  fragment IntrospectionInputValue on IntrospectionInputValue {
    name
    description
    type {
      ...IntrospectionTypeRef
    }
    defaultValue
  }

  fragment IntrospectionTypeRef on IntrospectionType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;
