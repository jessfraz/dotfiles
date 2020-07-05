// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
export class Signal {
    constructor() {
        this.slots = new Set();
    }
    // tslint:disable-next-line: no-any
    connect(slot, thisArg) {
        const bound = thisArg ? slot.bind(thisArg) : slot;
        this.slots.add(bound);
        return true;
    }
    // tslint:disable-next-line: no-any
    disconnect(slot, thisArg) {
        const bound = thisArg ? slot.bind(thisArg) : slot;
        this.slots.delete(bound);
        return true;
    }
    fire(sender, args) {
        this.slots.forEach((s) => s(sender, args));
    }
}
//# sourceMappingURL=signal.js.map