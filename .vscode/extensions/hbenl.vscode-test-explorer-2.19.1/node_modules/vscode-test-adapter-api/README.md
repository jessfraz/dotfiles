# VS Code Test Adapter API

This package contains the APIs that Test Adapters or Test Controllers need to implement to work with the [VS Code Test Explorer](hhttps://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer).

The API reference documentation can be found [here](https://github.com/hbenl/vscode-test-adapter-api/blob/master/src/index.ts).

## Implementing a Test Adapter

A Test Adapter allows the Test Explorer to load and run the tests using a particular test framework.
There is an [Example Test Adapter](https://github.com/hbenl/vscode-example-test-adapter.git) that you can use as a template for your implementation.
It uses the [Test Adapter Util](https://github.com/hbenl/vscode-test-adapter-util.git) package for some standard tasks (mostly logging and registering the adapter with Test Explorer).

### Registering your Test Adapter with the Test Explorer

The easiest way to register your Test Adapter with the Test Explorer is to use the `TestAdapterRegistrar` class from the [Test Adapter Util](https://github.com/hbenl/vscode-test-adapter-util.git) package in the [`activate()`](https://code.visualstudio.com/api/get-started/extension-anatomy#extension-entry-file) function of your extension:

```typescript
import { TestHub, testExplorerExtensionId } from 'vscode-test-adapter-api';
import { TestAdapterRegistrar } from 'vscode-test-adapter-util';

export function activate(context: vscode.ExtensionContext) {

    const testExplorerExtension = vscode.extensions.getExtension<TestHub>(testExplorerExtensionId);

    if (testExplorerExtension) {

        const testHub = testExplorerExtension.exports;

        context.subscriptions.push(new TestAdapterRegistrar(
            testHub,
            workspaceFolder => new MyTestAdapter(workspaceFolder)
        ));
    }
}
```

The `TestAdapterRegistrar` will create and register one Test Adapter per workspace folder and unregister it when the workspace folder is closed or removed from the workspace.
It requires the Test Adapter to implement a `dispose()` method that will be called after unregistering the Test Adapter.
The `TestAdapterRegistrar` has a `dispose()` method itself which should be called when the Test Adapter extension is deactivated.
In the example above, we achieve this by adding it to `context.subscriptions`.

While most Test Adapter implementations create one adapter per workspace folder, this is not a requirement.
If you don't want to do this or have any other reason to not use `TestAdapterRegistrar`, you can easily register your adapter like this:

```typescript
const testAdapter = new MyTestAdapter(...);
testHub.registerTestAdapter(testAdapter);
```

Don't forget to unregister your adapter when your extension is deactivated:

```typescript
testHub.unregisterTestAdapter(testAdapter);
```

### Implementing the events

Every Test Adapter needs to implement the `tests` and `testStates` events and it's recommended to also implement the `retire` event:

```typescript
private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
private readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();
private readonly retireEmitter = new vscode.EventEmitter<RetireEvent>();

get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
    return this.testsEmitter.event;
}
get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
    return this.testStatesEmitter.event;
}
get retire(): vscode.Event<RetireEvent> {
    return this.retireEmitter.event;
}
```

### Loading the tests

The `load()` method is responsible for loading the tests and sending their metadata to the Test Explorer.
This method will be called by the Test Explorer, but you should also consider running it automatically whenever one of the test files has changed (as described [below](#watching-for-changes-in-the-workspace)).

It uses the `tests` event to communicate with the Test Explorer.
It must send one `TestLoadStartedEvent` at the beginning and one `TestLoadFinishedEvent` at the end.
* If the adapter found some tests, these must be sent using `TestLoadFinishedEvent#suite`
* If the adapter ran successfully but didn't find any tests, the `TestLoadFinishedEvent` should contain no `suite` or `errorMessage`
* If the adapter failed to load the tests (e.g. due to some misconfiguration by the user) and you want to show a message to the user that might help him fix the problem, that message must be sent using `TestLoadFinishedEvent#errorMessage`
* It is important that you ensure that both events are sent (each one exactly once) when loading the tests, otherwise you will confuse the Test Explorer
* Furthermore, you should make sure that the `load()` method doesn't run twice in parallel
* The `TestInfo#id` needs to be unique for each test because otherwise the Test Explorer won't know which test to assign the test results to
* The `TestSuiteInfo#label` of the root suite sent to the Test Explorer is not shown when there is only one adapter, but when there are multiple adapters, it will be shown to let the user know where the tests are coming from, so it is recommended to use the name of the testing framework that your Test Adapter supports as the root suite label
* After sending the `TestLoadFinishedEvent` you should also send a `RetireEvent` to mark the test states as outdated. If your Test Adapter doesn't contain the `retire` property, the Test Explorer will automatically retire all test states after a `TestLoadFinishedEvent`.

Here's a skeleton for a typical implementation of `load()`:

```typescript
private isLoading = false;

async load(): Promise<void> {

    if (this.isLoading) return; // it is safe to ignore a call to `load()`, even if it comes directly from the Test Explorer

    this.isLoading = true;
    this.testsEmitter.fire({ type: 'started' });

    try {

        const suite = ... // load the tests, the result may be `undefined`...

        this.testsEmitter.fire({ type: 'finished', suite });

    } catch (e) {
        this.testsEmitter.fire({ type: 'finished', errorMessage: util.inspect(e));
    }

    this.retireEmitter.fire({}); 

    this.isLoading = false;
}
```

### Running the tests

The `run()` method runs the tests in a child process and sends the results to the Test Explorer using the `testStates` event.
It must first send a `TestRunStartedEvent` containing the IDs of the tests that it is going to run.
Next, it should send events for all tests and suites being started or completed.
Finally, it must send a `TestRunFinishedEvent`.
Technically you could run this method automatically (just like you can do with the `load()` method), but this is usually not recommended,
if the user wants tests to be run automatically, he should use the autorun feature of the Test Explorer.

For example, if there is one test suite with ID `suite1` containing one test with ID `test1`, a successful test run would usually emit the following events:

```
{ type: 'started', tests: ['suite1'] }
{ type: 'suite', suite: 'suite1', state: 'running' }
{ type: 'test', test: 'test1', state: 'running' }
{ type: 'test', test: 'test1', state: 'passed' }
{ type: 'suite', suite: 'suite1', state: 'completed' }
{ type: 'finished' }
```

* The `TestSuiteEvent`s are optional, currently they are only needed if you want to add tests or suites during a test run
* The `TestEvent`s with `state: 'running'` are also optional but recommended so that the user can see which test is currently running
* The `TestEvent`s can be sent in any order, in particular having multiple tests' states set to `'running'` at the same time is supported (useful if the test framework supports running multiple tests in parallel)
* It is important that you ensure that the `TestRunStartedEvent` is the first event and the `TestRunFinishedEvent` is the last event sent when running the tests (and each is sent exactly once), otherwise you will confuse the Test Explorer
* Furthermore, you should make sure that the `run()` method doesn't run twice in parallel

Here's a skeleton for a typical implementation of `run()` and `cancel()`:

```typescript
private runningTestProcess: : child_process.ChildProcess | undefined;

run(testsToRun: string[]): Promise<void> {

    if (this.runningTestProcess !== undefined) return; // it is safe to ignore a call to `run()`

    this.testStatesEmitter.fire({ type: 'started', tests: testsToRun });

    return new Promise<void>((resolve, reject) => {

        this.runningTestProcess = child_process.spawn(...);

        // we will _always_ receive an `exit` event when the child process ends, even if it crashes or
        // is killed, so this is a good place to send the `TestRunFinishedEvent` and resolve the Promise
        this.runningTestProcess.once('exit', () => {

            this.runningTestProcess = undefined;
            this.testStatesEmitter.fire({ type: 'finished' });
            resolve();

        });
    });
}

cancel(): void {
    if (this.runningTestProcess !== undefined) {
        this.runningTestProcess.kill();
        // there is no need to do anything else here because we will receive an `exit` event from the child process
    }
}
```

* In this example we use [`child_process.spawn()`](https://nodejs.org/dist/latest-v10.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options) to start the child process, but if the child process runs javascript, you may want to use [`child_process.fork()`](https://nodejs.org/dist/latest-v10.x/docs/api/child_process.html#child_process_child_process_fork_modulepath_args_options)
* Using [`child_process.exec()`](https://nodejs.org/dist/latest-v10.x/docs/api/child_process.html#child_process_child_process_exec_command_options_callback) or [`child_process.execFile()`](https://nodejs.org/dist/latest-v10.x/docs/api/child_process.html#child_process_child_process_execfile_file_args_options_callback) is not recommended because these functions buffer `stdout` and `stderr`, which has some downsides:
  * you won't be able to access the output of the child process until it has finished (i.e. you have to wait until the entire test run is completed before you can show the results to the user)
  * the buffers are limited in size and the child process (and hence the test run) will be terminated when this limit is reached
* Don't use any of the [synchronous methods](https://nodejs.org/dist/latest-v10.x/docs/api/child_process.html#child_process_synchronous_process_creation):
  these would block the Extension Host process (and hence _all_ VS Code extensions) until the test run is finished

### Watching for changes in the workspace

When a VS Code setting or a source file in the workspace that influences the tests changes, the user can manually reload and/or rerun the tests, but ideally the Test Adapter should do this automatically for him.

To watch for changes in the VS Code settings, use the [`onDidChangeConfiguration()`](https://code.visualstudio.com/api/references/vscode-api#workspace.onDidChangeConfiguration) event.

For file changes, there are several options:
* The [`onDidSaveTextDocument()`](https://code.visualstudio.com/api/references/vscode-api#workspace.onDidSaveTextDocument) event is fired by VS Code when the user saves his changes to a text document.
  Obviously, this is only useful if you're not interested in files that are generated/changed by another process (like a compiler/transpiler)
* You can use [`createFileSystemWatcher()`](https://code.visualstudio.com/api/references/vscode-api#workspace.createFileSystemWatcher) to watch for file changes in the workspace.
  The only downside is that this will not watch files that the user has hidden using the `files.exclude` setting (so this may also miss changes to compiled/transpiled files if the user chose to hide them in VS Code)
* You can use [`chokidar`](https://www.npmjs.com/package/chokidar) to watch for file changes.
  This is similar to using `createFileSystemWatcher()` (and VS Code also uses `chokidar` to implement its `FileSystemWatcher`), but it also lets you watch files that are hidden in VS Code.
  The main downside is that this is relatively resource-intensive, so you should make sure that you only watch the files that you definitely need to watch (when you use `createFileSystemWatcher()`,
  you're "freeloading" on the watcher that VS Code has already set up anyway, so that doesn't use any additional resources)
* If you're watching for changes in files generated by a compiler/transpiler, you may get multiple events in quick succession and should consider using some debouncing mechanism

To reload the tests after some change, you can simply call your `load()` method yourself.
If the tests themselves haven't changed but their states may be outdated (e.g. if the change was in a source file for the application being tested), you can send a [`RetireEvent`]() to the Test Explorer.
This event will also trigger a test run if the user has enabled the autorun feature for the tests.
If you know that the change may only affect the states of _some_ of the tests, you can send the IDs of these tests in the `RetireEvent`, only those tests will be retired (marked as outdated).
Otherwise you can simply send an empty object as the `RetireEvent` (as in the example below), this will retire all tests.

This example watches for changes to a VS Code setting `myTestAdapter.testFiles` and reloads the tests when the setting is changed:

```typescript
vscode.workspace.onDidChangeConfiguration(configChange => {
    if (configChange.affectsConfiguration('myTestAdapter.testFiles', this.workspaceFolder.uri)) {
        this.load();
    }
});
```

This example uses `onDidSaveTextDocument()` to watch for file changes:

```typescript
vscode.workspace.onDidSaveTextDocument(document => {
    if (isTestFile(document.uri)) {
        // the changed file contains tests, so we reload them
        this.load();
    } else if (isApplicationFile(document.uri)) {
        // the changed file is part of the application being tested, so the test states may be out of date
        this.retireEmitter.fire({});
    }
});
```
