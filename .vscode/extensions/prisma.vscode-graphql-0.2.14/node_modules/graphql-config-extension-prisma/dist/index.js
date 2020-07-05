"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_config_1 = require("graphql-config");
var prisma_yml_1 = require("prisma-yml");
var lodash_1 = require("lodash");
var os = require("os");
var path = require("path");
var fs = require("fs");
function patchConfig(config, cwd, envVars) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, patchEndpointsToConfig(config, cwd, envVars)];
                case 1:
                    config = _a.sent();
                    config = patchDirectivesToConfig(config, cwd, envVars);
                    return [2 /*return*/, config];
            }
        });
    });
}
exports.patchConfig = patchConfig;
function patchDirectivesToConfig(config, cwd, envVars) {
    config.config = patchDirectivesToConfigData(config.config, cwd, envVars);
    return config;
}
function patchDirectivesToConfigData(config, cwd, envVars) {
    // return early if no prisma extension found
    var allExtensions = [config.extensions].concat(lodash_1.values(config.projects).map(function (p) { return p.extensions; }));
    if (!allExtensions.some(function (e) { return e && e.prisma; })) {
        return config;
    }
    var newConfig = __assign({}, config);
    if (newConfig.extensions) {
        lodash_1.set(newConfig, ['extensions', 'customDirectives'], getCustomDirectives());
    }
    if (newConfig.projects) {
        Object.keys(newConfig.projects).map(function (projectName) {
            var project = newConfig.projects[projectName];
            if (project.extensions) {
                lodash_1.set(newConfig, ['projects', projectName, 'extensions', 'customDirectives'], getCustomDirectives());
            }
        });
    }
    return newConfig;
}
function getCustomDirectives(version) {
    return [
        'enum DeleteValues { CASCADE SET_NULL }',
        'directive @default(value: String!) on FIELD_DEFINITION | SCALAR',
        'directive @relation(name: String!, onDelete: DeleteValues) on FIELD_DEFINITION | SCALAR',
        'directive @unique on FIELD_DEFINITION | SCALAR',
        'directive @pgRelation(column: String!) on FIELD_DEFINITION | SCALAR',
        'directive @pgRelationTable(table: String!, relationColumn: String!, targetColumn: String!) on FIELD_DEFINITION | SCALAR',
        'directive @pgTable(name: String!) on FIELD_DEFINITION | SCALAR',
        'directive @pgColumn(name: String!) on FIELD_DEFINITION | SCALAR',
        'directive @pgDefault(value: String!) on FIELD_DEFINITION | SCALAR',
    ];
}
exports.getCustomDirectives = getCustomDirectives;
// TODO: Deprecate and remove this public API in favor
// of patchConfig function in playground and other usages
// of this project.
function patchEndpointsToConfig(config, cwd, envVars, graceful) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = config;
                    return [4 /*yield*/, patchEndpointsToConfigData(config.config, cwd, envVars, graceful)];
                case 1:
                    _a.config = _b.sent();
                    return [2 /*return*/, config];
            }
        });
    });
}
exports.patchEndpointsToConfig = patchEndpointsToConfig;
function patchEndpointsToConfigData(config, cwd, envVars, graceful) {
    return __awaiter(this, void 0, void 0, function () {
        var allExtensions, newConfig, home, env, _a, _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    allExtensions = [config.extensions].concat(lodash_1.values(config.projects).map(function (p) { return p.extensions; }));
                    if (!allExtensions.some(function (e) { return e && e.prisma; })) {
                        return [2 /*return*/, config];
                    }
                    newConfig = __assign({}, config);
                    home = os.homedir();
                    env = new prisma_yml_1.Environment(home);
                    return [4 /*yield*/, env.load()];
                case 1:
                    _c.sent();
                    if (!(newConfig.extensions && newConfig.extensions.prisma)) return [3 /*break*/, 3];
                    _a = lodash_1.set;
                    _b = [newConfig,
                        ['extensions', 'endpoints']];
                    return [4 /*yield*/, getEndpointsFromPath(env, newConfig.extensions.prisma, cwd, envVars, graceful)];
                case 2:
                    _a.apply(void 0, _b.concat([_c.sent()]));
                    _c.label = 3;
                case 3:
                    if (!newConfig.projects) return [3 /*break*/, 5];
                    return [4 /*yield*/, Promise.all(Object.keys(newConfig.projects).map(function (projectName) { return __awaiter(_this, void 0, void 0, function () {
                            var project, _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        project = newConfig.projects[projectName];
                                        if (!(project.extensions && project.extensions.prisma)) return [3 /*break*/, 2];
                                        _a = lodash_1.set;
                                        _b = [newConfig,
                                            ['projects', projectName, 'extensions', 'endpoints']];
                                        return [4 /*yield*/, getEndpointsFromPath(env, project.extensions.prisma, cwd, envVars, graceful)];
                                    case 1:
                                        _a.apply(void 0, _b.concat([_c.sent()]));
                                        _c.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [2 /*return*/, newConfig];
            }
        });
    });
}
exports.patchEndpointsToConfigData = patchEndpointsToConfigData;
function makeConfigFromPath(cwd, envVars) {
    if (cwd === void 0) { cwd = process.cwd(); }
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, ymlPath, home, env, definition, serviceName, stage, clusterName, cluster, url, token, headers, data;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ymlPath = path.join(cwd, 'prisma.yml');
                    if (!fs.existsSync(ymlPath)) {
                        return [2 /*return*/, null];
                    }
                    home = os.homedir();
                    env = new prisma_yml_1.Environment(home);
                    return [4 /*yield*/, env.load()];
                case 1:
                    _c.sent();
                    definition = new prisma_yml_1.PrismaDefinitionClass(env, ymlPath, envVars);
                    return [4 /*yield*/, definition.load({})];
                case 2:
                    _c.sent();
                    serviceName = definition.service;
                    stage = definition.stage;
                    clusterName = definition.cluster;
                    if (!clusterName) {
                        throw new Error("No cluster set. Please set the \"cluster\" property in your prisma.yml");
                    }
                    return [4 /*yield*/, definition.getCluster()];
                case 3:
                    cluster = _c.sent();
                    if (!cluster) {
                        throw new Error("Cluster " + clusterName + " provided in prisma.yml could not be found in global ~/.prisma/config.yml.\nPlease check in ~/.prisma/config.yml, if the cluster exists.\nYou can use `docker-compose up -d` to start a new cluster.");
                    }
                    url = cluster.getApiEndpoint(serviceName, stage, definition.getWorkspace() || undefined);
                    token = definition.getToken(serviceName, stage);
                    headers = token
                        ? {
                            Authorization: "Bearer " + token,
                        }
                        : undefined;
                    data = {
                        schemaPath: '',
                        projects: (_a = {},
                            _a[serviceName] = {
                                schemaPath: '',
                                extensions: {
                                    endpoints: (_b = {},
                                        _b[stage] = {
                                            url: url,
                                            headers: headers,
                                        },
                                        _b),
                                },
                            },
                            _a),
                    };
                    return [2 /*return*/, new graphql_config_1.GraphQLConfig(data, '')];
            }
        });
    });
}
exports.makeConfigFromPath = makeConfigFromPath;
function getEndpointsFromPath(env, ymlPath, cwd, envVars, graceful) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, joinedYmlPath, definition, serviceName, stage, clusterName, cluster, url, token, headers;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    joinedYmlPath = cwd ? path.join(cwd, ymlPath) : ymlPath;
                    definition = new prisma_yml_1.PrismaDefinitionClass(env, joinedYmlPath, envVars);
                    return [4 /*yield*/, definition.load({}, undefined, graceful)];
                case 1:
                    _b.sent();
                    serviceName = definition.service;
                    stage = definition.stage;
                    clusterName = definition.cluster;
                    if (!clusterName) {
                        throw new Error("No cluster set. Please set the \"cluster\" property in your prisma.yml");
                    }
                    return [4 /*yield*/, definition.getCluster()];
                case 2:
                    cluster = _b.sent();
                    if (!cluster) {
                        throw new Error("Cluster " + clusterName + " provided in prisma.yml could not be found in global ~/.prisma/config.yml.\nPlease check in ~/.prisma/config.yml, if the cluster exists.\nYou can use `docker-compose up -d` to start a new cluster.");
                    }
                    url = cluster.getApiEndpoint(serviceName, stage, definition.getWorkspace() || undefined);
                    token = definition.getToken(serviceName, stage);
                    headers = token
                        ? {
                            Authorization: "Bearer " + token,
                        }
                        : undefined;
                    return [2 /*return*/, (_a = {},
                            _a[stage] = {
                                url: url,
                                headers: headers,
                            },
                            _a)];
            }
        });
    });
}
//# sourceMappingURL=index.js.map