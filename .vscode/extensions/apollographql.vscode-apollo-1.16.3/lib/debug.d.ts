import { OutputChannel } from "vscode";
export declare class Debug {
    private static outputConsole?;
    static SetOutputConsole(outputConsole: OutputChannel): void;
    static info(message: string, _stack?: string): void;
    static error(message: string, stack?: string): void;
    static warning(message: string, _stack?: string): void;
    static clear(): void;
    private static showConsole;
}
//# sourceMappingURL=debug.d.ts.map