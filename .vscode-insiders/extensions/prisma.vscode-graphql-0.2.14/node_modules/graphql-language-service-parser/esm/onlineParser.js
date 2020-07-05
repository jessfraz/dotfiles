import { LexRules, ParseRules, isIgnored } from './Rules';
export default function onlineParser(options = {
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    lexRules: LexRules,
    parseRules: ParseRules,
    editorConfig: {},
}) {
    return {
        startState() {
            const initialState = {
                level: 0,
                step: 0,
                name: null,
                kind: null,
                type: null,
                rule: null,
                needsSeperator: false,
                prevState: null,
            };
            pushRule(options.parseRules, initialState, 'Document');
            return initialState;
        },
        token(stream, state) {
            return getToken(stream, state, options);
        },
    };
}
function getToken(stream, state, options) {
    const { lexRules, parseRules, eatWhitespace, editorConfig } = options;
    if (state.rule && state.rule.length === 0) {
        popRule(state);
    }
    else if (state.needsAdvance) {
        state.needsAdvance = false;
        advanceRule(state, true);
    }
    if (stream.sol()) {
        const tabSize = (editorConfig && editorConfig.tabSize) || 2;
        state.indentLevel = Math.floor(stream.indentation() / tabSize);
    }
    if (eatWhitespace(stream)) {
        return 'ws';
    }
    const token = lex(lexRules, stream);
    if (!token) {
        const matchedSomething = stream.match(/\S+/);
        if (!matchedSomething) {
            stream.match(/\s/);
        }
        pushRule(SpecialParseRules, state, 'Invalid');
        return 'invalidchar';
    }
    if (token.kind === 'Comment') {
        pushRule(SpecialParseRules, state, 'Comment');
        return 'comment';
    }
    const backupState = assign({}, state);
    if (token.kind === 'Punctuation') {
        if (/^[{([]/.test(token.value)) {
            if (state.indentLevel !== undefined) {
                state.levels = (state.levels || []).concat(state.indentLevel + 1);
            }
        }
        else if (/^[})\]]/.test(token.value)) {
            const levels = (state.levels = (state.levels || []).slice(0, -1));
            if (state.indentLevel) {
                if (levels.length > 0 &&
                    levels[levels.length - 1] < state.indentLevel) {
                    state.indentLevel = levels[levels.length - 1];
                }
            }
        }
    }
    while (state.rule) {
        let expected = typeof state.rule === 'function'
            ? state.step === 0
                ? state.rule(token, stream)
                : null
            : state.rule[state.step];
        if (state.needsSeperator) {
            expected = expected && expected.separator;
        }
        if (expected) {
            if (expected.ofRule) {
                expected = expected.ofRule;
            }
            if (typeof expected === 'string') {
                pushRule(parseRules, state, expected);
                continue;
            }
            if (expected.match && expected.match(token)) {
                if (expected.update) {
                    expected.update(state, token);
                }
                if (token.kind === 'Punctuation') {
                    advanceRule(state, true);
                }
                else {
                    state.needsAdvance = true;
                }
                return expected.style;
            }
        }
        unsuccessful(state);
    }
    assign(state, backupState);
    pushRule(SpecialParseRules, state, 'Invalid');
    return 'invalidchar';
}
function assign(to, from) {
    const keys = Object.keys(from);
    for (let i = 0; i < keys.length; i++) {
        to[keys[i]] = from[keys[i]];
    }
    return to;
}
const SpecialParseRules = {
    Invalid: [],
    Comment: [],
};
function pushRule(rules, state, ruleKind) {
    if (!rules[ruleKind]) {
        throw new TypeError('Unknown rule: ' + ruleKind);
    }
    state.prevState = { ...state };
    state.kind = ruleKind;
    state.name = null;
    state.type = null;
    state.rule = rules[ruleKind];
    state.step = 0;
    state.needsSeperator = false;
}
function popRule(state) {
    if (!state.prevState) {
        return;
    }
    state.kind = state.prevState.kind;
    state.name = state.prevState.name;
    state.type = state.prevState.type;
    state.rule = state.prevState.rule;
    state.step = state.prevState.step;
    state.needsSeperator = state.prevState.needsSeperator;
    state.prevState = state.prevState.prevState;
}
function advanceRule(state, successful) {
    if (isList(state) && state.rule) {
        const step = state.rule[state.step];
        if (step.separator) {
            const separator = step.separator;
            state.needsSeperator = !state.needsSeperator;
            if (!state.needsSeperator && separator.ofRule) {
                return;
            }
        }
        if (successful) {
            return;
        }
    }
    state.needsSeperator = false;
    state.step++;
    while (state.rule &&
        !(Array.isArray(state.rule) && state.step < state.rule.length)) {
        popRule(state);
        if (state.rule) {
            if (isList(state)) {
                if (state.rule && state.rule[state.step].separator) {
                    state.needsSeperator = !state.needsSeperator;
                }
            }
            else {
                state.needsSeperator = false;
                state.step++;
            }
        }
    }
}
function isList(state) {
    const step = Array.isArray(state.rule) &&
        typeof state.rule[state.step] !== 'string' &&
        state.rule[state.step];
    return step && step.isList;
}
function unsuccessful(state) {
    while (state.rule &&
        !(Array.isArray(state.rule) && state.rule[state.step].ofRule)) {
        popRule(state);
    }
    if (state.rule) {
        advanceRule(state, false);
    }
}
function lex(lexRules, stream) {
    const kinds = Object.keys(lexRules);
    for (let i = 0; i < kinds.length; i++) {
        const match = stream.match(lexRules[kinds[i]]);
        if (match && match instanceof Array) {
            return { kind: kinds[i], value: match[0] };
        }
    }
}
//# sourceMappingURL=onlineParser.js.map