# GQL Language Server

This is an implementation of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol/) for the [@playlyfe/gql](https://github.com/Mayank1791989/gql).

## Options
```
Usage: gql-language-server [args]

Options:
  --version            Show version number                             [boolean]

  -h, --help           Show help                                       [boolean]

  --node-ipc           Use node-ipc to communicate with the server. Useful for
                       calling from a node.js client.
                                                                        [string]

  --stdio              Use stdio to communicate with the server
                                                                        [string]

  --socket             Use a socket (with a port number like --socket=5051) to
                       communicate with the server.
                                                                        [number]
  --gql-path           An absolute path to a gql. [default: process.cwd()]
                                                                        [string]

  --config-dir         An absolute path to config dir. [default: process.cwd()]
                       Walks up the directory tree from the provided config
                       directory, until a .gqlconfig file is found or the root
                       directory is reached.
                                                                        [string]
  --auto-download-gql  Automatically download gql package if not found.
                                                       [boolean] [default: true]

  --watchman           use watchman to watch files (if available).
                                                       [boolean] [default: true]

  --loglevel           log level.
                    [choices: "debug", "info", "error", "off"] [default: "info"]

```

## Editor Integrations
### [GraphQL for Visual Studio Code (graphql-for-vscode)](https://github.com/kumarharsh/graphql-for-vscode)
Plugin for vscode using ```gql-language-server```.
