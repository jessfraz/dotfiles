'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const sysPath = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const gql_language_server_1 = require("@playlyfe/gql-language-server");
const ClientStatusBarItem_1 = require("./ClientStatusBarItem");
const utils_1 = require("./utils");
const EXT_NAME = 'graphqlForVSCode';
const GQL_LANGUAGE_SERVER_CLI_PATH = require.resolve('@playlyfe/gql-language-server/lib/bin/cli');
const clients = new Map();
function activate(context) {
    createClientForWorkspaces(context);
    // update clients when workspaceFolderChanges
    vscode_1.workspace.onDidChangeWorkspaceFolders(() => {
        createClientForWorkspaces(context);
    });
}
exports.activate = activate;
function deactivate() {
    const promises = [];
    clients.forEach(client => {
        if (client) {
            promises.push(client.dispose());
        }
    });
    return Promise.all(promises).then(() => undefined);
}
exports.deactivate = deactivate;
function createClientForWorkspaces(context) {
    const workspaceFolders = vscode_1.workspace.workspaceFolders || [];
    const workspaceFoldersIndex = {};
    workspaceFolders.forEach(folder => {
        const key = folder.uri.toString();
        if (!clients.has(key)) {
            const client = createClientForWorkspace(folder, context);
            // console.log('adding client', key, client);
            clients.set(key, client);
        }
        workspaceFoldersIndex[key] = true;
    });
    // remove clients for removed workspace folders
    clients.forEach((client, key) => {
        // remove client
        if (!workspaceFoldersIndex[key]) {
            // console.log('deleting client', key);
            clients.delete(key);
            if (client) {
                client.dispose();
            }
        }
    });
}
function createClientForWorkspace(folder, context) {
    // per workspacefolder settings
    const config = vscode_1.workspace.getConfiguration(EXT_NAME, folder.uri);
    const outputChannel = vscode_1.window.createOutputChannel(`GraphQL - ${folder.name}`);
    // TODO: make it configurable
    const gqlconfigDir = resolvePath('.', folder);
    const runtime = config.get('runtime', undefined);
    // check can activate gql plugin
    // if config found in folder then activate
    try {
        gql_language_server_1.findConfigFile(gqlconfigDir);
    }
    catch (err) {
        outputChannel.appendLine(`Not activating language-server for workspace folder '${folder.name}'.\n` +
            `Reason: ${err.message}`);
        return null;
    }
    const gqlLanguageServerCliOptions = [
        `--config-dir=${gqlconfigDir}`,
        `--gql-path=${resolvePath(config.get('nodePath', '.'), folder)}`,
        `--loglevel=${config.get('loglevel')}`,
        '--watchman=true',
        '--auto-download-gql=false',
    ];
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: {
            runtime,
            module: GQL_LANGUAGE_SERVER_CLI_PATH,
            transport: vscode_languageclient_1.TransportKind.ipc,
            args: gqlLanguageServerCliOptions,
        },
        debug: {
            runtime,
            module: GQL_LANGUAGE_SERVER_CLI_PATH,
            transport: vscode_languageclient_1.TransportKind.ipc,
            args: gqlLanguageServerCliOptions,
            options: {
                execArgv: ['--nolazy', '--inspect=6008'],
            },
        },
    };
    // TEMP_FIX: relativePattern is not working when extension is
    // running using vscode-remote with `local os = windows`
    // NOTE: relativePattern is used only for optimization so it will
    // not change the extension behaviour
    const canUseRelativePattern = utils_1.isExtensionRunningLocally(context);
    // Options to control the language client
    const clientOptions = {
        diagnosticCollectionName: 'graphql',
        initializationFailedHandler: error => {
            vscode_1.window.showErrorMessage(`Plugin 'graphql-for-vscode' couldn't start for workspace '${folder.name}'. See output channel '${folder.name}' for more details.`);
            client.error('Server initialization failed:', error.message);
            client.outputChannel.show(true);
            // avoid retries
            return false;
        },
        outputChannel,
        workspaceFolder: folder,
        initializationOptions: {
            relativePattern: canUseRelativePattern,
        },
    };
    // Create the language client and start the client.
    const client = new vscode_languageclient_1.LanguageClient(EXT_NAME, 'Graphql For VSCode', serverOptions, clientOptions);
    const statusBarItem = new ClientStatusBarItem_1.default(client, canUseRelativePattern);
    const subscriptions = [
        client.start(),
        {
            dispose() {
                outputChannel.hide();
                outputChannel.dispose();
            },
        },
        statusBarItem,
    ];
    return {
        dispose: () => {
            subscriptions.forEach(subscription => {
                subscription.dispose();
            });
        },
        statusBarItem,
        client,
    };
}
function resolvePath(path, folder) {
    if (sysPath.isAbsolute(path)) {
        return path;
    }
    // resolve with respect to workspace folder
    return sysPath.join(folder.uri.fsPath, path);
}
//# sourceMappingURL=extension.js.map