import { NoMissingClientDirectives } from "../validation";
import { GraphQLClientProject } from "../../project/client";
import { readFileSync } from "fs";
import { basename } from "path";

import { vol } from "memfs";
import { LoadingHandler } from "../../loadingHandler";
import { ApolloConfig, ClientConfig } from "../../config";
import URI from "vscode-uri";

const serviceSchema = /* GraphQL */ `
  type Query {
    me: User
  }

  type User {
    name: String
    friends: [User]
  }
`;
const clientSchema = /* GraphQL */ `
  extend type Query {
    isOnline: Boolean
  }
  extend type User {
    isLiked: Boolean
    localUser: User
  }
`;
const a = /* GraphQL */ `
  query a {
    isOnline
    me {
      name
      localUser @client {
        friends {
          isLiked
        }
      }
      friends {
        name
        isLiked
      }
    }
  }
`;

const b = /* GraphQL */ `
  query b {
    me {
      ... {
        isLiked
      }
      ... @client {
        localUser {
          name
        }
      }
    }
  }
`;

const c = /* GraphQL */ `
  query c {
    me {
      ...isLiked
    }
  }
  fragment localUser on User @client {
    localUser {
      name
    }
  }
  fragment isLiked on User {
    isLiked
    ...localUser
  }
`;

const d = /* GraphQL */ `
  fragment isLiked on User {
    isLiked
  }
  query d {
    me {
      ...isLiked
      ...locaUser
    }
  }
  fragment localUser on User @client {
    localUser {
      name
    }
  }
`;

const e = /* GraphQL */ `
  fragment friends on User {
    friends {
      ...isLiked
      ... on User @client {
        localUser {
          name
        }
      }
    }
  }
  query e {
    isOnline @client
    me {
      ...friends
    }
  }
  fragment isLiked on User {
    isLiked
  }
`;

// TODO support inline fragment spreads
const f = /* GraphQL */ `
  query f {
    me {
      ...isLiked @client
    }
  }
  fragment isLiked on User {
    isLiked
  }
`;

const rootURI = URI.file(process.cwd());

const config = new ApolloConfig({
  client: {
    service: {
      name: "server",
      localSchemaFile: "./schema.graphql"
    },
    includes: ["./src/**.graphql"],
    excludes: ["./__tests__"],
    validationRules: [NoMissingClientDirectives]
  },
  engine: {}
}) as ClientConfig;

class MockLoadingHandler implements LoadingHandler {
  handle<T>(_message: string, value: Promise<T>): Promise<T> {
    return value;
  }
  handleSync<T>(_message: string, value: () => T): T {
    return value();
  }
  showError(_message: string): void {}
}

jest.mock("fs");

describe("client state", () => {
  beforeEach(() => {
    vol.fromJSON({
      "apollo.config.js": `module.exports = {
            client: {
                service: {
                    localSchemaFile: './schema.graphql'
                }
            }
        }`,
      "schema.graphql": serviceSchema,
      "src/client-schema.graphql": clientSchema,
      "src/a.graphql": a,
      "src/b.graphql": b,
      "src/c.graphql": c,
      "src/d.graphql": d,
      "src/e.graphql": e
      // "src/f.graphql": f,
    });
  });
  afterEach(jest.restoreAllMocks);

  it("should report validation errors for missing @client directives", async () => {
    const project = new GraphQLClientProject({
      config,
      loadingHandler: new MockLoadingHandler(),
      rootURI
    });

    const errors = Object.create(null);
    project.onDiagnostics(({ diagnostics, uri }) => {
      const path = basename(URI.parse(uri).path);
      diagnostics.forEach(({ error }: any) => {
        if (!errors[path]) errors[path] = [];
        errors[path].push(error);
      });
    });

    await project.whenReady;
    await project.validate();

    expect(errors).toMatchInlineSnapshot(`
      Object {
        "a.graphql": Array [
          [GraphQLError: @client directive is missing on local field "isOnline"],
          [GraphQLError: @client directive is missing on local field "isLiked"],
        ],
        "b.graphql": Array [
          [GraphQLError: @client directive is missing on fragment around local fields "isLiked"],
        ],
        "c.graphql": Array [
          [GraphQLError: @client directive is missing on fragment "isLiked" around local fields "isLiked,localUser"],
        ],
        "d.graphql": Array [
          [GraphQLError: @client directive is missing on fragment "isLiked" around local fields "isLiked"],
        ],
        "e.graphql": Array [
          [GraphQLError: @client directive is missing on fragment "isLiked" around local fields "isLiked"],
        ],
      }
    `);
  });
});
