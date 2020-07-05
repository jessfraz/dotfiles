"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateIcon = exports.parentAutorunFlag = exports.parentPreviousNodeState = exports.parentCurrentNodeState = exports.parentNodeState = exports.defaultState = void 0;
function defaultState(skipped, errored) {
    return {
        current: errored ? 'errored' : (skipped ? 'always-skipped' : 'pending'),
        previous: errored ? 'errored' : (skipped ? 'always-skipped' : 'pending'),
        autorun: false
    };
}
exports.defaultState = defaultState;
function parentNodeState(children) {
    return {
        current: parentCurrentNodeState(children),
        previous: parentPreviousNodeState(children),
        autorun: false
    };
}
exports.parentNodeState = parentNodeState;
function parentCurrentNodeState(children) {
    if (children.length === 0) {
        return 'pending';
    }
    else if (children.every((child) => (child.state.current.endsWith('skipped')))) {
        if (children.some((child) => (child.state.current === 'skipped'))) {
            return 'skipped';
        }
        else {
            return 'always-skipped';
        }
    }
    else if (children.some((child) => (child.state.current === 'running'))) {
        if (children.some((child) => child.state.current.endsWith('failed') || (child.state.current === 'errored'))) {
            return 'running-failed';
        }
        else {
            return 'running';
        }
    }
    else if (children.some((child) => (child.state.current === 'scheduled'))) {
        if (children.some((child) => child.state.current.endsWith('failed') || (child.state.current === 'errored'))) {
            return 'running-failed';
        }
        else if (children.some((child) => (child.state.current === 'passed'))) {
            return 'running';
        }
        else {
            return 'scheduled';
        }
    }
    else if (children.some((child) => (child.state.current === 'running-failed'))) {
        return 'running-failed';
    }
    else if (children.some((child) => (child.state.current === 'errored'))) {
        return 'errored';
    }
    else if (children.some((child) => (child.state.current === 'failed'))) {
        return 'failed';
    }
    else if (children.some((child) => (child.state.current === 'passed'))) {
        return 'passed';
    }
    else {
        return 'pending';
    }
}
exports.parentCurrentNodeState = parentCurrentNodeState;
function parentPreviousNodeState(children) {
    if (children.length === 0) {
        return 'pending';
    }
    else if (children.every((child) => (child.state.previous.endsWith('skipped')))) {
        if (children.some((child) => (child.state.previous === 'skipped'))) {
            return 'skipped';
        }
        else {
            return 'always-skipped';
        }
    }
    else if (children.some((child) => (child.state.previous === 'errored'))) {
        return 'errored';
    }
    else if (children.some((child) => (child.state.previous === 'failed'))) {
        return 'failed';
    }
    else if (children.some((child) => (child.state.previous === 'passed'))) {
        return 'passed';
    }
    else {
        return 'pending';
    }
}
exports.parentPreviousNodeState = parentPreviousNodeState;
function parentAutorunFlag(children) {
    return children.some(child => child.state.autorun);
}
exports.parentAutorunFlag = parentAutorunFlag;
function stateIcon(state) {
    switch (state.current) {
        case 'scheduled':
            return 'scheduled';
        case 'running':
            return 'running';
        case 'running-failed':
            return 'runningFailed';
        case 'passed':
            return state.autorun ? 'passedAutorun' : 'passed';
        case 'failed':
            return state.autorun ? 'failedAutorun' : 'failed';
        case 'skipped':
        case 'always-skipped':
            return 'skipped';
        case 'duplicate':
            return 'duplicate';
        case 'errored':
            return 'errored';
        default:
            switch (state.previous) {
                case 'passed':
                    return state.autorun ? 'passedFaintAutorun' : 'passedFaint';
                case 'failed':
                    return state.autorun ? 'failedFaintAutorun' : 'failedFaint';
                case 'skipped':
                case 'always-skipped':
                    return 'skipped';
                case 'duplicate':
                    return 'duplicate';
                case 'errored':
                    return 'erroredFaint';
                default:
                    return state.autorun ? 'pendingAutorun' : 'pending';
            }
    }
}
exports.stateIcon = stateIcon;
//# sourceMappingURL=state.js.map