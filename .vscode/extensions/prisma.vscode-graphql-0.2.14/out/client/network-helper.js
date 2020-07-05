"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("apollo-client");
const graphql_tag_1 = require("graphql-tag");
const apollo_link_http_1 = require("apollo-link-http");
const apollo_link_ws_1 = require("apollo-link-ws");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const ws = require("ws");
const apollo_link_1 = require("apollo-link");
class NetworkHelper {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    executeOperation({ endpoint, literal, variables, updateCallback }) {
        const operation = literal.ast.definitions[0]
            .operation;
        this.outputChannel.appendLine(`NetworkHelper: operation: ${operation}`);
        this.outputChannel.appendLine(`NetworkHelper: endpoint: ${endpoint.url}`);
        const httpLink = apollo_link_http_1.createHttpLink({
            uri: endpoint.url,
            headers: endpoint.headers
        });
        const wsEndpointURL = endpoint.url.replace(/^http/, "ws");
        const wsLink = new apollo_link_ws_1.WebSocketLink({
            uri: wsEndpointURL,
            options: {
                reconnect: true,
                inactivityTimeout: 30000
            },
            webSocketImpl: ws
        });
        const apolloClient = new apollo_client_1.default({
            link: apollo_link_1.ApolloLink.split(() => {
                return operation === "subscription";
            }, wsLink, httpLink),
            cache: new apollo_cache_inmemory_1.InMemoryCache({
                addTypename: false
            })
        });
        const parsedOperation = graphql_tag_1.default `
      ${literal.content}
    `;
        if (operation === "subscription") {
            apolloClient
                .subscribe({
                query: parsedOperation,
                variables
            })
                .subscribe({
                next(data) {
                    updateCallback(formatData(data), operation);
                }
            });
        }
        else {
            if (operation === "query") {
                apolloClient
                    .query({
                    query: parsedOperation,
                    variables
                })
                    .then((data) => {
                    updateCallback(formatData(data), operation);
                })
                    .catch(err => {
                    updateCallback(err.toString(), operation);
                });
            }
            else {
                apolloClient
                    .mutate({
                    mutation: parsedOperation,
                    variables
                })
                    .then((data) => {
                    updateCallback(formatData(data), operation);
                });
            }
        }
    }
}
exports.NetworkHelper = NetworkHelper;
function formatData({ data, errors }) {
    return JSON.stringify({ data, errors }, null, 2);
}
//# sourceMappingURL=network-helper.js.map