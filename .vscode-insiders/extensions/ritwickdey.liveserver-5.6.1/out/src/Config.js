'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class Config {
    static get configuration() {
        return vscode_1.workspace.getConfiguration('liveServer.settings');
    }
    static getSettings(val) {
        return Config.configuration.get(val);
    }
    static setSettings(key, val, isGlobal = false) {
        return Config.configuration.update(key, val, isGlobal);
    }
    static get getHost() {
        return Config.getSettings('host');
    }
    static get getLocalIp() {
        return Config.getSettings('useLocalIp');
    }
    static get getPort() {
        return Config.getSettings('port');
    }
    static setPort(port) {
        return Config.setSettings('port', port);
    }
    static get getRoot() {
        return Config.getSettings('root');
    }
    static get getNoBrowser() {
        return Config.getSettings('NoBrowser');
    }
    static get getUseBrowserPreview() {
        return Config.getSettings('useBrowserPreview');
    }
    static get getAdvancedBrowserCmdline() {
        return Config.getSettings('AdvanceCustomBrowserCmdLine');
    }
    static get getChromeDebuggingAttachment() {
        return Config.getSettings('ChromeDebuggingAttachment');
    }
    static get getCustomBrowser() {
        return Config.getSettings('CustomBrowser');
    }
    static get getIgnoreFiles() {
        return Config.getSettings('ignoreFiles');
    }
    static get getDonotShowInfoMsg() {
        return Config.getSettings('donotShowInfoMsg');
    }
    static setDonotShowInfoMsg(val, isGlobal = false) {
        Config.configuration.update('donotShowInfoMsg', val, isGlobal);
    }
    static get getDonotVerifyTags() {
        return Config.getSettings('donotVerifyTags');
    }
    static setDonotVerifyTags(val, isGlobal = false) {
        Config.configuration.update('donotVerifyTags', val, isGlobal);
    }
    static get getUseWebExt() {
        return Config.getSettings('useWebExt') || false;
    }
    static get getProxy() {
        return Config.getSettings('proxy');
    }
    static get getHttps() {
        return Config.getSettings('https') || {};
    }
    static get getWait() {
        return Config.getSettings('wait');
    }
    static get getfullReload() {
        return Config.getSettings('fullReload');
    }
    static get getMount() {
        return Config.getSettings('mount');
    }
    static get getShowOnStatusbar() {
        return Config.getSettings('showOnStatusbar') || false;
    }
    static get getFile() {
        return Config.getSettings('file');
    }
    static get getMutiRootWorkspaceName() {
        return Config.getSettings('multiRootWorkspaceName');
    }
    static setMutiRootWorkspaceName(val) {
        return Config.configuration.update('multiRootWorkspaceName', val, false);
    }
}
exports.Config = Config;
//# sourceMappingURL=Config.js.map