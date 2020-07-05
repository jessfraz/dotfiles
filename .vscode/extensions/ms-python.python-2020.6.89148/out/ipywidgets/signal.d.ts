import { ISignal, Slot } from '@phosphor/signaling';
export declare class Signal<T, S> implements ISignal<T, S> {
    private slots;
    connect(slot: Slot<T, S>, thisArg?: any): boolean;
    disconnect(slot: Slot<T, S>, thisArg?: any): boolean;
    fire(sender: T, args: S): void;
}
