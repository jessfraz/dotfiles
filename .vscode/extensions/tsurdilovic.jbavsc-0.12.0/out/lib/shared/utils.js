"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
function getMediaUri(context, mediaName) {
    var onDiskPath = vscode_1.Uri.file(path.join(context.extensionPath, "media", mediaName));
    return onDiskPath.with({ scheme: "vscode-resource" }).toString();
}
exports.getMediaUri = getMediaUri;
function getMedia(context) {
    return {
        extlogo: getMediaUri(context, "ext_logo.png"),
        extcss: getMediaUri(context, "ext_style.css"),
        extjs: getMediaUri(context, "ext_script.js"),
        extpreviewjs: getMediaUri(context, "ext_previewscript.js"),
        celleditorjs: getMediaUri(context, "SimpleTableCellEditor.js")
    };
}
exports.getMedia = getMedia;
//# sourceMappingURL=utils.js.map