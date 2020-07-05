import { DebugSession, InitializedEvent, TerminatedEvent, StoppedEvent, ContinuedEvent, OutputEvent, ThreadEvent, BreakpointEvent, ModuleEvent, LoadedSourceEvent, CapabilitiesEvent, Thread, StackFrame, Scope, Variable, Breakpoint, Source, Module, CompletionItem, ErrorDestination } from './debugSession';
import { LoggingDebugSession } from './loggingDebugSession';
import * as Logger from './logger';
import { Event, Response } from './messages';
import { Handles } from './handles';
declare const logger: Logger.Logger;
export { DebugSession, LoggingDebugSession, Logger, logger, InitializedEvent, TerminatedEvent, StoppedEvent, ContinuedEvent, OutputEvent, ThreadEvent, BreakpointEvent, ModuleEvent, LoadedSourceEvent, CapabilitiesEvent, Thread, StackFrame, Scope, Variable, Breakpoint, Source, Module, CompletionItem, ErrorDestination, Event, Response, Handles };
