### Version 2.19.1
* UI bugfix for running multiple test runs in parallel

### Version 2.19.0
* add support for marking suites as errored
* add support for marking tests and suites as not debuggable
* improve support for running multiple test runs in parallel

### Version 2.18.1
* The debug icon in the Test Explorer is now also shown for test suites
* The background color for error decorations can now be customized by color themes
* update list of test adapters in README.md

### Version 2.18.0
* Workaround for [microsoft/vscode#94872](https://github.com/microsoft/vscode/issues/94872), which broke some of the global menu items in the Test Explorer view
* Allow test-explorer.reveal command argument to be the ID of a node
* update list of test adapters in README.md

### Version 2.17.0
* replace `testExplorer.hideWhenEmpty` with `testExplorer.hideWhen` and change the default back to the old behavior (never hide the Test Explorer) because the other settings don't work or are confusing with some test adapters

### Version 2.16.0
* initial support for Test(Suite)Event#file and Test(Suite)Event#line; this is still experimental, the gutter decorations sometimes show up in the wrong place when these properties are used and there may be other bugs
* only show the Test Explorer when some tests have been found; set `testExplorer.hideWhenEmpty` to `false` to get back the old behavior
* show more prominent warnings about multiple tests with the same ID

### Version 2.15.0
* let the user pick a test when he clicks a run or debug code lens that represents multiple tests

### Version 2.14.6
* allow selecting (and running) multiple items in the tree view

### Version 2.14.5
* bugfix: the debug buttons in the tree view and debug code lenses were broken in 2.14.4

### Version 2.14.4
* bugfix: running tests from the tree view stopped working in VS Code 1.38

### Version 2.14.3
* update list of test adapters in README.md

### Version 2.14.2
* update list of test adapters in README.md

### Version 2.14.1
* adjust the CodeLens positions when a test file is edited

### Version 2.14.0
* add `testExplorer.hideEmptyLog` configuration option

### Version 2.13.0
* add configuration option for merging suites with the same label
* bugfix: "Run all test in file" did not always run all of the tests

### Version 2.12.1
* bugfix: when multiple adapters failed to load tests, Test Explorer didn't show their error messages

### Version 2.12.0
* automatically update the output channel if the test whose log is shown is run again
* remember the autorun setting when VS Code is restarted

### Version 2.11.1
* add Test Explorer Status Bar to the list of test controllers in README.md

### Version 2.11.0
* add menu items to the main menu in the Test Explorer sidebar for sorting the tests
* add menu items to the editor context menu for running and debugging the tests in the current file (set `testExplorer.addToEditorContextMenu` to `true` to enable them)
* bugfix: decorations were sometimes not updated

### Version 2.10.1
* update list of test adapters in README.md

### Version 2.10.0
* enable the expand/collapse buttons by default
* update list of test adapters in README.md

### Version 2.9.3
* update list of test adapters in README.md

### Version 2.9.2
* performance fix for large trees (proper fix for suite description updates not being sent to VS Code)

### Version 2.9.1
* bugfix: sending a retire event with multiple nodes opened the test picker

### Version 2.9.0
* add support for the retire event
* the default behavior for retiring tests after reloading has changed! Previously, the test states did not change after reloading (unless the user set `testExplorer.onReload` in his configuration), now the default is to retire them because the states may be outdated. This default behavior is disabled when a Test Adapter implements the retire event because then it is up to the Adapter to tell the Test Explorer which tests should be retired.

### Version 2.8.2
* temporary workaround for suite description updates not being sent to VS Code

### Version 2.8.1
* update list of test adapters in README.md

### Version 2.8.0
* add the ability for adapters to set descriptions for tests and suites
* add the ability for adapters to change the descriptions and tooltips for tests and suites when they are run

### Version 2.7.0
* add configuration options to show buttons for collapsing or expanding the test tree nodes
* add configuration option for switching to the Test Explorer view whenever a test run is started

### Version 2.6.0
* add configuration option for sorting the tests and suites
* add the ability for adapters to set tooltips for tests and suites

### Version 2.5.0
* make TestAdapter#debug optional and don't show menu items and code lenses for debugging if TestAdapter#debug isn't defined

### Version 2.4.1
* ensure that the IDs of nodes from different adapters never clash
* ensure that the filenames from the adapters match the file URIs we get from VS Code

### Version 2.4.0
* handle multiple tests with the same ID
* new test state for tests that the adapter failed to run

### Version 2.3.2
* clean up states of tests that were not run after receiving the completed event for the suite containing them

### Version 2.3.1
* update list of test adapters in README.md

### Version 2.3.0
* add commands for repeating the last test run

### Version 2.2.0
* add CodeLenses for showing a test's log and revealing the test in the explorer

### Version 2.1.0
* remember if a test was skipped dynamically (while running the test) and don't reset its state when reloading the tests

### Version 2.0.9
* fix decorations and CodeLenses on Windows

### Version 2.0.8
* show error message when loading the tests fails

### Version 2.0.7
* bugfix for TestLoadEvents being sent to the controllers twice

### Version 2.0.6
* add command for debugging the test at the current cursor position

### Version 2.0.5
* show the "Show source" button only for tests and suites that specify a source file

### Version 2.0.4
* fix the "Show source" button on Windows

### Version 2.0.3
* updated documentation

### Version 2.0.2
* UI bugfix: when multiple adapters are installed, the "Run all tests" button did not change when tests were running

### Version 2.0.1
* API bugfix

### Version 2.0.0
* changed API to allow support for VS Live Share and more extensibility

### Version 1.1.0
* add commands for running all tests in the current file or the test at the current cursor position
* remove error decorations when resetting the test states

### Version 1.0.1
* bugfix for broken CodeLenses

### Version 1.0.0
* show error decorations
* show state decorations for test suites
* bugfixes for CodeLenses or decorations not being updated in some situations
* add support for multiple (dynamically generated) tests on one line

### Version 0.4.2
* turn "Show source" context menu item into an inline menu item

### Version 0.4.1
* bugfix for another state display bug

### Version 0.4.0
* start an autorun after automatically reloading the tests
* bugfix for the autorun state not being displayed correctly

### Version 0.3.3
* animate the reload icon while tests are loading

### Version 0.3.2
* simplification of Test Adapter API: events for test suites are now optional

### Version 0.3.1
* bugfixes for CodeLenses not appearing in non-javascript files and inconsistent handling of skipped tests

### Version 0.3.0
* provide Gutter Decorations showing the test states

### Version 0.2.1
* add configuration option for turning off CodeLenses

### Version 0.2.0
* provide CodeLenses for running and debugging tests

### Version 0.1.4
* update list of test adapters

### Version 0.1.3
* bugfix for registration of tests and suites during a test run
* bugfix for computation of state of test suites

### Version 0.1.2
* bugfix for resetting the state of partially-run suites

### Version 0.1.1
* bugfixes for retiring and resetting test states from the global menu
