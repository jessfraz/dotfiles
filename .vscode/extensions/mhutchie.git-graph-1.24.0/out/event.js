"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventEmitter {
    constructor() {
        this.listeners = [];
        this.event = (listener, disposables) => {
            this.listeners.push(listener);
            disposables.push({
                dispose: () => {
                    const removeListener = this.listeners.indexOf(listener);
                    if (removeListener > -1) {
                        this.listeners.splice(removeListener, 1);
                    }
                }
            });
        };
    }
    dispose() {
        this.listeners = [];
    }
    emit(event) {
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            }
            catch (_) { }
        });
    }
    get subscribe() {
        return this.event;
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=event.js.map