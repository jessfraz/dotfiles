"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugExports = exports.createWorkspaceNamesResolver = exports.resolveSettings = void 0;
const cspellConfig_1 = require("./cspellConfig");
const vscode_uri_1 = require("vscode-uri");
const log_1 = require("./log");
const util_1 = require("./util");
const os = require("os");
function resolveSettings(settings, resolver) {
    // Sections
    // - imports
    // - dictionary definitions (also nested in language settings)
    // - globs (ignorePaths and Override filenames)
    // - override dictionaries
    // - custom dictionaries
    // There is a more elegant way of doing this, but for now just change each section.
    const newSettings = resolveCoreSettings(settings, resolver);
    newSettings.import = resolveImportsToWorkspace(newSettings.import, resolver);
    newSettings.overrides = resolveOverrides(newSettings.overrides, resolver);
    function setOptions(defs) {
        const values = defs.filter(d => !!d).map(d => d).map(def => (Object.assign({ type: cspellConfig_1.defaultDictionaryType }, def)));
        const byName = new Map(values.map(d => [d.name, d]));
        return [...byName.values()];
    }
    function mapCustomDictionaries(dicts = []) {
        return mapCustomDictionaryEntries(dicts)
            .map(({ name, path }) => path ? { name, path } : undefined)
            .filter(util_1.isDefined);
    }
    // Merge custom dictionaries
    const dictionaryDefinitions = setOptions([].concat(mapCustomDictionaries(newSettings.customUserDictionaries), newSettings.dictionaryDefinitions || [], mapCustomDictionaries(newSettings.customWorkspaceDictionaries), mapCustomDictionaries(newSettings.customFolderDictionaries)));
    newSettings.dictionaryDefinitions = dictionaryDefinitions.length ? dictionaryDefinitions : undefined;
    // By default all custom dictionaries are enabled
    const names = (a) => a ? a.map(d => typeof d === 'string' ? d : d.name) : [];
    const dictionaries = [].concat(names(newSettings.customUserDictionaries), names(newSettings.customWorkspaceDictionaries), names(newSettings.customFolderDictionaries), newSettings.dictionaries || []);
    newSettings.dictionaries = dictionaries.length ? dictionaries : undefined;
    return shallowCleanObject(newSettings);
}
exports.resolveSettings = resolveSettings;
function createWorkspaceNamesResolver(folder, folders, root) {
    return {
        resolveFile: createWorkspaceNamesFilePathResolver(folder, folders, root),
        resolveGlob: createWorkspaceNamesGlobPathResolver(folder, folders),
    };
}
exports.createWorkspaceNamesResolver = createWorkspaceNamesResolver;
function createWorkspaceNamesFilePathResolver(folder, folders, root) {
    function toFolderPath(w) {
        return {
            name: w.name,
            path: vscode_uri_1.URI.parse(w.uri).fsPath
        };
    }
    return createWorkspaceNameToPathResolver(toFolderPath(folder), folders.map(toFolderPath), root);
}
function createWorkspaceNamesGlobPathResolver(folder, folders) {
    function toFolderPath(w) {
        return {
            name: w.name,
            path: vscode_uri_1.URI.parse(w.uri).path
        };
    }
    const rootFolder = toFolderPath(folder);
    const rootPath = rootFolder.path;
    function normalizeToRoot(p) {
        if (p.path.slice(0, rootPath.length) === rootPath) {
            p.path = p.path.slice(rootPath.length);
        }
        return p;
    }
    return createWorkspaceNameToGlobResolver(normalizeToRoot(rootFolder), folders.map(toFolderPath).map(normalizeToRoot));
}
function createWorkspaceNameToGlobResolver(folder, folders) {
    const folderPairs = [['${workspaceFolder}', folder.path]]
        .concat(folders.map(folder => [`\${workspaceFolder:${folder.name}}`, folder.path]));
    const map = new Map(folderPairs);
    const regEx = /\$\{workspaceFolder(?:[^}]*)\}/gi;
    function replacer(match) {
        const r = map.get(match);
        if (r !== undefined)
            return r;
        log_1.logError(`Failed to resolve ${match}`);
        return match;
    }
    return (path) => {
        return path.replace(regEx, replacer);
    };
}
/**
 *
 * @param currentFolder
 * @param folders
 * @param root
 */
