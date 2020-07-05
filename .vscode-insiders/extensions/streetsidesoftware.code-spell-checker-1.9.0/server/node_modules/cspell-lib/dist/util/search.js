"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Search for an item in a sorted array.
 * The value returned is either the position of the item or where it should be inserted.
 */
function binarySearch(arr, item) {
    let left = 0;
    let right = arr.length;
    while (left < right) {
        const pos = (left + right) >> 1;
        if (arr[pos] < item) {
            left = pos + 1;
        }
        else {
            right = pos;
        }
    }
    return left;
}
exports.binarySearch = binarySearch;
//# sourceMappingURL=search.js.map