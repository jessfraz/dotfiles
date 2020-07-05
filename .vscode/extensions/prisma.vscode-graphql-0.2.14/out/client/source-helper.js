"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
class SourceHelper {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    getTypeForVariableDefinitionNode(node) {
        let namedTypeNode = null;
        let isList = false;
        graphql_1.visit(node, {
            ListType(node) {
                isList = true;
            },
            NamedType(node) {
                namedTypeNode = node;
            },
        });
        if (isList) {
            // TODO: This is not a name.value but a custom type that might confuse future programmers
            return "ListNode";
        }
        if (namedTypeNode) {
            // TODO: Handle this for object types/ enums/ custom scalars
            return namedTypeNode.name.value;
        }
        else {
            // TODO: Is handling all via string a correct fallback?
            return "String";
        }
    }
    typeCast(value, type) {
        if (type === "Int") {
            return parseInt(value);
        }
        if (type === "Float") {
            return parseFloat(value);
        }
        if (type === "Boolean") {
            return Boolean(value);
        }
        if (type === "String") {
            return value;
        }
        // TODO: Does this note need to have an impact?
        // NOTE:
        // -- We don't do anything for non-nulls - the backend will throw a meaninful error
        // -- We treat custom types and lists similarly - as JSON - tedious for user to provide JSON but it works
        // -- We treat enums as string and that fits
        // Object type
        try {
            return JSON.parse(value);
        }
        catch (e) {
            this.outputChannel.appendLine(`Failed to parse user input as JSON, please use double quotes.`);
            return value;
        }
    }
    extractAllTemplateLiterals(document, tags = ["gql"]) {
        const text = document.getText();
        const documents = [];
        if (document.languageId === 'graphql') {
            const text = document.getText();
            processGraphQLString(text, 0);
            return documents;
        }
        tags.forEach(tag => {
            // https://regex101.com/r/Pd5PaU/2
            const regExpGQL = new RegExp(tag + "\\s*`([\\s\\S]+?)`", "mg");
            let result;
            while ((result = regExpGQL.exec(text)) !== null) {
                const contents = result[1];
                // https://regex101.com/r/KFMXFg/2
                if (Boolean(contents.match("/${(.+)?}/g"))) {
                    // We are ignoring operations with template variables for now
                    continue;
                }
                try {
                    processGraphQLString(contents, result.index + 4);
                }
                catch (e) { }
            }
        });
        return documents;
        function processGraphQLString(text, offset) {
            try {
                const ast = graphql_1.parse(text);
                const operations = ast.definitions.filter(def => def.kind === 'OperationDefinition');
                operations.forEach((op) => {
                    const filteredAst = Object.assign(Object.assign({}, ast), { definitions: ast.definitions.filter(def => {
                            if (def.kind === 'OperationDefinition' && def !== op) {
                                return false;
                            }
                            return true;
                        }) });
                    const content = graphql_1.print(filteredAst);
                    documents.push({
                        content: content,
                        uri: document.uri.path,
                        position: document.positionAt(op.loc.start + offset),
                        definition: op,
                        ast: filteredAst
                    });
                });
            }
            catch (e) { }
        }
    }
}
exports.SourceHelper = SourceHelper;
//# sourceMappingURL=source-helper.js.map