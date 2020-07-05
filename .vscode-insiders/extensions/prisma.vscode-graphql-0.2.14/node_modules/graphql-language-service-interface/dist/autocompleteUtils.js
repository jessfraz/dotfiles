"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const introspection_1 = require("graphql/type/introspection");
function getDefinitionState(tokenState) {
    let definitionState;
    forEachState(tokenState, (state) => {
        switch (state.kind) {
            case 'Query':
            case 'ShortQuery':
            case 'Mutation':
            case 'Subscription':
            case 'FragmentDefinition':
                definitionState = state;
                break;
        }
    });
    return definitionState;
}
exports.getDefinitionState = getDefinitionState;
function getFieldDef(schema, type, fieldName) {
    if (fieldName === introspection_1.SchemaMetaFieldDef.name && schema.getQueryType() === type) {
        return introspection_1.SchemaMetaFieldDef;
    }
    if (fieldName === introspection_1.TypeMetaFieldDef.name && schema.getQueryType() === type) {
        return introspection_1.TypeMetaFieldDef;
    }
    if (fieldName === introspection_1.TypeNameMetaFieldDef.name && graphql_1.isCompositeType(type)) {
        return introspection_1.TypeNameMetaFieldDef;
    }
    if ('getFields' in type) {
        return type.getFields()[fieldName];
    }
    return null;
}
exports.getFieldDef = getFieldDef;
function forEachState(stack, fn) {
    const reverseStateStack = [];
    let state = stack;
    while (state && state.kind) {
        reverseStateStack.push(state);
        state = state.prevState;
    }
    for (let i = reverseStateStack.length - 1; i >= 0; i--) {
        fn(reverseStateStack[i]);
    }
}
exports.forEachState = forEachState;
function objectValues(object) {
    const keys = Object.keys(object);
    const len = keys.length;
    const values = new Array(len);
    for (let i = 0; i < len; ++i) {
        values[i] = object[keys[i]];
    }
    return values;
}
exports.objectValues = objectValues;
function hintList(token, list) {
    return filterAndSortList(list, normalizeText(token.string));
}
exports.hintList = hintList;
function filterAndSortList(list, text) {
    if (!text) {
        return filterNonEmpty(list, entry => !entry.isDeprecated);
    }
    const byProximity = list.map(entry => ({
        proximity: getProximity(normalizeText(entry.label), text),
        entry,
    }));
    const conciseMatches = filterNonEmpty(filterNonEmpty(byProximity, pair => pair.proximity <= 2), pair => !pair.entry.isDeprecated);
    const sortedMatches = conciseMatches.sort((a, b) => (a.entry.isDeprecated ? 1 : 0) - (b.entry.isDeprecated ? 1 : 0) ||
        a.proximity - b.proximity ||
        a.entry.label.length - b.entry.label.length);
    return sortedMatches.map(pair => pair.entry);
}
function filterNonEmpty(array, predicate) {
    const filtered = array.filter(predicate);
    return filtered.length === 0 ? array : filtered;
}
function normalizeText(text) {
    return text.toLowerCase().replace(/\W/g, '');
}
function getProximity(suggestion, text) {
    let proximity = lexicalDistance(text, suggestion);
    if (suggestion.length > text.length) {
        proximity -= suggestion.length - text.length - 1;
        proximity += suggestion.indexOf(text) === 0 ? 0 : 0.5;
    }
    return proximity;
}
function lexicalDistance(a, b) {
    let i;
    let j;
    const d = [];
    const aLength = a.length;
    const bLength = b.length;
    for (i = 0; i <= aLength; i++) {
        d[i] = [i];
    }
    for (j = 1; j <= bLength; j++) {
        d[0][j] = j;
    }
    for (i = 1; i <= aLength; i++) {
        for (j = 1; j <= bLength; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }
    return d[aLength][bLength];
}
//# sourceMappingURL=autocompleteUtils.js.map