'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const LiveServerHelper_1 = require("./LiveServerHelper");
const StatusbarUi_1 = require("./StatusbarUi");
const Config_1 = require("./Config");
const Helper_1 = require("./Helper");
const workspaceResolver_1 = require("./workspaceResolver");
const LiveShareHelper_1 = require("./LiveShareHelper");
const opn = require("opn");
const ips = require("ips");
class AppModel {
    constructor() {
        this.goLiveEvent = new vscode_1.EventEmitter();
        this.goOfflineEvent = new vscode_1.EventEmitter();
        const _ips = ips();
        this.localIps = _ips.local ? _ips.local : Config_1.Config.getHost;
        this.IsServerRunning = false;
        this.runningPort = null;
        this.liveShareHelper = new LiveShareHelper_1.LiveShareHelper(this);
        this.haveAnySupportedFile().then(() => {
            StatusbarUi_1.StatusbarUi.Init();
        });
    }
    get onDidGoLive() {
        return this.goLiveEvent.event;
    }
    get onDidGoOffline() {
        return this.goOfflineEvent.event;
    }
    Golive(pathUri) {
        return __awaiter(this, void 0, void 0, function* () {
            // if no folder is opened.
            if (!vscode_1.workspace.workspaceFolders) {
                return this.showPopUpMsg(`Open a folder or workspace... (File -> Open Folder)`, true);
            }
            if (!vscode_1.workspace.workspaceFolders.length) {
                return this.showPopUpMsg(`You've not added any folder in the workspace`, true);
            }
            const workspacePath = yield workspaceResolver_1.workspaceResolver(pathUri);
            if (!this.isCorrectWorkspace(workspacePath))
                return;
            const openedDocUri = pathUri || (vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.document.fileName : '');
            const pathInfos = Helper_1.Helper.testPathWithRoot(workspacePath);
            if (this.IsServerRunning) {
                const relativePath = Helper_1.Helper.getSubPath(pathInfos.rootPath, openedDocUri) || '';
                this.goLiveEvent.fire({ runningPort: this.runningPort, pathUri: relativePath });
                return this.openBrowser(this.runningPort, relativePath);
            }
            if (pathInfos.isNotOkay) {
                this.showPopUpMsg('Invaild Path in liveServer.settings.root settings. live Server will serve from workspace root', true);
            }
            if (this.IsStaging)
                return;
            let params = Helper_1.Helper.generateParams(pathInfos.rootPath, workspacePath, () => {
                this.tagMissedCallback();
            });
            LiveServerHelper_1.LiveServerHelper.StartServer(params, (serverInstance) => __awaiter(this, void 0, void 0, function* () {
                if (serverInstance && serverInstance.address) {
                    this.LiveServerInstance = serverInstance;
                    this.runningPort = serverInstance.address().port;
                    this.ToggleStatusBar();
                    this.showPopUpMsg(`Server is Started at port : ${this.runningPort}`);
                    if (!Config_1.Config.getNoBrowser) {
                        const relativePath = Helper_1.Helper.getSubPath(pathInfos.rootPath, openedDocUri) || '';
                        this.goLiveEvent.fire({ runningPort: this.runningPort, pathUri: relativePath });
                        this.openBrowser(this.runningPort, relativePath);
                    }
                }
                else {
                    if (!serverInstance.errorMsg) {
                        yield Config_1.Config.setPort(Config_1.Config.getPort + 1); // + 1 will be fine
                        this.showPopUpMsg(`The default port : ${Config_1.Config.getPort - 1} is currently taken, changing port to : ${Config_1.Config.getPort}.`);
                        this.Golive(pathUri);
                    }
                    else {
                        this.showPopUpMsg(`Something is went wrong! Please check into Developer Console or report on GitHub.`, true);
                    }
                    this.IsServerRunning = true; // to revert status - cheat :p
                    this.ToggleStatusBar(); // reverted
                }
            }));
            this.IsStaging = true;
            StatusbarUi_1.StatusbarUi.Working('Starting...');
        });
    }
    GoOffline() {
        if (this.IsStaging)
            return;
        if (!this.IsServerRunning) {
            this.showPopUpMsg(`Server is not already running`);
            return;
        }
        this.goOfflineEvent.fire({ runningPort: this.runningPort });
        LiveServerHelper_1.LiveServerHelper.StopServer(this.LiveServerInstance, () => {
            this.showPopUpMsg('Server is now offline.');
            this.ToggleStatusBar();
            this.LiveServerInstance = null;
            this.runningPort = null;
            this.previousWorkspacePath = null;
        });
        this.IsStaging = true;
        StatusbarUi_1.StatusbarUi.Working('Disposing...');
    }
    changeWorkspaceRoot() {
        workspaceResolver_1.setOrChangeWorkspace()
            .then(workspceName => {
            if (workspceName === undefined)
                return;
            vscode_1.window.showInformationMessage(`Success! '${workspceName}' workspace is now root of Live Server`);
            // If server is running, Turn off the server.
            if (this.IsServerRunning)
                this.GoOffline();
        });
    }
    isCorrectWorkspace(workspacePath) {
        if (this.IsServerRunning &&
            this.previousWorkspacePath &&
            this.previousWorkspacePath !== workspacePath) {
            this.showPopUpMsg(`Server is already running from different workspace.`, true);
            return false;
        }
        else
            this.previousWorkspacePath = workspacePath;
        return true;
    }
    tagMissedCallback() {
        this.showPopUpMsg('Live Reload is not possible without body or head tag.', null, true);
    }
    showPopUpMsg(msg, isErrorMsg = false, isWarning = false) {
        if (isErrorMsg) {
            vscode_1.window.showErrorMessage(msg);
        }
        else if (isWarning && !Config_1.Config.getDonotVerifyTags) {
            const donotShowMsg = 'I understand, Don\'t show again';
            vscode_1.window.showWarningMessage(msg, donotShowMsg)
                .then(choise => {
                if (choise && choise === donotShowMsg) {
                    Config_1.Config.setDonotVerifyTags(true, true);
                }
            });
        }
        else if (!Config_1.Config.getDonotShowInfoMsg) {
            const donotShowMsg = 'Don\'t show again';
            vscode_1.window.showInformationMessage(msg, donotShowMsg)
                .then(choice => {
                if (choice && choice === donotShowMsg) {
                    Config_1.Config.setDonotShowInfoMsg(true, true);
                }
            });
        }
    }
    ToggleStatusBar() {
        this.IsStaging = false;
        if (!this.IsServerRunning) {
            StatusbarUi_1.StatusbarUi.Offline(this.runningPort || Config_1.Config.getPort);
        }
        else {
            StatusbarUi_1.StatusbarUi.Live();
        }
        this.IsServerRunning = !this.IsServerRunning;
    }
    haveAnySupportedFile() {
        return new Promise(resolve => {
            const globFormat = `**/*[${Helper_1.SUPPRORTED_EXT.join(' | ')}]`;
            vscode_1.workspace.findFiles(globFormat, '**/node_modules/**', 1)
                .then((files) => __awaiter(this, void 0, void 0, function* () {
                if (files && files.length)
                    return resolve();
            }));
        });
    }
    openBrowser(port, path) {
        const host = Config_1.Config.getLocalIp ? this.localIps : Config_1.Config.getHost;
        const protocol = Config_1.Config.getHttps.enable ? 'https' : 'http';
        let params = [];
        let advanceCustomBrowserCmd = Config_1.Config.getAdvancedBrowserCmdline;
        if (path.startsWith('\\') || path.startsWith('/')) {
            path = path.substring(1, path.length);
        }
        path = path.replace(/\\/gi, '/');
        let useBrowserPreview = Config_1.Config.getUseBrowserPreview;
        if (useBrowserPreview) {
            let url = `${protocol}://${host}:${port}/${path}`;
            let onSuccess = () => { };
            let onError = (err) => {
                this.showPopUpMsg(`Server is started at ${this.runningPort} but failed to open in Browser Preview. Got Browser Preview extension installed?`, true);
                console.log('\n\nError Log to open Browser : ', err);
                console.log('\n\n');
            };
            vscode_1.commands.executeCommand(`browser-preview.openPreview`, url).then(onSuccess, onError);
            return;
        }
        if (advanceCustomBrowserCmd) {
            advanceCustomBrowserCmd
                .split('--')
                .forEach((command, index) => {
                if (command) {
                    if (index !== 0)
                        command = '--' + command;
                    params.push(command.trim());
                }
            });
        }
        else {
            let CustomBrowser = Config_1.Config.getCustomBrowser;
            let ChromeDebuggingAttachmentEnable = Config_1.Config.getChromeDebuggingAttachment;
            if (CustomBrowser && CustomBrowser !== 'null' /*For backward capability*/) {
                let browserDetails = CustomBrowser.split(':');
                let browserName = browserDetails[0];
                params.push(browserName);
                if (browserDetails[1] && browserDetails[1] === 'PrivateMode') {
                    if (browserName === 'chrome' || browserName === 'blisk')
                        params.push('--incognito');
                    else if (browserName === 'firefox')
                        params.push('--private-window');
                }
                if ((browserName === 'chrome' || browserName === 'blisk') && ChromeDebuggingAttachmentEnable) {
                    params.push(...[
                        '--new-window',
                        '--no-default-browser-check',
                        '--remote-debugging-port=9222',
                        '--user-data-dir=' + __dirname
                    ]);
                }
            }
        }
        if (params[0] && params[0] === 'chrome') {
            switch (process.platform) {
                case 'darwin':
                    params[0] = 'google chrome';
                    break;
                case 'linux':
                    params[0] = 'google-chrome';
                    break;
                case 'win32':
                    params[0] = 'chrome';
                    break;
                default:
                    params[0] = 'chrome';
            }
        }
        else if (params[0] && params[0].startsWith('microsoft-edge')) {
            params[0] = `microsoft-edge:${protocol}://${host}:${port}/${path}`;
        }
        try {
            opn(`${protocol}://${host}:${port}/${path}`, { app: params || [''] });
        }
        catch (error) {
            this.showPopUpMsg(`Server is started at ${this.runningPort} but failed to open browser. Try to change the CustomBrowser settings.`, true);
            console.log('\n\nError Log to open Browser : ', error);
            console.log('\n\n');
        }
    }
    dispose() {
        StatusbarUi_1.StatusbarUi.dispose();
    }
}
exports.AppModel = AppModel;
//# sourceMappingURL=appModel.js.map