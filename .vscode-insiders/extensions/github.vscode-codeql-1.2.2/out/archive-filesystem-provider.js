"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const unzipper = require("unzipper");
const vscode = require("vscode");
const logging_1 = require("./logging");
// All path operations in this file must be on paths *within* the zip
// archive.
const _path = require("path");
const path = _path.posix;
class File {
    constructor(name, data) {
        this.name = name;
        this.data = data;
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = data.length;
        this.name = name;
    }
}
exports.File = File;
class Directory {
    constructor(name) {
        this.name = name;
        this.entries = new Map();
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
    }
}
exports.Directory = Directory;
/** Encodes a reference to a source file within a zipped source archive into a single URI. */
function encodeSourceArchiveUri(ref) {
    const { sourceArchiveZipPath, pathWithinSourceArchive } = ref;
    // These two paths are put into a single URI with a custom scheme.
    // The path and authority components of the URI encode the two paths.
    // The path component of the URI contains both paths, joined by a slash.
    let encodedPath = path.join(sourceArchiveZipPath, pathWithinSourceArchive);
    // If a URI contains an authority component, then the path component
    // must either be empty or begin with a slash ("/") character.
    // (Source: https://tools.ietf.org/html/rfc3986#section-3.3)
    // Since we will use an authority component, we add a leading slash if necessary
    // (paths on Windows usually start with the drive letter).
    let sourceArchiveZipPathStartIndex;
    if (encodedPath.startsWith('/')) {
        sourceArchiveZipPathStartIndex = 0;
    }
    else {
        encodedPath = '/' + encodedPath;
        sourceArchiveZipPathStartIndex = 1;
    }
    // The authority component of the URI records the 0-based inclusive start and exclusive end index
    // of the source archive zip path within the path component of the resulting URI.
    // This lets us separate the paths, ignoring the leading slash if we added one.
    const sourceArchiveZipPathEndIndex = sourceArchiveZipPathStartIndex + sourceArchiveZipPath.length;
    const authority = `${sourceArchiveZipPathStartIndex}-${sourceArchiveZipPathEndIndex}`;
    return vscode.Uri.parse(exports.zipArchiveScheme + ':/').with({
        path: encodedPath,
        authority,
    });
}
exports.encodeSourceArchiveUri = encodeSourceArchiveUri;
const sourceArchiveUriAuthorityPattern = /^(\d+)-(\d+)$/;
class InvalidSourceArchiveUriError extends Error {
    constructor(uri) {
        super(`Can't decode uri ${uri}: authority should be of the form startIndex-endIndex (where both indices are integers).`);
    }
}
/** Decodes an encoded source archive URI into its corresponding paths. Inverse of `encodeSourceArchiveUri`. */
function decodeSourceArchiveUri(uri) {
    const match = sourceArchiveUriAuthorityPattern.exec(uri.authority);
    if (match === null)
        throw new InvalidSourceArchiveUriError(uri);
    const zipPathStartIndex = parseInt(match[1]);
    const zipPathEndIndex = parseInt(match[2]);
    if (isNaN(zipPathStartIndex) || isNaN(zipPathEndIndex))
        throw new InvalidSourceArchiveUriError(uri);
    return {
        pathWithinSourceArchive: uri.path.substring(zipPathEndIndex),
        sourceArchiveZipPath: uri.path.substring(zipPathStartIndex, zipPathEndIndex),
    };
}
exports.decodeSourceArchiveUri = decodeSourceArchiveUri;
/**
 * Make sure `file` and all of its parent directories are represented in `map`.
 */
function ensureFile(map, file) {
    const dirname = path.dirname(file);
    if (dirname === '.') {
        const error = `Ill-formed path ${file} in zip archive (expected absolute path)`;
        logging_1.logger.log(error);
        throw new Error(error);
    }
    ensureDir(map, dirname);
    map.get(dirname).set(path.basename(file), vscode.FileType.File);
}
/**
 * Make sure `dir` and all of its parent directories are represented in `map`.
 */
