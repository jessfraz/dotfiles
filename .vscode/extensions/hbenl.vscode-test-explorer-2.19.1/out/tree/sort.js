"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompareFn = void 0;
function getCompareFn(sortSetting) {
    switch (sortSetting) {
        case 'byLabel':
            return compareLabel;
        case 'byLocation':
            return compareLocation;
        case 'byLabelWithSuitesFirst':
            return compareWithSuitesFirst(compareLabel);
        case 'byLocationWithSuitesFirst':
            return compareWithSuitesFirst(compareLocation);
        case null:
            return compareOriginalPosition;
        default:
            return undefined;
    }
}
exports.getCompareFn = getCompareFn;
function compareLabel(a, b) {
    return a.info.label.localeCompare(b.info.label);
}
function compareLocation(a, b) {
    if (a.fileUri) {
        if (b.fileUri) {
            const compared = a.fileUri.localeCompare(b.fileUri);
            if (compared !== 0) {
                return compared;
            }
        }
        else {
            return -1;
        }
    }
    else if (b.fileUri) {
        return 1;
    }
    if (a.line !== undefined) {
        if (b.line !== undefined) {
            const compared = a.line - b.line;
            if (compared !== 0) {
                return compared;
            }
        }
        else {
            return -1;
        }
    }
    else if (b.line !== undefined) {
        return 1;
    }
    return compareLabel(a, b);
}
function compareWithSuitesFirst(compareFn) {
    return function (a, b) {
        if (a.info.type === 'suite') {
            if (b.info.type === 'test') {
                return -1;
            }
        }
        else if (b.info.type === 'suite') {
            return 1;
        }
        return compareFn(a, b);
    };
}
function compareOriginalPosition(a, b) {
    if (a.parent) {
        const siblings = a.parent.info.children;
        return siblings.indexOf(a.info) - siblings.indexOf(b.info);
    }
    else {
        return 0;
    }
}
//# sourceMappingURL=sort.js.map