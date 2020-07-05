export declare class Handles<T> {
    private START_HANDLE;
    private _nextHandle;
    private _handleMap;
    constructor(startHandle?: number);
    reset(): void;
    create(value: T): number;
    get(handle: number, dflt?: T): T;
}
