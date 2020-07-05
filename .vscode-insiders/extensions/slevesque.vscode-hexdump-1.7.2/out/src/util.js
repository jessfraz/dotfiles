"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const contentProvider_1 = require("./contentProvider");
function getPhysicalPath(uri) {
    if (uri.scheme === 'hexdump') {
        // remove the 'hexdump' extension
        let filepath = uri.with({ scheme: 'file' }).fsPath.slice(0, -8);
        return filepath;
    }
    return uri.fsPath;
}
exports.getPhysicalPath = getPhysicalPath;
function getFileSize(uri) {
    var filepath = getPhysicalPath(uri);
    var fstat = fs.statSync(filepath);
    return fstat ? fstat['size'] : -1;
}
exports.getFileSize = getFileSize;
function getOffset(pos) {
    var config = vscode.workspace.getConfiguration('hexdump');
    var firstLine = config['showOffset'] ? 1 : 0;
    var hexLineLength = config['width'] * 2;
    var firstByteOffset = config['showAddress'] ? 10 : 0;
    var lastByteOffset = firstByteOffset + hexLineLength + hexLineLength / config['nibbles'] - 1;
    var firstAsciiOffset = lastByteOffset + (config['nibbles'] == 2 ? 4 : 2);
    var lastAsciiOffset = firstAsciiOffset + config['width'];
    // check if within a valid section
    if (pos.line < firstLine || pos.character < firstByteOffset) {
        return;
    }
    var offset = (pos.line - firstLine) * config['width'];
    var s = pos.character - firstByteOffset;
    if (pos.character >= firstByteOffset && pos.character <= lastByteOffset) {
        // byte section
        if (config['nibbles'] == 8) {
            offset += Math.floor(s / 9) + Math.floor((s + 2) / 9) + Math.floor((s + 4) / 9) + Math.floor((s + 6) / 9);
        }
        else if (config['nibbles'] == 4) {
            offset += Math.floor(s / 5) + Math.floor((s + 2) / 5);
        }
        else {
            offset += Math.floor(s / 3);
        }
    }
    else if (pos.character >= firstAsciiOffset) {
        // ascii section
        offset += (pos.character - firstAsciiOffset);
    }
    return offset;
}
exports.getOffset = getOffset;
function getPosition(offset, ascii = false) {
    var config = vscode.workspace.getConfiguration('hexdump');
    var firstLine = config['showOffset'] ? 1 : 0;
    var hexLineLength = config['width'] * 2;
    var firstByteOffset = config['showAddress'] ? 10 : 0;
    var lastByteOffset = firstByteOffset + hexLineLength + hexLineLength / config['nibbles'] - 1;
    var firstAsciiOffset = lastByteOffset + (config['nibbles'] == 2 ? 4 : 2);
    var lastAsciiOffset = firstAsciiOffset + config['width'];
    let row = firstLine + Math.floor(offset / config['width']);
    let column = offset % config['width'];
    if (ascii) {
        column += firstAsciiOffset;
    }
    else {
        if (config['nibbles'] == 8) {
            column = firstByteOffset + column * 2 + Math.floor(column / 4);
        }
        else if (config['nibbles'] == 4) {
            column = firstByteOffset + column * 2 + Math.floor(column / 2);
        }
        else {
            column = firstByteOffset + column * 3;
        }
    }
    return new vscode.Position(row, column);
}
exports.getPosition = getPosition;
function getRanges(startOffset, endOffset, ascii) {
    var config = vscode.workspace.getConfiguration('hexdump');
    var hexLineLength = config['width'] * 2;
    var firstByteOffset = config['showAddress'] ? 10 : 0;
    var lastByteOffset = firstByteOffset + hexLineLength + hexLineLength / config['nibbles'] - 1;
    var firstAsciiOffset = lastByteOffset + (config['nibbles'] == 2 ? 4 : 2);
    var lastAsciiOffset = firstAsciiOffset + config['width'];
    var startPos = getPosition(startOffset, ascii);
    var endPos = getPosition(endOffset, ascii);
    endPos = new vscode.Position(endPos.line, endPos.character + (ascii ? 1 : 2));
    var ranges = [];
    var firstOffset = ascii ? firstAsciiOffset : firstByteOffset;
    var lastOffset = ascii ? lastAsciiOffset : lastByteOffset;
    for (var i = startPos.line; i <= endPos.line; ++i) {
        var start = new vscode.Position(i, (i == startPos.line ? startPos.character : firstOffset));
        var end = new vscode.Position(i, (i == endPos.line ? endPos.character : lastOffset));
        ranges.push(new vscode.Range(start, end));
    }
    return ranges;
}
exports.getRanges = getRanges;
let dict = {};
function getBuffer(uri) {
    return getEntry(uri).buffer;
}
exports.getBuffer = getBuffer;
function getEntry(uri) {
    // ignore text files with hexdump syntax
    if (uri.scheme !== 'hexdump') {
        return;
    }
    var filepath = getPhysicalPath(uri);
    if (dict[filepath]) {
        return dict[filepath];
    }
    let buf = fs.readFileSync(filepath);
    fs.watch(filepath, function (event, name) {
        dict[filepath] = { buffer: fs.readFileSync(filepath), isDirty: false };
        contentProvider_1.default.instance.update(uri);
    });
    dict[filepath] = { buffer: buf, isDirty: false };
    return dict[filepath];
}
exports.getEntry = getEntry;
function toArrayBuffer(buffer, offset, length) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[offset + i];
    }
    return ab;
}
exports.toArrayBuffer = toArrayBuffer;
function triggerUpdateDecorations(e) {
    setTimeout(updateDecorations, 500, e);
}
exports.triggerUpdateDecorations = triggerUpdateDecorations;
function getBufferSelection(document, selection) {
    let buf = getBuffer(document.uri);
    if (typeof buf == 'undefined') {
        return;
    }
    if (selection && !selection.isEmpty) {
        let start = getOffset(selection.start);
        let end = getOffset(selection.end) + 1;
        return buf.slice(start, end);
    }
    return buf;
}
exports.getBufferSelection = getBufferSelection;
// create a decorator type that we use to mark modified bytes
const modifiedDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255,0,0,1)'
});
function updateDecorations(e) {
    const uri = e.document.uri;
    const entry = getEntry(uri);
    if (entry && entry.decorations) {
        e.setDecorations(modifiedDecorationType, entry.decorations);
    }
}
//# sourceMappingURL=util.js.map