function ensureDir(map, dir) {
    const parent = path.dirname(dir);
    if (!map.has(dir)) {
        map.set(dir, new Map);
        if (dir !== parent) { // not the root directory
            ensureDir(map, parent);
            map.get(parent).set(path.basename(dir), vscode.FileType.Directory);
        }
    }
}
class ArchiveFileSystemProvider {
    constructor() {
        this.readOnlyError = vscode.FileSystemError.NoPermissions('write operation attempted, but source archive filesystem is readonly');
        this.archives = new Map;
        this.root = new Directory('');
        // file events
        this._emitter = new vscode.EventEmitter();
        this.onDidChangeFile = this._emitter.event;
    }
    async getArchive(zipPath) {
        if (!this.archives.has(zipPath)) {
            if (!await fs.pathExists(zipPath))
                throw vscode.FileSystemError.FileNotFound(zipPath);
            const archive = { unzipped: await unzipper.Open.file(zipPath), dirMap: new Map };
            archive.unzipped.files.forEach(f => { ensureFile(archive.dirMap, path.resolve('/', f.path)); });
            this.archives.set(zipPath, archive);
        }
        return this.archives.get(zipPath);
    }
    // metadata
    async stat(uri) {
        return await this._lookup(uri);
    }
    async readDirectory(uri) {
        const ref = decodeSourceArchiveUri(uri);
        const archive = await this.getArchive(ref.sourceArchiveZipPath);
        const contents = archive.dirMap.get(ref.pathWithinSourceArchive);
        const result = contents === undefined ? undefined : Array.from(contents.entries());
        if (result === undefined) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return result;
    }
    // file contents
    async readFile(uri) {
        const data = (await this._lookupAsFile(uri)).data;
        if (data) {
            return data;
        }
        throw vscode.FileSystemError.FileNotFound();
    }
    // write operations, all disabled
    writeFile(_uri, _content, _options) {
        throw this.readOnlyError;
    }
    rename(_oldUri, _newUri, _options) {
        throw this.readOnlyError;
    }
    delete(_uri) {
        throw this.readOnlyError;
    }
    createDirectory(_uri) {
        throw this.readOnlyError;
    }
    // content lookup
    async _lookup(uri) {
        const ref = decodeSourceArchiveUri(uri);
        const archive = await this.getArchive(ref.sourceArchiveZipPath);
        // this is a path inside the archive, so don't use `.fsPath`, and
        // use '/' as path separator throughout
        const reqPath = ref.pathWithinSourceArchive;
        const file = archive.unzipped.files.find(f => {
            const absolutePath = path.resolve('/', f.path);
            return absolutePath === reqPath
                || absolutePath === path.join('/src_archive', reqPath);
        });
        if (file !== undefined) {
            if (file.type === 'File') {
                return new File(reqPath, await file.buffer());
            }
            else { // file.type === 'Directory'
                // I haven't observed this case in practice. Could it happen
                // with a zip file that contains empty directories?
                return new Directory(reqPath);
            }
        }
        if (archive.dirMap.has(reqPath)) {
            return new Directory(reqPath);
        }
        throw vscode.FileSystemError.FileNotFound(`uri '${uri.toString()}', interpreted as '${reqPath}' in archive '${ref.sourceArchiveZipPath}'`);
    }
    async _lookupAsFile(uri) {
        const entry = await this._lookup(uri);
        if (entry instanceof File) {
            return entry;
        }
        throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    watch(_resource) {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }
}
exports.ArchiveFileSystemProvider = ArchiveFileSystemProvider;
/**
 * Custom uri scheme for referring to files inside zip archives stored
 * in the filesystem. See `encodeSourceArchiveUri`/`decodeSourceArchiveUri` for
 * how these uris are constructed.
 *
 * (cf. https://www.ietf.org/rfc/rfc2396.txt (Appendix A, page 26) for
 * the fact that hyphens are allowed in uri schemes)
 */
exports.zipArchiveScheme = 'codeql-zip-archive';
function activate(ctx) {
    ctx.subscriptions.push(vscode.workspace.registerFileSystemProvider(exports.zipArchiveScheme, new ArchiveFileSystemProvider(), {
        isCaseSensitive: true,
        isReadonly: true,
    }));
}
exports.activate = activate;

//# sourceMappingURL=archive-filesystem-provider.js.map
