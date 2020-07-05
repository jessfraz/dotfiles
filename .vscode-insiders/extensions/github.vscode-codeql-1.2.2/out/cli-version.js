"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const cli_1 = require("./cli");
/**
 * Get the version of a CodeQL CLI.
 */
async function getCodeQlCliVersion(codeQlPath, logger) {
    const output = await cli_1.runCodeQlCliCommand(codeQlPath, ["version"], ["--format=terse"], "Checking CodeQL version", logger);
    return semver.parse(output.trim()) || undefined;
}
exports.getCodeQlCliVersion = getCodeQlCliVersion;

//# sourceMappingURL=cli-version.js.map
