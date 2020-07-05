"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const scriptingRequest_1 = require("../models/contracts/scripting/scriptingRequest");
class ScriptingService {
    constructor(_connectionManager) {
        this._connectionManager = _connectionManager;
        // map for the version of SQL Server (default is 140)
        this.scriptCompatibilityOptionMap = {
            90: 'Script90Compat',
            100: 'Script100Compat',
            105: 'Script105Compat',
            110: 'Script110Compat',
            120: 'Script120Compat',
            130: 'Script130Compat',
            140: 'Script140Compat'
        };
        // map for the target database engine edition (default is Enterprise)
        this.targetDatabaseEngineEditionMap = {
            0: 'SqlServerEnterpriseEdition',
            1: 'SqlServerPersonalEdition',
            2: 'SqlServerStandardEdition',
            3: 'SqlServerEnterpriseEdition',
            4: 'SqlServerExpressEdition',
            5: 'SqlAzureDatabaseEdition',
            6: 'SqlDatawarehouseEdition',
            7: 'SqlServerStretchEdition'
        };
        this._client = this._connectionManager.client;
    }
    /**
     * Helper to get the object name and schema name
     * (Public for testing purposes)
     */
    getObjectFromNode(node) {
        let metadata = node.metadata;
        let scriptingObject = {
            type: metadata.metadataTypeName,
            schema: metadata.schema,
            name: metadata.name
        };
        return scriptingObject;
    }
    /**
     * Helper to create scripting params
     */
    createScriptingParams(node, uri, operation) {
        const scriptingObject = this.getObjectFromNode(node);
        let serverInfo = this._connectionManager.getServerInfo(node.connectionCredentials);
        let scriptCreateDropOption;
        switch (operation) {
            case (scriptingRequest_1.ScriptOperation.Select):
                scriptCreateDropOption = 'ScriptSelect';
                break;
            case (scriptingRequest_1.ScriptOperation.Delete):
                scriptCreateDropOption = 'ScriptDrop';
                break;
            case (scriptingRequest_1.ScriptOperation.Create):
                scriptCreateDropOption = 'ScriptCreate';
            default:
                scriptCreateDropOption = 'ScriptCreate';
        }
        let scriptOptions = {
            scriptCreateDrop: scriptCreateDropOption,
            typeOfDataToScript: 'SchemaOnly',
            scriptStatistics: 'ScriptStatsNone',
            targetDatabaseEngineEdition: serverInfo && serverInfo.engineEditionId ?
                this.targetDatabaseEngineEditionMap[serverInfo.engineEditionId] : 'SqlServerEnterpriseEdition',
            targetDatabaseEngineType: serverInfo && serverInfo.isCloud ? 'SqlAzure' : 'SingleInstance',
            scriptCompatibilityOption: serverInfo && serverInfo.serverMajorVersion ?
                this.scriptCompatibilityOptionMap[serverInfo.serverMajorVersion] : 'Script140Compat'
        };
        let scriptingParams = {
            filePath: undefined,
            scriptDestination: 'ToEditor',
            connectionString: undefined,
            scriptingObjects: [scriptingObject],
            includeObjectCriteria: undefined,
            excludeObjectCriteria: undefined,
            includeSchemas: undefined,
            excludeSchemas: undefined,
            includeTypes: undefined,
            excludeTypes: undefined,
            scriptOptions: scriptOptions,
            connectionDetails: undefined,
            ownerURI: uri,
            selectScript: undefined,
            operation: operation
        };
        return scriptingParams;
    }
    script(node, uri, operation) {
        return __awaiter(this, void 0, void 0, function* () {
            let scriptingParams = this.createScriptingParams(node, uri, operation);
            const result = yield this._client.sendRequest(scriptingRequest_1.ScriptingRequest.type, scriptingParams);
            return result.script;
        });
    }
}
exports.ScriptingService = ScriptingService;

//# sourceMappingURL=scriptingService.js.map
