---
title: apollo-link-ws
description: Send GraphQL operations over a WebSocket. Works with GraphQL Subscriptions.
---

This link is particularly useful to use GraphQL Subscriptions, but it will also allow you to send GraphQL queries and mutations over WebSockets as well.

```js
import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

const GRAPHQL_ENDPOINT = "ws://localhost:3000/graphql";

const client = new SubscriptionClient(GRAPHQL_ENDPOINT, {
  reconnect: true
});

const link = new WebSocketLink(client);
```

## Options

WS Link takes either a subscription client or an object with three options on it to customize the behavior of the link. Takes the following possible keys in the configuration object:

* `uri`: a string endpoint to connect to
* `options`: a set of options to pass to a new Subscription Client
* `webSocketImpl`: a custom WebSocket implementation

By default, this link uses the [subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws) library for the transport.
