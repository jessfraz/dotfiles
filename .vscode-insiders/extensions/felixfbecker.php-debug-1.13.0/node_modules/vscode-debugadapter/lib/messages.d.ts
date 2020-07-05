import { DebugProtocol } from 'vscode-debugprotocol';
export declare class Message implements DebugProtocol.ProtocolMessage {
    seq: number;
    type: string;
    constructor(type: string);
}
export declare class Response extends Message implements DebugProtocol.Response {
    request_seq: number;
    success: boolean;
    command: string;
    constructor(request: DebugProtocol.Request, message?: string);
}
export declare class Event extends Message implements DebugProtocol.Event {
    event: string;
    constructor(event: string, body?: any);
}
