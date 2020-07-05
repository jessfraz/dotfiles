"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var cuid = require("scuid");
var path = require("path");
var fs = require("fs-extra");
exports.getTmpDir = function () {
    var dir = path.join(os.tmpdir(), cuid() + '/');
    fs.mkdirpSync(dir);
    return dir;
};
//# sourceMappingURL=getTmpDir.js.map