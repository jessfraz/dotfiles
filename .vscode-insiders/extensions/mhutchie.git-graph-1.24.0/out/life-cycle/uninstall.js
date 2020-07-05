"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const state = yield utils_1.getLifeCycleStateInDirectory(utils_1.getDataDirectory());
            if (state !== null) {
                if (state.apiAvailable) {
                    state.queue.push({
                        stage: utils_1.LifeCycleStage.Uninstall,
                        extension: state.current.extension,
                        vscode: state.current.vscode,
                        nonce: utils_1.generateNonce()
                    });
                    yield utils_1.sendQueue(state.queue);
                }
            }
        }
        catch (_) { }
    });
})();
//# sourceMappingURL=uninstall.js.map