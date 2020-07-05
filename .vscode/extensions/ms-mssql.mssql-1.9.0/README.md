[![Build Status](https://mssqltools.visualstudio.com/CrossPlatBuildScripts/_apis/build/status/VSCode-MSSQL?branchName=master)](https://mssqltools.visualstudio.com/CrossPlatBuildScripts/_build/latest?definitionId=70&branchName=master)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/microsoft/vscode-mssql.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/microsoft/vscode-mssql/context:javascript)
[![Coverage Status](https://coveralls.io/repos/github/microsoft/vscode-mssql/badge.svg?branch=master&service=github)](https://coveralls.io/github/microsoft/vscode-mssql?branch=master)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-blue.svg)](https://gitter.im/Microsoft/mssql)


# mssql for Visual Studio Code

Welcome to **mssql** for Visual Studio Code! An extension for developing Microsoft SQL Server, Azure SQL Database and SQL Data Warehouse everywhere with a rich set of functionalities, including:

* Connect to Microsoft SQL Server, Azure SQL Database and SQL Data Warehouses.
* Create and manage connection profiles and most recently used connections.
* Write T-SQL script with IntelliSense, Go to Definition, T-SQL snippets, syntax colorizations, T-SQL error validations and ```GO``` batch separator.
* Execute your scripts and view results in a simple to use grid.
* Save the result to json or csv file format and view in the editor.
* Customizable extension options including command shortcuts and more.

See [the mssql extension tutorial] for the step by step guide.

See [the SQL developer tutorial] to develop an app with C#, Java, Node.js, PHP, Python and R with SQL Server databases.

<img src="https://github.com/Microsoft/vscode-mssql/raw/master/images/mssql-demo.gif" alt="demo" style="width:480px;"/>

## Version 1.9.0
* Release date: March 5, 2019
* Release status: GA

## What's new in 1.9.0
* Added new Query History feature
* Added Run Query and Cancel Query buttons on the editor
* Added rows affected count to status bar
* Added Object Explorer support for connection string based connections
* Removed redundant MSSQL output channel for logs
* Fixed leading tabs when copying multiple selections
* Fixed styling of NULL cells in query results
* Fixed leading tabs when copying multiple selections
* Fixed resizing messages pane causing double scrollbars to appear
* Fixed errors are not getting cleared when a file is closed


## Version 1.8.0
* Release date: December 16, 2019
* Release status: GA

## What's new in 1.8.0
* Added support for scripting context menu actions on the Object Explorer
* Added support for adding a new firewall rule to a server
* Added differentiation between database connections and server connections
* Reduced extension size from 10 MB to 6MB
* Open pinned doc when starting a new query
* Fixed scrolling and heights for multiple result sets
* Fixed bug to use the correct database for new query from Object Explorer

## Version 1.7.1
* Release date: November 11, 2019
* Release status: GA

## What's new in 1.7.1
* Fix missing row count and dropped Object Explorer connections bugs

## What's new in 1.7.0
* Announcing IntelliCode support
* SQL Server Connections viewlet
* Added support for SQLCMD Mode
* Updated SqlClient driver
* Users can adjust size of SQL results window
* Users can navigate with keyboard away from SQL results screen
* Fixed copy paste with keyboard shortcut
* Added Copy Header option to results grid
* Fix "Save as CSV" exception

## What's new in 1.6.0
* Extension install no longer requires reloading VS Code
* Update Query Results Webview API calls for compatibility with VS Code May release
* Fix "Save as CSV" exception

## What's new in 1.5.0
* Update vscode-languageclient to fix issue [#1194 Refresh Intellisence cache option don't work](https://github.com/Microsoft/vscode-mssql/issues/1194)
* Import CSV export options such as setting delimiter, line separator, encoding and include headers
* Add missing SQL keywords to colorization list
* Fix Peek Definition\Go to Definition bug on SQL Server 2017

### Contributions and "thank you"
We would like to thank all our users who raised issues, and in particular the following users who helped contribute features or localization of the tool:
* [@praveenpi ](https://github.com/praveenpi) for `updated sql2016-crud-demo (#1156)`
* [@benrr101](https://github.com/benrr101) for `Fix for [#1178](https://github.com/Microsoft/vscode-mssql/issues/1178) by replacing all whitespace with non-breaking spaces. (#1181)`
* [@eashi](https://github.com/eashi) for `Use correct tag for gulp package (#1154)`
* [@shaun-hume](https://github.com/shaun-hume) for `Fix spelling errors in README.md (#1148)`
* [@bruce-dunwiddie ](https://github.com/bruce-dunwiddie) for `Fixed typo on serverproperty. (#1147)`
* [@franciscocpg ](https://github.com/franciscocpg) for `Adding support for antergos platform (#1144)`
* [@SebastianPfliegel](https://github.com/SebastianPfliegel) for `Added more saveAsCsv options (#1128)`
* [@mattmc3](https://github.com/mattmc3) for `Add missing keywords (#1133)`
* [@ChiragRupani](https://github.com/ChiragRupani) for `Added support for specifying delimiter while exporting query results as CSV (#1120)`
* [@zackschuster](https://github.com/zackschuster) for `fix typo in CHANGELOG.md (#1119)`

## What's new in 1.4.0
* Updated to .NET Core 2.1 to address [issues where some Mac users encountered connection errors](https://github.com/Microsoft/vscode-mssql/issues/1090)
* Added support for Deepin Linux
* Updated query results display to use VS Code's new webview API
* Added a new experimental setting "mssql.persistQueryResultTabs" which when set to true will save your scroll position and active selection when switching between query result tabs
  * Note that this option is false by default because it [may cause high memory usage](https://code.visualstudio.com/docs/extensions/webview#_retaincontextwhenhidden
  * If you use this option and have feedback on it please share it on our [GitHub page](https://github.com/Microsoft/vscode-mssql/issues/916).


### Contributions and "thank you"
We would like to thank all our users who raised issues, and in particular the following users who helped contribute features or localization of the tool:
* [@ChristianGrimberg](https://github.com/ChristianGrimberg) for adding support for Deepin Linux
* [@nschonni](https://github.com/nschonni) for closing issue [#704](https://github.com/Microsoft/vscode-mssql/issues/704) by adding a new TSQL formatter issue template
* We would like to thank everyone who contributed to localization for this update and encourage more people to join our [open source community localization effort](https://github.com/Microsoft/Localization/wiki).

## What's new in 1.3.1
* Fixed issue [#1036](https://github.com/Microsoft/vscode-mssql/issues/1036) where copy/pasting Unicode text can fail on Mac depending on the active locale environment variable
* Fixed issue [#1066](https://github.com/Microsoft/vscode-mssql/issues/1066) RAND() function using GO N produces the same result
* Syntax highlighting more closely matches SSMS for local variables, global system variables, unicode string literals, bracketed identifiers, and built in functions
* Show all error messages instead of just the first one when query execution results in multiple errors


### Contributions and "thank you"
We would like to thank all our users who raised issues, and in particular the following users who helped contribute features or localization of the tool:
* [@rhires](https://github.com/rhires) for updating and editing the Kerberos help documentation
* [@zackschuster](https://github.com/zackschuster) for cleaning up the VS Code API wrapper to remove a deprecated function call
* We would like to thank everyone who contributed to localization for this update and encourage more people to join our [open source community localization effort](https://github.com/Microsoft/Localization/wiki).

## What's new in 1.3.0
* Fixed an issue where peek definition and go to definition failed for stored procedures.
* Improved performance for peek definition and go to definition.
* Added support for `GO N` syntax.
* Fixed issue [#1025](https://github.com/Microsoft/vscode-mssql/issues/1025) where query execution would fail when executing from file paths containing special characters
* A community-contributed fix for snippets that failed on databases with case-sensitive collations.


## What's new in 1.2.1
* Support for multi-root workspaces in preparation for the feature's release in Visual Studio Code. When running with multi-root workspaces, users will be able to set many configuration options at the folder level, including connection configurations.
* Exporting results as CSV, JSON, or Excel files now shows the operating system's save-as dialog instead of using text-based dialogs to name the saved file.
* Fixed issue [#998](https://github.com/Microsoft/vscode-mssql/issues/998) IntelliSense against Azure SQL DBs very inconsistent.


## What's new in 1.2
* Support for macOS High Sierra.
* VSCode-Insiders users will see their connections are now read from and saved to the Insiders settings file instead of the regular Visual Studio Code location. Fixes [#242](https://github.com/Microsoft/vscode-mssql/issues/242).
* Saving connections no longer affects comments in the settings file [#959](https://github.com/Microsoft/vscode-mssql/issues/959).
* IntelliSense errors and suggestions can be disabled on a per-file basis [#978](https://github.com/Microsoft/vscode-mssql/issues/978). Use the `MS SQL: Choose SQL Handler for this file` action or click on the `MSSQL` status bar item when a .sql file is open to disable IntelliSense on that document.
* Fixed issue [#987](https://github.com/Microsoft/vscode-mssql/issues/987) Cannot change password of a saved profile.
* Fixed issue [#924](https://github.com/Microsoft/vscode-mssql/issues/924) Database name with $ is not showing up correctly in database list.
* Fixed issue [#949](https://github.com/Microsoft/vscode-mssql/issues/949) Drop database fails most of the time because the db is in used.
* Fixed issue `MS SQL: Execute Current Statement` where it did not handle 2 statements on a single line correctly.
* Improved support for SQL Server 2017 syntax by refreshing IntelliSense and SMO dependencies.

### Contributions and "thank you"
We would like to thank everyone who contributed to localization for this update and encourage more people to join our [open source community localization effort](https://github.com/Microsoft/Localization/wiki).
mssql for Visual Studio Code was opened for community localization since February 2017 for the following languages French, Italian, German, Spanish, Simplified or Traditional Chinese, Japanese, Korean, Russian, Brazilian Portuguese.
If you see a string untranslated in your language, you can make an impact and help with translation. You can find out how by checking https://aka.ms/crossplattoolsforsqlservercommunitylocalization.


## What's new in 1.1
* Preview support for Integrated Authentication (aka Windows Authentication) on Mac and Linux. To use this you need to create a Kerberos ticket on your Mac or Linux machine - [see this guide](https://aka.ms/vscode-mssql-integratedauth) for the simple process. Once this is set up, you can say goodbye to SQL passwords when connecting to your servers!
  * This feature is in preview in .Net Core 2.0. The [corefx repository](https://github.com/dotnet/corefx) tracks issues related to SqlClient and we recommend issues setting up Kerberos tickets be raised there.
  * macOS "El Capitan" and older versions will not support this feature or any other features requiring a new SqlToolsService version. To benefit from Integrated Authentication, "Execute Current Statement" and other new features we recommend updating to the latest OS version.
* New code snippets:
  * `sqlGetSpaceUsed` shows space used by tables. Thanks to Rodolfo Gaspar for this contribution!
  * `sqlListColumns` shows columns for tables matching a `LIKE` query. Thanks to Emad Alashi for this contribution!
* Support for connecting using a connection string. When adding a connection profile you can now paste in an ADO.Net connection string instead of specifying server name, database name etc. individually. This makes it easy to get strings from the Azure Portal and use them in the tool.
* Support for empty passwords when connecting. Password is no longer required, though still recommended! This is useful in local development scenarios.
* Improved support for SQL Server 2017 syntax by refreshing IntelliSense and SMO dependencies.
* Fixed all code snippets so that tab ordering is improved and snippets no longer have syntax errors
* Fixed issue where snippets were not shown when `mssql.intelliSense.enableIntelliSense` was set to `false`.
* Fixed issue [#911](https://github.com/Microsoft/vscode-mssql/issues/911) where tools service crashed when Perforce source code provider is enabled in the workspace.
* Stability fixes to reduce the likelihood of SqlToolsService crashes.
* Fixed issue [#870](https://github.com/Microsoft/vscode-mssql/issues/870). Added an "Execute Current Statement" command that executes only the SQL statement where the cursor is currently located.
* Fix issue [#939](https://github.com/Microsoft/vscode-mssql/issues/939) "Show execution time for individual batches". To enable open your settings and set `mssql.showBatchTime` to `true`.
* Fix issue [#904](https://github.com/Microsoft/vscode-mssql/issues/904). Added a "Disconnect" option to the status bar server connection shortcut. Clicking on this now lists databases on the current server and a "Disconnect" option.
* Fix issue [#913](https://github.com/Microsoft/vscode-mssql/issues/913). OpenSuse Linux distributions are now supported.

### Contributions and "thank you" for 1.1
We would like to thank all our users who raised issues, and in particular the following users who helped contribute features or localization of the tool:
* Rodolfo Gaspar and Emad Alashi for their new code snippet contributions.
* The many contributors to our community localization. Please see the [full contributors list](https://aka.ms/crossplattoolsforsqlserverloccontributors).  Particular thanks to Mona Nasr for coordinating our community localization efforts and the following top contributors per language.
  *	Brazilian Portuguese: Bruno Sonnino, Roberto Fonseca
  *	Chinese Simplified: Ji Zhao, Alan Tsai
  *	Chinese Traditional: Ji Zhao, Alan Tsai
  *	French: Antoine Griffard
  *	German: Christian Gräfe, Carsten Kneip
  *	Italian: Piero Azi, Aldo Donetti
  *	Japanese : Yosuke Sano,Takayoshi Tanaka
  *	Korean: Ji Yong Seong, Ian Y. Choi
  *	Russian: Natalia Lubskaya, Illirik Smirnov
  *	Spanish: Andy Gonzalez, Alberto Poblacion

## What's new in 1.0
* We are pleased to announce the official GA of the MSSQL extension! This release focuses on stability, localization support, and top customer feedback issues
* The MSSQL extension is now localized. Use the `Configure Language` command in VSCode to change to your language of choice. Restart the application and the MSSQL extension will now support your language for all commands and messages.
* Community-added support for `Save as Excel`, which supports saving to .xlsx format and opening this in the default application for .xlsx files on your machine.
* Numerous bug fixes:
  * IntelliSense improvements to support configuration of IntelliSense options from user settings, plus keyword fixes.
  * Query Execution fixes and improvements: [#832](https://github.com/Microsoft/vscode-mssql/issues/832), [#815](https://github.com/Microsoft/vscode-mssql/issues/815), [#803](https://github.com/Microsoft/vscode-mssql/issues/803), [#794](https://github.com/Microsoft/vscode-mssql/issues/794), [#772](https://github.com/Microsoft/vscode-mssql/issues/772)
  * Improved support for downloading and installing the tools service behind proxies
  * Improvements to `Go To Definition` / `Peek Definition` support [#769](https://github.com/Microsoft/vscode-mssql/issues/769)


### Contributions and "thank you"
We would like to thank all our users who raised issues, and in particular the following users who helped contribute features or localization of the tool:
* Wujun Zhou, for adding the `Save as Excel` feature
* The many contributors to our community localization discussed on [this TechNet post](https://blogs.technet.microsoft.com/dataplatforminsider/2017/04/13/crossplatform-tools-for-sql-server-opened-for-community-localization/). Please see the [full contributors list](https://aka.ms/crossplattoolsforsqlserverloccontributors).  Particular thanks to Mona Nasr for coordinating our community localization efforts and the following top contributors per language.
  *	Brazilian Portuguese: Bruno Sonnino, Roberto Fonseca
  *	Chinese Simplified: Geng Liu, Alan Tsai
  *	Chinese Traditional: Wei-Ting Shih, Alan Tsai
  *	French: Antoine Griffard, Bruno Lewin
  *	German: Jens Suessmeyer, Thomas Hütter
  *	Italian: Cristiano Gasparotto, Sergio Govoni
  *	Japanese Rio Fujita, Tanaka_733
  *	Korean: Jungsun Kim, Eric Kang
  *	Russian: Alekesy Nemiro, Anatoli Dubko
  *	Spanish: Christian Eduardo Palomares Peralta, Daniel Canton


## What's new in 0.3.0
* T-SQL formatting support is now included. This is a highly requested feature, and this release includes a basic parser
with configuration options for some of the most common T-SQL formatting styles.
  * To format a .sql file, right-click and choose `Format Document`.
  * To format part of a document, highlight a selection, right-click and choose `Format Selection`
  * To change the formatting settings, hit F1 and choose `Preferences: Open User Settings`. Type in `mssql.format` and
  change any of the options
* `Refresh IntelliSense Cache` command added. This will rebuild the IntelliSense for a connected database to include any recent
schema changes
* `New Query` command added. This opens a new .sql file and connects to a server, making it quicker to get started with your queries
* Fixed support for SQL Data Warehouse connections.
* Prototype localization support added. We will be adding full localization support in a future update.
* Improved Peek Definition support. Multiple bug fixes, and additional supported types.
  * Supported types: Tables, Views, Procedures, User Defined Tables, User Defined Types, Synonyms, Scalar Functions, Table Valued Functions
* Support for Windows x86 machines
* Fix for issue [#604](https://github.com/Microsoft/vscode-mssql/issues/604) where results that included HTML were not rendered correctly
* Multiple fixes for syntax highlighting
* Fixed issues where query execution failed due to parser failures.

## What's new in 0.2.1
* HotFix for issue [#669] "Results Panel not Refreshing Automatically". This issue impacts users on VSCode 1.9.0 or greater.

## What's new in 0.2.0
* Peek Definition and Go To Definition support for Tables, Views and Stored Procedures.
  * For a query such as `select * from dbo.Person` you can right-click on `Person` and see it as a `CREATE TABLE` script.
  * Note: you must be connected to a database to use this feature.
* Support for additional operating systems including Linux Mint and Elementary OS. See [Operating Systems] for the list of supported OSes.IntelliSense
* Multiple improvements & fixes to the results view, IntelliSense handling, and service installation notification.
* Improved logging to the Output window. Errors and status notifications can be viewed in the SqlToolsService or MSSQL channels.
* For a full list see the [change log].

## Using

* First, install [Visual Studio Code] then install **mssql** extension by pressing **F1** or **ctrl+shift+p** to open command palette, select **Install Extension** and type **mssql**.
    * For macOS, you will need to install OpenSSL. Follow the install pre-requisite steps from [DotNet Core instructions].
* Open an existing file with a .sql file extension or open a new text file (**ctrl+n**) and change the language mode to SQL by pressing **ctrl+k,m** and select **SQL**. **mssql** commands and functionalities are enabled in the SQL language mode in Visual Studio Code editor.
* Create a new connection profile using command palette by pressing **F1**, type **sqlman** to run **MS SQL: Manage Connection Profile** command. Select **Create**. See [manage connection profiles] for more information about how to create and edit connection profiles in your User Settings (settings.json) file.
* Connect to a database by pressing **F1** and type **sqlcon** to run **MS SQL: Connnect** command, then select a connection profile. You can also use a shortcut (**ctrl+shift+c**).
* Write T-SQL script in the editor using IntelliSense and Snippets. Type **sql** in the editor to list T-SQL Snippets.
* Execute T-SQL script or selection of statements in the script by pressing **F1** and type **sqlex** to run **MS SQL: Execute Query** command. You can also use a shortcut (**ctrl+shift+e**). See [customize shortcuts] to learn about change shortcut key bindings to **mssql** commands.
* View the T-SQL script execution results and messages in result view.

## Commands
The extension provides several commands in the Command Palette for working with ```.sql``` files:
* **MS SQL: Connect** to SQL Server, Azure SQL Database or SQL Data Warehouse using connection profiles or recent connections.
    * **Create Connection Profile** to create a new connection profile and connect.
* **MS SQL: Disconnect** from SQL Server, Azure SQL Database or SQL Data Warehouse in the editor session.
* **MS SQL: Use Database** to switch the database connection to another database within the same connected server in the editor session.
* **MS SQL: Execute Query** script, T-SQL statements or batches in the editor.
* **MS SQL: Cancel Query** execution in progress in the editor session.
* **MS SQL: Manage Connection Profiles**
    * **Create** a new connection profile using command palette's step-by-step UI guide.
    * **Edit** user settings file (settings.json) in the editor to manually create, edit or remove connection profiles.
    * **Remove** an existing connection profile using command palette's step-by-step UI guide.
    * **Clear Recent Connection List** to clear the history of recent connections.

## Options
The following Visual Studio Code settings are available for the mssql extension. These can be set in user preferences (cmd+,) or workspace settings ```(.vscode/settings.json)```.
See [customize options] and [manage connection profiles] for more details.

```javascript
{
    "mssql.maxRecentConnections": 5,
    "mssql.connections":[],
    "mssql.shortcuts": {
        "event.toggleResultPane": "ctrl+alt+r",
        "event.toggleMessagePane": "ctrl+alt+y",
        "event.prevGrid": "ctrl+up",
        "event.nextGrid": "ctrl+down",
        "event.copySelection": "ctrl+c",
        "event.maximizeGrid": "",
        "event.selectAll": "",
        "event.saveAsJSON": "",
        "event.saveAsCSV": "",
        "event.saveAsExcel": ""
    },
    "mssql.messagesDefaultOpen": true,
    "mssql.logDebugInfo": false,
    "mssql.saveAsCsv.includeHeaders": true,
    "mssql.saveAsCsv.delimiter": ",",
    "mssql.saveAsCsv.lineSeparator": null,
    "mssql.saveAsCsv.textIdentifier": "\"",
    "mssql.saveAsCsv.encoding": "utf-8",
    "mssql.intelliSense.enableIntelliSense": true,
    "mssql.intelliSense.enableErrorChecking": true,
    "mssql.intelliSense.enableSuggestions": true,
    "mssql.intelliSense.enableQuickInfo": true,
    "mssql.intelliSense.lowerCaseSuggestions": false,
    "mssql.resultsFontFamily": "-apple-system,BlinkMacSystemFont,Segoe WPC,Segoe UI,HelveticaNeue-Light,Ubuntu,Droid Sans,sans-serif",
    "mssql.resultsFontSize": 13,
    "mssql.copyIncludeHeaders": false,
    "mssql.copyRemoveNewLine" : true,
    "mssql.splitPaneSelection": "next",
    "mssql.format.alignColumnDefinitionsInColumns": false,
    "mssql.format.datatypeCasing": "none",
    "mssql.format.keywordCasing": "none",
    "mssql.format.placeCommasBeforeNextStatement": false,
    "mssql.format.placeSelectStatementReferencesOnNewLine": false,
    "mssql.applyLocalization": false,
    "mssql.query.displayBitAsNumber": true,
    "mssql.persistQueryResultTabs": false
}
```

## Change Log
The current version is ```1.8.0```. See the [change log] for a detailed list of changes in each version.

## Supported Operating Systems

Currently this extension supports the following operatings systems:

* Windows (64-bit only)
* macOS
* Ubuntu 14.04 / Linux Mint 17 / Linux Mint 18 / Elementary OS 0.3
* Ubuntu 16.04 / Elementary OS 0.4
* Debian 8.2
* CentOS 7.1 / Oracle Linux 7
* Red Hat Enterprise Linux (RHEL)
* Fedora 23
* OpenSUSE 13.2

## Offline Installation
The extension will download and install a required SqlToolsService package during activation. For machines with no Internet access, you can still use the extension by choosing the
`Install from VSIX...` option in the Extension view and installing a bundled release from our [Releases](https://github.com/Microsoft/vscode-mssql/releases) page.
Each operating system has a .vsix file with the required service included. Pick the file for your OS, download and install to get started.
We recommend you choose a full release and ignore any alpha or beta releases as these are our daily builds used in testing.

## Support
Support for this extension is provided on our [GitHub Issue Tracker]. You can submit a [bug report], a [feature suggestion] or participate in [discussions].

## Contributing to the Extension
See the [developer documentation] for details on how to contribute to this extension.

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct]. For more information see the [Code of Conduct FAQ] or contact [opencode@microsoft.com] with any additional questions or comments.

## Privacy Statement
The [Microsoft Enterprise and Developer Privacy Statement] describes the privacy statement of this software.

## License
This extension is [licensed under the MIT License]. Please see the [third-party notices] file for additional copyright notices and license terms applicable to portions of the software.

[the mssql extension tutorial]:https://aka.ms/mssql-getting-started
[the SQL Developer tutorial]: http://aka.ms/sqldev
[Visual Studio Code]: https://code.visualstudio.com/#alt-downloads
[DotNet Core instructions]:https://www.microsoft.com/net/core
[manage connection profiles]:https://github.com/Microsoft/vscode-mssql/wiki/manage-connection-profiles
[customize shortcuts]:https://github.com/Microsoft/vscode-mssql/wiki/customize-shortcuts
[customize options]:https://github.com/Microsoft/vscode-mssql/wiki/customize-options
[change log]: https://github.com/Microsoft/vscode-mssql/blob/master/CHANGELOG.md
[GitHub Issue Tracker]:https://github.com/Microsoft/vscode-mssql/issues
[bug report]:https://github.com/Microsoft/vscode-mssql/issues/new
[feature suggestion]:https://github.com/Microsoft/vscode-mssql/issues/new
[developer documentation]:https://github.com/Microsoft/vscode-mssql/wiki/contributing
[Microsoft Enterprise and Developer Privacy Statement]:https://go.microsoft.com/fwlink/?LinkId=786907&lang=en7
[licensed under the MIT License]: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
[third-party notices]: https://github.com/Microsoft/vscode-mssql/blob/master/ThirdPartyNotices.txt
[Microsoft Open Source Code of Conduct]:https://opensource.microsoft.com/codeofconduct/
[Code of Conduct FAQ]:https://opensource.microsoft.com/codeofconduct/faq/
[opencode@microsoft.com]:mailto:opencode@microsoft.com
[#669]:https://github.com/Microsoft/vscode-mssql/issues/669

