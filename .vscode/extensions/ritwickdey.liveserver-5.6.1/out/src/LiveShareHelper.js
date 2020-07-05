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
const vsls = require("vsls/vscode");
/**
 * Manages state of a live server shared via VS Live Share.
 * Caches the live server path and starts/stops sharing in response to Live Share session events.
 */
class LiveShareHelper {
    constructor(appModel) {
        this.appModel = appModel;
        this.appModel.onDidGoLive((e) => __awaiter(this, void 0, void 0, function* () {
            // cache the current live server browse url
            this.livePathUri = e.pathUri;
            yield this.shareLiveServer();
        }));
        this.appModel.onDidGoOffline((e) => {
            // reset the live server cached path
            this.livePathUri = null;
            if (this.activeHostSession && this.sharedServer) {
                // will un-share the server
                this.sharedServer.dispose();
                this.sharedServer = null;
            }
        });
        this.deferredWork = vsls.getApi().then(api => {
            if (api) { // if Live Share is available (installed)
                this.ensureInitialized(api);
            }
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.deferredWork;
        });
    }
    ensureInitialized(api) {
        this.liveshare = api;
        if (this.liveshare.session && this.liveshare.session.role === vsls.Role.Host) {
            this.activeHostSession = this.liveshare.session;
        }
        this.liveshare.onDidChangeSession((e) => __awaiter(this, void 0, void 0, function* () {
            if (e.session.role === vsls.Role.Host) {
                // active sharing collaboration session
                this.activeHostSession = e.session;
                yield this.shareLiveServer();
            }
            else {
                // any other session state, including joined as a guest
                this.activeHostSession = null;
            }
        }));
    }
    shareLiveServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.activeHostSession && this.livePathUri) {
                // only share the server when we're live and VS Live Share session is active
                this.sharedServer = yield this.liveshare.shareServer({
                    port: this.appModel.runningPort,
                    displayName: 'Live Server',
                    browseUrl: `http://localhost:${this.appModel.runningPort}/${this.livePathUri.replace(/\\/gi, '/')}`
                });
            }
        });
    }
}
exports.LiveShareHelper = LiveShareHelper;
//# sourceMappingURL=LiveShareHelper.js.map