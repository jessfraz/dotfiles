"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
class AskpassManager {
    constructor() {
        this.enabled = true;
        this.ipcHandlePath = getIPCHandlePath(utils_1.getNonce());
        this.server = http.createServer((req, res) => this.onRequest(req, res));
        try {
            this.server.listen(this.ipcHandlePath);
            this.server.on('error', () => { });
        }
        catch (err) {
            this.enabled = false;
        }
        fs.chmod(path.join(__dirname, 'askpass.sh'), '755', () => { });
        fs.chmod(path.join(__dirname, 'askpass-empty.sh'), '755', () => { });
    }
    onRequest(req, res) {
        let reqData = '';
        req.setEncoding('utf8');
        req.on('data', (d) => reqData += d);
        req.on('end', () => {
            let data = JSON.parse(reqData);
            vscode.window.showInputBox({ placeHolder: data.request, prompt: 'Git Graph: ' + data.host, password: /password/i.test(data.request), ignoreFocusOut: true }).then(result => {
                res.writeHead(200);
                res.end(JSON.stringify(result || ''));
            }, () => {
                res.writeHead(500);
                res.end();
            });
        });
    }
    getEnv() {
        return this.enabled ?
            {
                ELECTRON_RUN_AS_NODE: '1',
                GIT_ASKPASS: path.join(__dirname, 'askpass.sh'),
                VSCODE_GIT_GRAPH_ASKPASS_NODE: process.execPath,
                VSCODE_GIT_GRAPH_ASKPASS_MAIN: path.join(__dirname, 'askpassMain.js'),
                VSCODE_GIT_GRAPH_ASKPASS_HANDLE: this.ipcHandlePath
            } : {
            GIT_ASKPASS: path.join(__dirname, 'askpass-empty.sh')
        };
    }
    dispose() {
        this.server.close();
        if (process.platform !== 'win32') {
            fs.unlinkSync(this.ipcHandlePath);
        }
    }
}
exports.AskpassManager = AskpassManager;
function getIPCHandlePath(nonce) {
    if (process.platform === 'win32') {
        return '\\\\.\\pipe\\git-graph-askpass-' + nonce + '-sock';
    }
    else if (process.env['XDG_RUNTIME_DIR']) {
        return path.join(process.env['XDG_RUNTIME_DIR'], 'git-graph-askpass-' + nonce + '.sock');
    }
    else {
        return path.join(os.tmpdir(), 'git-graph-askpass-' + nonce + '.sock');
    }
}
//# sourceMappingURL=askpassManager.js.map