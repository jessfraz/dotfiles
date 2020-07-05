"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
Object.defineProperty(exports, "__esModule", { value: true });
/* Declare all native C++ classes and methods in this file. */
const path = require("path");
module.exports = require("node-gyp-build")(path.join(__dirname, ".."));
const sack = {};
const target = module.exports.Socket.prototype;
for (const key of ["send", "receive", "join", "leave"]) {
    sack[key] = target[key];
    delete target[key];
}
module.exports.methods = sack;