function createWorkspaceNameToPathResolver(currentFolder, folders, root) {
    var _a, _b, _c;
    const folderPairs = []
        .concat([
        ['.', currentFolder.path],
        ['~', os.homedir()],
        ['${workspaceFolder}', ((_a = folders[0]) === null || _a === void 0 ? void 0 : _a.path) || root || currentFolder.path],
        ['${root}', root || ((_b = folders[0]) === null || _b === void 0 ? void 0 : _b.path) || currentFolder.path],
        ['${workspaceRoot}', root || ((_c = folders[0]) === null || _c === void 0 ? void 0 : _c.path) || currentFolder.path],
    ])
        .concat(folders.map(folder => [`\${workspaceFolder:${folder.name}}`, folder.path]));
    const map = new Map(folderPairs);
    const regEx = /^(?:\.|~|\$\{(?:workspaceFolder|workspaceRoot|root)(?:[^}]*)\})/i;
    function replacer(match) {
        const r = map.get(match);
        if (r)
            return r;
        log_1.logError(`Failed to resolve ${match}`);
        return match;
    }
    return (path) => {
        return path.replace(regEx, replacer);
    };
}
function resolveCoreSettings(settings, resolver) {
    // Sections
    // - imports
    // - dictionary definitions (also nested in language settings)
    // - globs (ignorePaths and Override filenames)
    // - override dictionaries
    const newSettings = resolveCustomAndBaseSettings(settings, resolver);
    // There is a more elegant way of doing this, but for now just change each section.
    newSettings.dictionaryDefinitions = resolveDictionaryPathReferences(newSettings.dictionaryDefinitions, resolver);
    newSettings.languageSettings = resolveLanguageSettings(newSettings.languageSettings, resolver);
    newSettings.ignorePaths = resolveGlobArray(newSettings.ignorePaths, resolver.resolveGlob);
    newSettings.workspaceRootPath = newSettings.workspaceRootPath ? resolver.resolveFile(newSettings.workspaceRootPath) : undefined;
    return shallowCleanObject(newSettings);
}
function resolveBaseSettings(settings, resolver) {
    const newSettings = Object.assign({}, settings);
    newSettings.dictionaryDefinitions = resolveDictionaryPathReferences(newSettings.dictionaryDefinitions, resolver);
    return shallowCleanObject(newSettings);
}
function resolveCustomAndBaseSettings(settings, resolver) {
    const newSettings = resolveBaseSettings(settings, resolver);
    const resolveCustomDicts = (d) => d ? resolveDictionaryPathReferences(mapCustomDictionaryEntries(d), resolver) : undefined;
    newSettings.customUserDictionaries = resolveCustomDicts(newSettings.customUserDictionaries);
    newSettings.customWorkspaceDictionaries = resolveCustomDicts(newSettings.customWorkspaceDictionaries);
    newSettings.customFolderDictionaries = resolveCustomDicts(newSettings.customFolderDictionaries);
    return newSettings;
}
function resolveImportsToWorkspace(imports, resolver) {
    if (!imports)
        return imports;
    const toImport = typeof imports === 'string' ? [imports] : imports;
    return toImport.map(resolver.resolveFile);
}
function resolveGlobArray(globs, resolver) {
    if (!globs)
        return globs;
    return globs.map(resolver);
}
function resolveDictionaryPathReferences(dictDefs, resolver) {
    if (!dictDefs)
        return dictDefs;
    return dictDefs
        .map(def => def.path ? Object.assign(Object.assign({}, def), { path: resolver.resolveFile(def.path) }) : def);
}
function resolveLanguageSettings(langSettings, resolver) {
    if (!langSettings)
        return langSettings;
    return langSettings.map(langSetting => {
        return shallowCleanObject(Object.assign({}, resolveBaseSettings(langSetting, resolver)));
    });
}
function resolveOverrides(overrides, resolver) {
    if (!overrides)
        return overrides;
    function resolve(path) {
        if (!path)
            return path;
        return typeof path === 'string' ? resolver.resolveFile(path) : path.map(resolver.resolveFile);
    }
    return overrides.map(src => {
        const dest = Object.assign({}, resolveCoreSettings(src, resolver));
        dest.filename = resolve(dest.filename);
        return shallowCleanObject(dest);
    });
}
function shallowCleanObject(obj) {
    if (typeof obj !== 'object')
        return obj;
    const objMap = obj;
    for (const key of Object.keys(objMap)) {
        if (objMap[key] === undefined) {
            delete objMap[key];
        }
    }
    return obj;
}
function mapCustomDictionaryEntry(d) {
    if (typeof d == 'string') {
        return { name: d, addWords: true };
    }
    return d;
}
function mapCustomDictionaryEntries(entries) {
    return entries.map(mapCustomDictionaryEntry);
}
exports.debugExports = {
    shallowCleanObject
};
//# sourceMappingURL=WorkspacePathResolver.js.map