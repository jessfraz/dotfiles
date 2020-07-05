import { GraphQLNonNull, GraphQLList, } from 'graphql';
import { getTokenAtPosition, getTypeInfo } from './getAutocompleteSuggestions';
export function getHoverInformation(schema, queryText, cursor, contextToken) {
    const token = contextToken || getTokenAtPosition(queryText, cursor);
    if (!schema || !token || !token.state) {
        return '';
    }
    const state = token.state;
    const kind = state.kind;
    const step = state.step;
    const typeInfo = getTypeInfo(schema, token.state);
    const options = { schema };
    if ((kind === 'Field' && step === 0 && typeInfo.fieldDef) ||
        (kind === 'AliasedField' && step === 2 && typeInfo.fieldDef)) {
        const into = [];
        renderField(into, typeInfo, options);
        renderDescription(into, options, typeInfo.fieldDef);
        return into.join('').trim();
    }
    else if (kind === 'Directive' && step === 1 && typeInfo.directiveDef) {
        const into = [];
        renderDirective(into, typeInfo, options);
        renderDescription(into, options, typeInfo.directiveDef);
        return into.join('').trim();
    }
    else if (kind === 'Argument' && step === 0 && typeInfo.argDef) {
        const into = [];
        renderArg(into, typeInfo, options);
        renderDescription(into, options, typeInfo.argDef);
        return into.join('').trim();
    }
    else if (kind === 'EnumValue' &&
        typeInfo.enumValue &&
        'description' in typeInfo.enumValue) {
        const into = [];
        renderEnumValue(into, typeInfo, options);
        renderDescription(into, options, typeInfo.enumValue);
        return into.join('').trim();
    }
    else if (kind === 'NamedType' &&
        typeInfo.type &&
        'description' in typeInfo.type) {
        const into = [];
        renderType(into, typeInfo, options, typeInfo.type);
        renderDescription(into, options, typeInfo.type);
        return into.join('').trim();
    }
    return '';
}
function renderField(into, typeInfo, options) {
    renderQualifiedField(into, typeInfo, options);
    renderTypeAnnotation(into, typeInfo, options, typeInfo.type);
}
function renderQualifiedField(into, typeInfo, options) {
    if (!typeInfo.fieldDef) {
        return;
    }
    const fieldName = typeInfo.fieldDef.name;
    if (fieldName.slice(0, 2) !== '__') {
        renderType(into, typeInfo, options, typeInfo.parentType);
        text(into, '.');
    }
    text(into, fieldName);
}
function renderDirective(into, typeInfo, _options) {
    if (!typeInfo.directiveDef) {
        return;
    }
    const name = '@' + typeInfo.directiveDef.name;
    text(into, name);
}
function renderArg(into, typeInfo, options) {
    if (typeInfo.directiveDef) {
        renderDirective(into, typeInfo, options);
    }
    else if (typeInfo.fieldDef) {
        renderQualifiedField(into, typeInfo, options);
    }
    if (!typeInfo.argDef) {
        return;
    }
    const name = typeInfo.argDef.name;
    text(into, '(');
    text(into, name);
    renderTypeAnnotation(into, typeInfo, options, typeInfo.inputType);
    text(into, ')');
}
function renderTypeAnnotation(into, typeInfo, options, t) {
    text(into, ': ');
    renderType(into, typeInfo, options, t);
}
function renderEnumValue(into, typeInfo, options) {
    if (!typeInfo.enumValue) {
        return;
    }
    const name = typeInfo.enumValue.name;
    renderType(into, typeInfo, options, typeInfo.inputType);
    text(into, '.');
    text(into, name);
}
function renderType(into, typeInfo, options, t) {
    if (!t) {
        return;
    }
    if (t instanceof GraphQLNonNull) {
        renderType(into, typeInfo, options, t.ofType);
        text(into, '!');
    }
    else if (t instanceof GraphQLList) {
        text(into, '[');
        renderType(into, typeInfo, options, t.ofType);
        text(into, ']');
    }
    else {
        text(into, t.name);
    }
}
function renderDescription(into, options, def) {
    if (!def) {
        return;
    }
    const description = typeof def.description === 'string' ? def.description : null;
    if (description) {
        text(into, '\n\n');
        text(into, description);
    }
    renderDeprecation(into, options, def);
}
function renderDeprecation(into, _options, def) {
    if (!def) {
        return;
    }
    const reason = def.deprecationReason ? def.deprecationReason : null;
    if (!reason) {
        return;
    }
    text(into, '\n\n');
    text(into, 'Deprecated: ');
    text(into, reason);
}
function text(into, content) {
    into.push(content);
}
//# sourceMappingURL=getHoverInformation.js.map