"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const semmle_bqrs_1 = require("semmle-bqrs");
/**
 * Unescape "[", "]" and "\\" like in sarif plain text messages
 */
function unescapeSarifText(message) {
    return message.replace(/\\\[/g, "[").replace(/\\\]/g, "]").replace(/\\\\/, "\\");
}
exports.unescapeSarifText = unescapeSarifText;
function parseSarifPlainTextMessage(message) {
    const results = [];
    // We want something like "[linkText](4)", except that "[" and "]" may be escaped. The lookbehind asserts
    // that the initial [ is not escaped. Then we parse a link text with "[" and "]" escaped. Then we parse the numerical target.
    // Technically we could have any uri in the target but we don't output that yet.
    // The possibility of escaping outside the link is not mentioned in the sarif spec but we always output sartif this way.
    const linkRegex = /(?<=(?<!\\)(\\\\)*)\[(?<linkText>([^\\\]\[]|\\\\|\\\]|\\\[)*)\]\((?<linkTarget>[0-9]+)\)/g;
    let result;
    let curIndex = 0;
    while ((result = linkRegex.exec(message)) !== null) {
        results.push(unescapeSarifText(message.substring(curIndex, result.index)));
        const linkText = result.groups["linkText"];
        const linkTarget = +result.groups["linkTarget"];
        results.push({ dest: linkTarget, text: unescapeSarifText(linkText) });
        curIndex = result.index + result[0].length;
    }
    results.push(unescapeSarifText(message.substring(curIndex, message.length)));
    return results;
}
exports.parseSarifPlainTextMessage = parseSarifPlainTextMessage;
/**
 * Computes a path normalized to reflect conventional normalization
 * of windows paths into zip archive paths.
 * @param sourceLocationPrefix The source location prefix of a database. May be
 * unix style `/foo/bar/baz` or windows-style `C:\foo\bar\baz`.
 * @param sarifRelativeUri A uri relative to sourceLocationPrefix.
 * @returns A string that is valid for the `.file` field of a `FivePartLocation`:
 * directory separators are normalized, but drive letters `C:` may appear.
 */
function getPathRelativeToSourceLocationPrefix(sourceLocationPrefix, sarifRelativeUui) {
    const normalizedSourceLocationPrefix = sourceLocationPrefix.replace(/\\/g, '/');
    return path.join(normalizedSourceLocationPrefix, decodeURIComponent(sarifRelativeUui));
}
exports.getPathRelativeToSourceLocationPrefix = getPathRelativeToSourceLocationPrefix;
function parseSarifLocation(loc, sourceLocationPrefix) {
    const physicalLocation = loc.physicalLocation;
    if (physicalLocation === undefined)
        return { t: 'NoLocation', hint: 'no physical location' };
    if (physicalLocation.artifactLocation === undefined)
        return { t: 'NoLocation', hint: 'no artifact location' };
    if (physicalLocation.artifactLocation.uri === undefined)
        return { t: 'NoLocation', hint: 'artifact location has no uri' };
    // This is not necessarily really an absolute uri; it could either be a
    // file uri or a relative uri.
    const uri = physicalLocation.artifactLocation.uri;
    const fileUriRegex = /^file:/;
    const effectiveLocation = uri.match(fileUriRegex) ?
        decodeURIComponent(uri.replace(fileUriRegex, '')) :
        getPathRelativeToSourceLocationPrefix(sourceLocationPrefix, uri);
    const userVisibleFile = uri.match(fileUriRegex) ?
        decodeURIComponent(uri.replace(fileUriRegex, '')) :
        uri;
    if (physicalLocation.region === undefined) {
        // If the region property is absent, the physicalLocation object refers to the entire file.
        // Source: https://docs.oasis-open.org/sarif/sarif/v2.1.0/cs01/sarif-v2.1.0-cs01.html#_Toc16012638.
        // TODO: Do we get here if we provide a non-filesystem URL?
        return {
            t: semmle_bqrs_1.LocationStyle.WholeFile,
            file: effectiveLocation,
            userVisibleFile,
        };
    }
    else {
        const region = physicalLocation.region;
        // We assume that the SARIF we're given always has startLine
        // This is not mandated by the SARIF spec, but should be true of
        // SARIF output by our own tools.
        const lineStart = region.startLine;
        // These defaults are from SARIF 2.1.0 spec, section 3.30.2, "Text Regions"
        // https://docs.oasis-open.org/sarif/sarif/v2.1.0/cs01/sarif-v2.1.0-cs01.html#_Ref493492556
        const lineEnd = region.endLine === undefined ? lineStart : region.endLine;
        const colStart = region.startColumn === undefined ? 1 : region.startColumn;
        // We also assume that our tools will always supply `endColumn` field, which is
        // fortunate, since the SARIF spec says that it defaults to the end of the line, whose
        // length we don't know at this point in the code.
        //
        // It is off by one with respect to the way vscode counts columns in selections.
        const colEnd = region.endColumn - 1;
        return {
            t: semmle_bqrs_1.LocationStyle.FivePart,
            file: effectiveLocation,
            userVisibleFile,
            lineStart,
            colStart,
            lineEnd,
            colEnd,
        };
    }
}
exports.parseSarifLocation = parseSarifLocation;

//# sourceMappingURL=sarif-utils.js.map
