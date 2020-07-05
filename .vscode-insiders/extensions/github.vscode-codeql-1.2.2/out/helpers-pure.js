"use strict";
/**
 * helpers-pure.ts
 * ------------
 *
 * Helper functions that don't depend on vscode and therefore can be used by the front-end and pure unit tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This error is used to indicate a runtime failure of an exhaustivity check enforced at compile time.
 */
class ExhaustivityCheckingError extends Error {
    constructor(expectedExhaustiveValue) {
        super("Internal error: exhaustivity checking failure");
        this.expectedExhaustiveValue = expectedExhaustiveValue;
    }
}
/**
 * Used to perform compile-time exhaustivity checking on a value.  This function will not be executed at runtime unless
 * the type system has been subverted.
 */
function assertNever(value) {
    throw new ExhaustivityCheckingError(value);
}
exports.assertNever = assertNever;

//# sourceMappingURL=helpers-pure.js.map
