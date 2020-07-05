# VS Code Debug Protocol

[![NPM Version](https://img.shields.io/npm/v/vscode-debugprotocol.svg)](https://npmjs.org/package/vscode-debugprotocol)
[![NPM Downloads](https://img.shields.io/npm/dm/vscode-debugprotocol.svg)](https://npmjs.org/package/vscode-debugprotocol)

This npm module contains declarations for the json-based Visual Studio Code debug protocol.

## History

* 1.27.x:
* Adds a new `capabilities` event that hints to the frontend that one or more capabilities got updated.
* Initial support for logPoints: new attribute `SourceBreakpoint.logMessage` and capability `supportsLogPoint`.

* 1.26.x:
no protocol changes

* 1.25.x:
  * Adds a new enum value `virtual` for the `presentationHint` attribute of type `Variable`.
  * To remove env variables from the environment support a 'null' value for `env` attribute in `runInTerminal` request.

* 1.24.x:
  * Adds `removed` to the value set of the `reason` attribute of the `BreakpointEvent`.
  * Adds a `locale` attribute to the `initialize` request. The adapter can use this information to translate user visible information.

* 1.23.x:
  * Adds a `source`, `line`, and `column` attributes to the `Output` event. With this a frontend can show a link to the source where the output was generated.
  * Adds support for retrieving loaded scripts and receiving loaded script events (`LoadedSourcesRequest`, `LoadedSourceEvent`).
  * Adds display hints for variables and evaluation results (type `VariablePresentationHint`).

* 1.22.x:
  * Adds a new enum value `normal` for the `presentationHint` attribute of type `Source`.
  * Adds a new event `process` that conveys process ID and other information about the debuggee.

* 1.21.x:
  * Adds optional attribute `includeAll` to type `StackFrameFormat`. With this the `StackTraceRequest` can be parameterized to include all stack frames, including those the DA might otherwise hide.
  * Adds capability `supportsDelayedStackTraceLoading` that indicates that a debug adapter supports the delayed loading of parts of the stack. This requires that both the `startFrame` and `levels` arguments and the `totalFrames` result of the `StackTraceRequest` are supported.

* 1.20.x:
  * Extends the type of the `TerminatedEvent.body.restart` attribute from `boolean` to `any`. This makes it possible to loop arbitrary data from one debug session to the next.
  * Adds a new enum value `subtle` for the `presentationHint` attribute of type `StackFrame`.

* 1.19.x:
  * Adds a new optional argument `terminateDebuggee` to the `disconnect` request. If a debug adapter has opted into this feature with the 'supportTerminateDebuggee' capability, a client can use this to control whether the debuggee should be terminated when the debugger is disconnected.

* 1.18.x:
  * Adds optional attribute `source` to the `SourceArguments`.
  * Made StoppedEvent's `reason` attribute robust against translation by introducing a new `description` attribute.
  * Add a new optional attribute `presentationHint` to the `StackFrame` type. This attribute can be used to control how the frame is rendered in the UI.

* 1.17.x:
  * Adds optional attribute `clientID` to the `InitializeRequestArguments`.
  * Adds support for obtaining exception details: `ExceptionInfoRequest`, `ExceptionDetails`.
  * Adds optional parameter `format` to the `SetVariableRequest`.

* 1.16.x:
  * Updated comments for `path` and `sourceReference` attributes of `Source` type (the frontend no longer needs to have a notion of 'internal' modules; it just loads the content of a Source either through the sourceReference or the path).
  * Adds optional `presentationHint` attribute to `Source` type. This allows to control how the frontend shows a source reference in th UI.
  * Removed `SHA1Normalized`and `SHA256Normalized` values from type `ChecksumAlgorithm`.

* 1.15.x:
  * Adds a `reverseContinue` request.
  * Adds a `restart` request and a corresponding `supportsRestartRequest` capability.
  * Adds a `variablesReference` attribute to the `OutputEvent`.
  * Adds support for exception configuration options.
  * Adds formatting options support for values returned from `VariablesRequest`, `EvaluateRequest`, and `StackTraceRequest`.

* 1.14.x:
  * Adds optional `type` attribute to the `SetVariableResponse` type.
  * Support to return a structured object from the `SetVariableRequest`.
  * Fine tuning of `Module` part of the protocol.
  * Adds optional attribute `evaluatable` to `Variable` type.
  * Adds optional checksum support to `Source` type.
  * Adds optional source range to `Scope` type.

* 1.13.x:
  * Fix typo in `Capabilities` type.
  * Adds an optional `hitCondition` attribute to breakpoints and a corresponding `supportsHitConditionalBreakpoints`capability.

* 1.12.x:
  * Adds a new optional attribute `frameId` to the `completionRequest`.
  * Introduces a `runInTerminalRequest` so that a debug adapter can run a debuggee in a terminal managed by the frontend.
  * Adds a `type` attribute (and a value set) to the `CompletionItem`.

* 1.11.x:
  * Adds a new optional attribute `mimeType` to the `SourceResponse`.
  * Adds a new optional attribute `sourceModified` to the `SetBreakpointsArguments` that indicates that the underlying source has been modified which results in new breakpoint locations.
  * Adds a new optional attribute `supportsVariableType` to `InitializeRequestArguments`. True indicates that the client shows the variable's type attribute in the UI.
  * Adds optional 'type' attribute to the `EvaluateResponse`.
  * Introduces the `RestartFrameRequest` and a corresponding `supportsRestartFrame` capability.
  * Introduces a `ContinuedEvent` so that a debug adapter can explicit trigger that a thread has continued execution.
  * Adds support for step in targets (request `StepInTargetsRequest`, type `StepInTarget`, capability `supportsStepInTargetsRequest`)
  * Adds support for goto targets (requests `GotoTargetsRequest` and `GotoRequest`, type `GotoTarget`, capability `supportsGotoTargetsRequest`)
  * Adds support for variable paging, that is named and indexed children of a variable can be requested in pages (chunks).
  * Adds experimental support for completion proposals.

* 1.10.x:
  * Introduces a `stepBack` request and a corresponding `supportsStepBack` capability.
  * Introduces the type `Module`, a `ModuleRequest`, and a `ModuleEvent`
  * Introduces the `setVariableRequest`
  * Adds new optional attributes `type` and `kind` for a `Variable`.
  * Adds optional attributes `endLine` and `endColumn` to `StackFrame` and `Breakpoint` types.

* 1.9.x:
  * Introduces a `allThreadsContinued` attribute on the `ContinueResponse` to indicate that all threads are continued and not only the one specified.

* 1.8.x:
  * Introduces `ExceptionBreakpointsFilter` and fixed corresponding capability.
  * Adds optional `noDebug` attribute to `LaunchRequestArguments`.
  * Adds optional `startFrame` argument to `StackTraceArguments` to allow for paging.
  * Adds optional `totalFrames` argument to `StackTraceResponse` to allow for paging.
  * Improve comment: `InitializedEvent` must not be sent before `InitializeRequest` has returned its result.

* 1.7.x:
  * Adds optional `url` and `urlLabel` attributes to the error messages. The frontend will show this as a UI to open additional information in a browser.
  * Added option `default` attribute to the `exceptionBreakpointFilters` capability.
  * Adds optional attribute `allThreadsStopped` to the `StoppedEvent` to indicate that all threads are stopped (and not only the one mentioned in the event).

* 1.6.x:
  * A boolean `supportsConditionalBreakpoints` in `Capabilities` indicates whether the debug adapter supports conditional breakpoints.
  * Adds an optional `exceptionBreakpointFilters` capability that lists the filters available for the `setExceptionBreakpoints` request.
  * Adds an optional `restart` attribute to the `TerminatedEvent` which can be used to request a restart of the debug session.

* 1.5.x:
  * A boolean `supportsFunctionBreakpoints` in `Capabilities` indicates whether the debug adapter implements the function breakpoints.
  * Renamed `supportEvaluateForHovers` in `Capabilities` to `supportsEvaluateForHovers`.

* 1.4.x:
  * Made the `body` of the `InitializeResponse` optional (for backward compatibility).

* 1.3.x: Version introduces support for feature negotiation.
  * The `InitializeResponse` has now attributes for these features:
    * A boolean `supportsConfigurationDoneRequest` indicates whether the debug adapter implements the `ConfigurationDoneRequest`.
    * A boolean `supportEvaluateForHovers` indicates whether the debug adapter supports a side effect free `EvaluateRequest`.
  * Adds an optional `data` attribute to the `OutputEvent` and a `telemetry` category.
  * Adds a new context type `hover` to the `context` attribute of the `EvaluateArguments`.

* 1.2.x: Version adds a new request:
  * Introduces a `ConfigurationDoneRequest` that VS Code sends to indicate that the configuration of the debug session has finished and that debugging can start.

* 1.1.x: Version adds support for conditional breakpoints and breakpoints in virtual documents:
  * Type `Source` supports optional `origin` attribute to provide information that is shown in the debug UI.
  * Type `Source` supports an optional `adapterData` attribute that the VS Code debug UI will transparently persists for breakpoints.
  * Introduces type `SourceBreakpoint` that makes it possible to provide `column` and `condition` information when specifying a breakpoint.

* 1.0.1: Initial version of the debug protocol

## License

[MIT](https://github.com/Microsoft/vscode-languageserver-node/blob/master/License.txt)
