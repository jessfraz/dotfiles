"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("babel-polyfill");
const graphql_language_service_server_1 = require("graphql-language-service-server");
const graphql_config_extension_prisma_1 = require("graphql-config-extension-prisma");
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield graphql_language_service_server_1.startServer({
            method: "node",
            extensions: [graphql_config_extension_prisma_1.patchConfig]
        });
    }
    catch (err) {
        console.error(err);
    }
}))();
//# sourceMappingURL=server.js.map