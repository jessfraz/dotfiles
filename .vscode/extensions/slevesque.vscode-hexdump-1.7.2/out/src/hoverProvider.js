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
var iconvLite = require('iconv-lite');
const util_1 = require("./util");
class HexdumpHoverProvider {
    dispose() {
    }
    provideHover(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const charEncoding = vscode.workspace.getConfiguration('hexdump').get('charEncoding');
                const littleEndian = vscode.workspace.getConfiguration('hexdump').get('littleEndian');
                const showInspector = vscode.workspace.getConfiguration('hexdump').get('showInspector');
                if (!showInspector) {
                    return resolve();
                }
                let offset = util_1.getOffset(position);
                if (typeof offset == 'undefined') {
                    return resolve();
                }
                var content = 'Hex Inspector';
                content += littleEndian ? ' Little Endian\n' : ' Big Endian\n';
                content += 'Address: 0x' + sprintf_js_1.sprintf('%08X', offset) + '\n';
                let sel = vscode.window.activeTextEditor.selection;
                if (sel.contains(position)) {
                    let start = util_1.getOffset(sel.start);
                    let end = util_1.getOffset(sel.end);
                    content += 'Selection: 0x' + sprintf_js_1.sprintf('%08X', start);
                    content += ' - 0x' + sprintf_js_1.sprintf('%08X', end) + ' \n';
                }
                let buf = util_1.getBuffer(document.uri);
                if (typeof buf == 'undefined') {
                    return resolve();
                }
                let arrbuf = util_1.toArrayBuffer(buf, offset, 8);
                var view = new DataView(arrbuf);
                content += 'Int8:   ' + sprintf_js_1.sprintf('%12d', view.getInt8(0)) + '\t';
                content += 'Uint8:  ' + sprintf_js_1.sprintf('%12d', view.getUint8(0)) + ' \n';
                content += 'Int16:  ' + sprintf_js_1.sprintf('%12d', view.getInt16(0, littleEndian)) + '\t';
                content += 'Uint16: ' + sprintf_js_1.sprintf('%12d', view.getUint16(0, littleEndian)) + ' \n';
                content += 'Int32:  ' + sprintf_js_1.sprintf('%12d', view.getInt32(0, littleEndian)) + '\t';
                content += 'Uint32: ' + sprintf_js_1.sprintf('%12d', view.getUint32(0, littleEndian)) + ' \n';
                content += 'Float32: ' + sprintf_js_1.sprintf('%f', view.getFloat32(0, littleEndian)) + ' \n';
                content += 'Float64: ' + sprintf_js_1.sprintf('%f', view.getFloat64(0, littleEndian)) + ' \n';
                content += '\n';
                if (sel.contains(position)) {
                    let start = util_1.getOffset(sel.start);
                    let end = util_1.getOffset(sel.end) + 1;
                    content += 'String (' + charEncoding + '):\n';
                    let conv = iconvLite.decode(buf.slice(start, end), charEncoding);
                    content += conv.toString();
                }
                return resolve(new vscode.Hover({ language: 'hexdump', value: content }));
            });
        });
    }
}
exports.default = HexdumpHoverProvider;
//# sourceMappingURL=hoverProvider.js.map