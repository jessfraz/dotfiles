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
const vscode = require("vscode");
const sprintf_js_1 = require("sprintf-js");
const util_1 = require("./util");
var hexdump = require('hexy');
class HexdumpContentProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        if (HexdumpContentProvider.s_instance) {
            HexdumpContentProvider.s_instance.dispose();
        }
        HexdumpContentProvider.s_instance = this;
    }
    static get instance() {
        return HexdumpContentProvider.s_instance;
    }
    dispose() {
        this._onDidChange.dispose();
        if (HexdumpContentProvider.s_instance) {
            HexdumpContentProvider.s_instance.dispose();
            HexdumpContentProvider.s_instance = null;
        }
    }
    provideTextDocumentContent(uri) {
        const config = vscode.workspace.getConfiguration('hexdump');
        const hexLineLength = config['width'] * 2;
        const firstByteOffset = config['showAddress'] ? 10 : 0;
        const lastByteOffset = firstByteOffset + hexLineLength + hexLineLength / config['nibbles'] - 1;
        const firstAsciiOffset = lastByteOffset + (config['nibbles'] == 2 ? 4 : 2);
        const lastAsciiOffset = firstAsciiOffset + config['width'];
        const charPerLine = lastAsciiOffset + 1;
        const sizeWarning = config['sizeWarning'];
        const sizeDisplay = config['sizeDisplay'];
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let hexyFmt = {
                format: config['nibbles'] == 8 ? 'eights' :
                    config['nibbles'] == 4 ? 'fours' :
                        'twos',
                width: config['width'],
                caps: config['uppercase'] ? 'upper' : 'lower',
                numbering: config['showAddress'] ? "hex_digits" : "none",
                annotate: config['showAscii'] ? "ascii" : "none",
                length: sizeDisplay
            };
            let header = config['showOffset'] ? this.getHeader() : "";
            let tail = '(Reached the maximum size to display. You can change "hexdump.sizeDisplay" in your settings.)';
            let proceed = util_1.getFileSize(uri) < sizeWarning ? 'Open' : yield vscode.window.showWarningMessage('File might be too big, are you sure you want to continue?', 'Open');
            if (proceed == 'Open') {
                let buf = util_1.getBuffer(uri);
                let hexString = header;
                hexString += hexdump.hexy(buf, hexyFmt).toString();
                if (buf.length > sizeDisplay) {
                    hexString += tail;
                }
                return resolve(hexString);
            }
            else {
                return resolve('(hexdump cancelled.)');
            }
        }));
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    getHeader() {
        const config = vscode.workspace.getConfiguration('hexdump');
        let header = config['showAddress'] ? "  Offset: " : "";
        for (var i = 0; i < config['width']; ++i) {
            header += sprintf_js_1.sprintf('%02X', i);
            if ((i + 1) % (config['nibbles'] / 2) == 0) {
                header += ' ';
            }
        }
        header += "\t\n";
        return header;
    }
}
HexdumpContentProvider.s_instance = null;
exports.default = HexdumpContentProvider;
//# sourceMappingURL=contentProvider.js.map