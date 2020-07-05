# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.9.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.9.0-alpha.5...v1.9.0) (2020-05-20)

**Note:** Version bump only for package code-spell-checker





# [1.9.0-alpha.5](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.8.0...v1.9.0-alpha.5) (2020-05-17)

### Bug Fixes


### Features

* Custom Dictionaries ([#482](https://github.com/streetsidesoftware/vscode-spell-checker/issues/482)) ([075ec87](https://github.com/streetsidesoftware/vscode-spell-checker/commit/075ec875fab13a6912529c067c0f85e2ba3f5e67))

## Defining the workspace root path

* `workspaceRootPath` - By default, the workspace root path matches the first folder listed in the
  workspace. If a `cspell.json` exists at the workspace root, it will be used and merged with any folder level
  `cspell.json` files found.

Note: the reason behind this change was to make the behaviour in multi-root workspace more predictable.

### Example
```jsonc
"cSpell.workspaceRootPath": "${workspaceFolder:client}/.."
```

## Custom Dictionaries

It is now possible to tell the extension to use custom dictionaries. Three new configuration settings have been added.
* `customUserDictionaries` - for defining custom user level dictionaries
* `customWorkspaceDictionaries` - for defining custom workspace level dictionaries
* `customFolderDictionaries` - for defining custom folder level dictionaries

Custom dictionaries can be either a dictionary reference (name of a defined dictionary) or a dictionary definition.

### User Example
``` jsonc
"cSpell.customUserDictionaries": [
  {
    "name": "my words",     // name of dictionary (should be unique)
    "description": "These are the words I use in all projects.",
    "path": "~/custom-words.txt",
    "addWords": true        // Add Word to User Dictionary will add words to this file.
  },
  {
    "name": "company terms",
    "description": "These are terms used by my company.",
    "path": "~/gist/company-terms/company-terms.txt",
    "addWords": false        // Do not add to the company terms.
  }
]
```

### Workspace Example:
``` jsonc
"cSpell.customWorkspaceDictionaries": [
  {
    "name": "project words",  // name of dictionary (should be unique)
    "description": "These are words for this project.",
    // Relative to the "client" folder in the workspace.
    "path": "${workspaceFolder:client}/project-words.txt",
    "addWords": true          // Add Word to Workspace Dictionary will add words to this file.
  }
]
```

### Folder Example:
``` jsonc
"cSpell.customFolderDictionaries": [
  {
    "name": "folder words",   // name of dictionary (should be unique)
    "description": "These are words for this project.",
    // Relative to the current folder in the workspace.
    "path": "${workspaceFolder}/folder-words.txt",
    "addWords": false         // Do NOT add to folder words.
  },
  {
    "name": "project words",  // name of dictionary (should be unique)
    "description": "These are words for this project.",
    // Relative to the "client" folder in the workspace.
    "path": "${workspaceFolder:client}/project-words.txt",
    "addWords": true          // Add Word to Workspace Dictionary when adding folder words.
  }
]
```

### Example with a dictionary reference

`cspell.json`
``` jsonc
"dictionaryDefinitions": [
    {
        "name": "cities",
        "path": "./sampleDictionaries/cities.txt"
    },
    {
        "name": "project-terms",
        "path": "./words.txt"
    }
]
```

VS Code `settings.json`
``` jsonc
"cSpell.customWorkspaceDictionaries": ["project-terms"]
```

### Custom Dictionary Paths

Dictionary paths can be absolute or relative based upon the following patterns:

* `~` - relative to the user home directory
* `.` - relative to current workspace folder
* `${workspaceRoot}` or `${root}` - relative to the `workspaceRootPath`
* `${workspaceFolder}` - relative to the first folder in the workspace
* `${workspaceFolder:[folder name]}` - `[folder name]` is one of the folders in the workspace. i.e `${workspaceFolder:client}`

## Adding words to Dictionaries

### Editor Context Menu (right-click)

The menu options in the Context Menu change based upon the workspace configuration.
They are made visible by the setting: `cSpell.showCommandsInEditorContextMenu`

1. `Add Word to Folder Dictionary` -- shows only if a workspace with more than one folder is open
1. `Add Word to Workspace Dictionary` -- shows if a folder or workspace is open
1. `Add Word to User Dictionary` -- always shows, add the word to the User's dictionary

## Commands
These can be bound to keyboard shortcuts.

1. `Enable Spell Checking by Default` - enables the spell checker if it has been disabled.
    * Command: `cSpell.enableForGlobal`
1. `Disable Spell Checker by Default` - disables the spell checker.
    * Command: `cSpell.disableForGlobal`


# [1.8.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.24...v1.8.0) (2020-02-23)

Performance enhancements and a few features.

## `enableFiletypes`
Fixes [#408](https://github.com/streetsidesoftware/vscode-spell-checker/issues/408) :
A new setting `enableFiletypes` will add the listed filetypes to `enableLanguageIds`.

Example:

```json
"cSpell.enableFiletypes": [
  "jupyter", "kotlin", "kotlinscript", "!json"
]
```

will **enable** Jupyter, Kotlin, KotlinScript and **disable** JSON files.

## `${workspaceFolder}` substitution in paths and globs

Relative paths were difficult to get working when specified in VS Code settings. It wasn't clear what they should be relative to. Relative paths to a `cspell.json` files are clear.

It is now possible to have the following setting in VS Code preferences.

```json
"cSpell.import": [
  "${workspaceFolder}/node_modules/company_standards/cspell.json"
]
```

for a multiroot with folders `client`, `server`, `common`, it is possible to specify the name of the folder:

```json
"ignorePaths": [
  "${workspaceFolder:client}/**/*.json"
],
"cSpell.import": [
  "${workspaceFolder:server}/node_modules/company_standards/cspell.json"
],
"cSpell.dictionaryDefinitions": [
  {
    "name": "Company Terms",
    "path": "${workspaceFolder:common}/dictionaries/terms.txt"
  }
],
"cSpell.dictionaries": ["Company Terms"]
```

### Bugs

Fixes [can't enable and disable without reloading window · Issue [#384](https://github.com/streetsidesoftware/vscode-spell-checker/issues/384)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/384)

### Features

* Support enableFileTypes ([#439](https://github.com/streetsidesoftware/vscode-spell-checker/issues/439)) ([2fde3bc](https://github.com/streetsidesoftware/vscode-spell-checker/commit/2fde3bc5c658ee51da5a56580aa1370bf8174070))

* Support `${workspaceFolder}` substitution ([6d1dfbc](https://github.com/streetsidesoftware/vscode-spell-checker/commit/6d1dfbcb007875100adb897447bf1690e90ef1f1))

* Upgrade to latest cspell library and schema ([#440](https://github.com/streetsidesoftware/vscode-spell-checker/issues/440)) ([4bcff60](https://github.com/streetsidesoftware/vscode-spell-checker/commit/4bcff6013edd742af7a920ddd0703a66b703cf30))

* Upgrade to vscode-languageserver 6 ([2ec3ffa](https://github.com/streetsidesoftware/vscode-spell-checker/commit/2ec3ffaa96779abb3ea380f4a6d074228e560429))

* **copy:** change the language of the tool tip ([09949e4](https://github.com/streetsidesoftware/vscode-spell-checker/commit/09949e4bdc08cca5ff30d750a58c19bf1c6c3f31))


## [1.7.24](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.24-alpha.1...v1.7.24) (2020-02-19)


### Bug Fixes

* Update cspell and other packages ([2a12c03](https://github.com/streetsidesoftware/vscode-spell-checker/commit/2a12c03f88babf9ba38a76b2ab5e54215f9436af))


## [1.7.24-alpha.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.24-alpha.0...v1.7.24-alpha.1) (2020-02-18)

**Note:** Version bump only for package code-spell-checker

## [1.7.24](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.23...v1.7.24) (2020-02-18)

### Bug Fixes

* Try to detect some common bad regex patterns and fix them. ([822da97](https://github.com/streetsidesoftware/vscode-spell-checker/commit/822da97449e90b4dc4da3a3cf14611215ee05e09))

## [1.7.23](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.23-alpha.2...v1.7.23) (2020-02-15)

## [1.7.23-alpha.2](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.23-alpha.1...v1.7.23-alpha.2) (2020-02-15)

### Bug Fixes

* clean up CodeAction logging to reduce noise ([136a0e2](https://github.com/streetsidesoftware/vscode-spell-checker/commit/136a0e24f7c0517b5c3abf8ecb29f63d05fa1f29))

## [1.7.23-alpha.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.23-alpha.0...v1.7.23-alpha.1) (2020-02-09)

### Bug Fixes

* fix lint issues in _server, client, and _settingsViewer ([bc4fb44](https://github.com/streetsidesoftware/vscode-spell-checker/commit/bc4fb44e948e1e6453fc222140642f573b8d7731))

## [1.7.23-alpha.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.22...v1.7.23-alpha.0) (2020-02-09)

## [1.7.22](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.21...v1.7.22) (2020-01-26)

# Older Release Notes

## [1.7.21](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.7.20...v1.7.21) (2020-01-18)
- Add support for [Remote Development](https://docs.microsoft.com/en-us/visualstudio/online/how-to/vscode#self-hosted)

## [1.7.20](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.7.19...1.7.20) (2019-11-06)

## [1.7.19](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.17...1.7.19) (2019-11-06)## [1.7.18]
- Extension now reads `.cspell.json` files for configuration if they exist.
- Added basic support for Haskell.
- `overrides` now work as expected.  See: [cspell Overrides](https://github.com/streetsidesoftware/cspell/tree/master/packages/cspell#overrides)

## [1.7.17](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.16...v1.7.17) (2019-06-12)

## [1.7.16](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.15...v1.7.16) (2019-06-03)
- Fix [Error - validateTextDocument · Issue [#351](https://github.com/streetsidesoftware/vscode-spell-checker/issues/351)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/351)

## [1.7.15](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.14...v1.7.15) (2019-06-03)
- Fix [Multiple misspelled words in a file cause "on save" actions to time out · Issue [#349](https://github.com/streetsidesoftware/vscode-spell-checker/issues/349)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/349)

## [1.7.14](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.13...v1.7.14) (2019-06-03)

## [1.7.13](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.12...v1.7.13) (2019-05-28)
- Disable snippets until they can be configured.
- Update `cspell` library to get the latest English dictionary and some performance improvements.

## [1.7.12](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.11...v1.7.12) (2019-05-27)
- Add snippets to make it easier to add cspell settings to a doc.
- Turn on `git-commit` by default so git commit messages can be spell checked without changing the settings.

## [1.7.11](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.10...v1.7.11) (2019-05-26)
- Fix [Chinese word in two English words should not be hinted. · Issue [#291](https://github.com/streetsidesoftware/vscode-spell-checker/issues/291)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/291)
- Fix [Does not check Japanese prolonged sound mark · Issue [#253](https://github.com/streetsidesoftware/vscode-spell-checker/issues/253)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/253)
- Fix [Support spell checking for English words amongst an unsupported language · Issue [#286](https://github.com/streetsidesoftware/vscode-spell-checker/issues/286)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/286)

## [1.7.10](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.9...v1.7.10) (2019-05-12)
- Bundle the VS Code side of the extension in to a single `.js` file. This should address:
  - [Extension causes high cpu load · Issue [#309](https://github.com/streetsidesoftware/vscode-spell-checker/issues/309)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/309)
  - [Extension causes high cpu load · Issue [#339](https://github.com/streetsidesoftware/vscode-spell-checker/issues/339)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/339)

## [1.7.9](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.8...v1.7.9) (2019-05-06)
- Updated `cspell` and dictionaries.
  - Fixes [Connectedness not recognized · Issue [#325](https://github.com/streetsidesoftware/vscode-spell-checker/issues/325)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/325)
- Make sure `cspell.json` is updated through the configuration UI settings.

## [1.7.8](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.7...v1.7.8) (2019-05-05)
- Fix ["No Code Action Available" when using SFTP · Issue [#332](https://github.com/streetsidesoftware/vscode-spell-checker/issues/332)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/332)
- Experiment: have spelling correction use VS Code rename provider. This can be enabled with the following user setting:
  ```
      "cSpell.fixSpellingWithRenameProvider": true
  ```

## [1.7.7](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.6...v1.7.7) (2019-05-05)
- Fix [Ignore paths not working? · Issue [#311](https://github.com/streetsidesoftware/vscode-spell-checker/issues/311)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/311)
- **Breaking Change:** `cspell.json` settings will take precedence over settings found in VS Code.
  The logic is that a `cspell.json` can be used for CI/CD processing while VS Code settings cannot.
  This is a change from previous version. This only applies if you use `cspell.json` files.
- Fix an issue where the available dictionaries were not showing up in the configuration screen if a file wasn't selected.
- Add UI to ignore words -- [Option to ignore words · Issue [#146](https://github.com/streetsidesoftware/vscode-spell-checker/issues/146)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/146)

## [1.7.6](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.5...v1.7.6) (2019-05-05)
- Make the Quick Fix menu and Context menu workspace aware.
- [Add configuration to hide the right-click menu. · Issue [#336](https://github.com/streetsidesoftware/vscode-spell-checker/issues/336)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/336)

## [1.7.5](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.4...v1.7.5) (2019-04-25)
- Make all spelling suggestions available via the quick-fix menu. Related to
  [Quick actions stop functioning after clicking result form Problem window · Issue [#283](https://github.com/streetsidesoftware/vscode-spell-checker/issues/283)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/283)
  and [Feedback on VS Code proposed Code Action Auto Fix APIs · Issue [#297](https://github.com/streetsidesoftware/vscode-spell-checker/issues/297)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/297)

## [1.7.4](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.3...v1.7.4) (2019-04-24)
- Fix [cspell throws error when languageId is missing from languageSettings. · Issue [#333](https://github.com/streetsidesoftware/vscode-spell-checker/issues/333)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/333)

## [1.7.3](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.2...v1.7.3) (2019-04-24)

## [1.7.2](https://github.com/streetsidesoftware/vscode-spell-checker/compare/v1.7.0...v1.7.2) (2019-04-24)
- Fix [1.7.0 no longer reads cSpell.json from root of workspace · Issue [#330](https://github.com/streetsidesoftware/vscode-spell-checker/issues/330)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/330)

## 1.7.1
- Fix [Change cSpell.enabledLanguageIds `yml` to `yaml` · Issue [#322](https://github.com/streetsidesoftware/vscode-spell-checker/issues/322)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/322)
- Update to the latest version of `cspell` to update the dictionaries.
- Support `java` by default.
- Reduce the overall size of the extension.

## [1.7.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.10...v1.7.0) (2019-04-19)
- [Upgrade to VS Code's webview API · Issue [#281](https://github.com/streetsidesoftware/vscode-spell-checker/issues/281)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/281)
- Update the cspell library
- Update the dictionaries

## [1.6.10](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.9...1.6.10) (2018-05-02)
- [Fixes and issue where the status bar foreground color did not match theme [#269](https://github.com/streetsidesoftware/vscode-spell-checker/issues/269)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/269)
- [compact problem items listings [#267](https://github.com/streetsidesoftware/vscode-spell-checker/issues/267)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/267)

## [1.6.9](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.7...1.6.9) (2018-04-22)
- [spell checker checks spelling on git version of files [#214](https://github.com/streetsidesoftware/vscode-spell-checker/issues/214)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/214)

## 1.6.8
- [[Live Share] Restricting language services to local files [#209](https://github.com/streetsidesoftware/vscode-spell-checker/issues/209)](https://github.com/streetsidesoftware/vscode-spell-checker/pull/209)
- Update the cSpell library.

## [1.6.7](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.6...1.6.7) (2018-04-15)
* Fix [cSpell.json overwritten with commented json on word add. [#206](https://github.com/streetsidesoftware/vscode-spell-checker/issues/206)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/206)
- Fix an issue with matching too much text for a url:
  [Misspelled first word after HTML element with absolute URL is not detected [#201](https://github.com/streetsidesoftware/vscode-spell-checker/issues/201)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/201)
- [Better LaTeX support](https://github.com/streetsidesoftware/vscode-spell-checker/issues/167#issuecomment-373682530)
- Ignore SHA-1, SHA-256, SHA-512 hashes by default
- Ignore HTML href urls by default.

## [1.6.6](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.5...1.6.6) (2018-04-07)
* Expose the setting to limit the number of repeated problems.

  To set it:
  * In the VS Code settings:

    ```
    "cSpell.maxDuplicateProblems": 5,
    ```

  * In a cspell.json file:

    ```
    "maxDuplicateProblems": 5,
    ```
  See: [Combine repeated unknown words in Problems tab [#194](https://github.com/streetsidesoftware/vscode-spell-checker/issues/194)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/194)

* Turn on support for AsciiDocs by default. See: [Enable AsciiDocs by default](https://github.com/streetsidesoftware/vscode-spell-checker/pull/196)
* Update the English Dictionary
* Added a command to remove words added to the user dictionary
   `F1` `Remove Words from `...
   ![image](https://user-images.githubusercontent.com/3740137/38453511-3397299a-3a57-11e8-94af-4f46ecb544dc.png)
   See: [How to remove word from dictionary? [#117](https://github.com/streetsidesoftware/vscode-spell-checker/issues/117)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/117)

## [1.6.5](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.6.0...1.6.5) (2018-02-26)
* Add support for [Visual Studio Live Share](https://aka.ms/vsls), pull request: [Adding support for Visual Studio Live Share [#191](https://github.com/streetsidesoftware/vscode-spell-checker/issues/191)](https://github.com/streetsidesoftware/vscode-spell-checker/pull/191)

## 1.6.4
* Add support for Rust
* Improve LaTeX support.

## 1.6.3
* Improve LaTex support, special thanks to [James Yu](https://github.com/James-yu)
* Add ability to disable checking a line: `cspell:disable-line`
* Add ability to disable the next line: `cspell:disable-next`

## 1.6.2
* Reduce the size of the extension by excluding automatic test files.

## 1.6.1
* Fix: [bug: no spell checking when there's no folder opened [#162](https://github.com/streetsidesoftware/vscode-spell-checker/issues/162)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/162)
* Fix: [Incorrectly flagged words [#160](https://github.com/streetsidesoftware/vscode-spell-checker/issues/160)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/160)

# [1.6.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.5.0...1.6.0) (2017-12-10)
* Release of Multi-Root Support
* Fixes to support windows.

## 1.5.1
* Rollback of Multi-Root support due to issue with Windows.

# [1.5.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.2...1.5.0) (2017-11-24)

* Added Multi-Root Support [Support VSCode Multi Root Workspace [#145](https://github.com/streetsidesoftware/vscode-spell-checker/issues/145)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/145)
* Address issue with delay: [cSpell.spellCheckDelayMs seems to be ignored [#155](https://github.com/streetsidesoftware/vscode-spell-checker/issues/155)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/155)

## 1.4.12

* Speed up suggestions.

## [1.4.11](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.10...v1.4.11) (2017-10-28)

* Improve suggests for words with accents.
* Improve spell checking on compound words.

## [1.4.10](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.9...1.4.10) (2017-10-12)

* Allow the diagnostic level to be configured. In reference to [Highlight color [#128](https://github.com/streetsidesoftware/vscode-spell-checker/issues/128)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/128) and [disable scrollbar annotations [#144](https://github.com/streetsidesoftware/vscode-spell-checker/issues/144)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/144)

## [1.4.9](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.8...1.4.9) (2017-10-12)

* Make it easier to add ignore words to the settings. [Option to ignore words [#146](https://github.com/streetsidesoftware/vscode-spell-checker/issues/146)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/146)

## [1.4.8](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.7...1.4.8) (2017-10-11)

* The spell checker will now give reasonable suggestions for compound words. Related to [allowCompoundWords only validates two words [#142](https://github.com/streetsidesoftware/vscode-spell-checker/issues/142)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/142)
* Fixed [Words in the forbidden list are being shown as suggested spelling corrections [#89](https://github.com/streetsidesoftware/vscode-spell-checker/issues/89)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/89)

## [1.4.7](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.6...1.4.7) (2017-10-07)

* Improved the support for compound words with languages like Dutch and German. This is still a work in progress.
* Enable spell checking longer word compounds like: networkerrorexecption. Related to [allowCompoundWords only validates two words [#142](https://github.com/streetsidesoftware/vscode-spell-checker/issues/142)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/142)

## [1.4.6](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.5...1.4.6) (2017-10-03)

* Fix issue [Add all words in the current document to dictionary [#59](https://github.com/streetsidesoftware/vscode-spell-checker/issues/59)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/59)
  This is now possible by selecting the words you want to add and right click to choose which dictionary to add them to.

## [1.4.2 - 1.4.5](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.4.0...1.4.5) (2017-10-03)

* Patch to fix issue with detecting changes to settings files.
* Fix issue [Spawns too many "find" processes [#143](https://github.com/streetsidesoftware/vscode-spell-checker/issues/143)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/143)
* Possible fix for [CPU usage extremely high, on close memory usage skyrockets [#77](https://github.com/streetsidesoftware/vscode-spell-checker/issues/77)](https://github.com/streetsidesoftware/vscode-spell-checker/issues/77)

## 1.4.1

* Fix part of issue [#74](https://github.com/streetsidesoftware/vscode-spell-checker/issues/74) so flagged words are not shown as suggestions.
* Enhanced the information screen.
* Add a right click option to add a word to the dictionary. If multiple words are selected, all of them will be added.
  This should fix issue [#59](https://github.com/streetsidesoftware/vscode-spell-checker/issues/59).
* Improve startup performance by limited the settings watcher.
  This addresses:
  * [#77](https://github.com/streetsidesoftware/vscode-spell-checker/issues/77)

# [1.4.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.9...1.4.0) (2017-09-17)

* Improved the information screen to make it easier to turn on/off languages.
* Use MDL for the theme of the information screen.

## [1.3.9](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.8...1.3.9) (2017-09-02)

* Fixed and issue with incorrect suggestions when the misspelled word started with a capitol letter.
* Improvements to the Info screen.

## [1.3.8](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.7...1.3.8) (2017-08-28)

* Update `README.md` to make finding suggestions a bit easier.
* Add link to German extension.
* Update cspell to support Python Django Framework.
* Update cspell to support Go 1.9, thanks to @AlekSi

## [1.3.7](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.6...1.3.7) (2017-08-24)

* Add new setting to limit the amount of text checked in a single file. `cSpell.checkLimit` can be used to set the limit in K-Bytes. By default it is 500KB.
* On startup, the spell checker is disabled and will be enabled only after the settings are read.
  This is to prevent the checking of file before all the configuration has been loaded.
* Improvements to the loading process has been to reduce repeated checking of documents during configuration changes.
* Checking of `handlebars` files have been turned on by default.
* Checking of `reStructuredText` files have been turned on by default.

## [1.3.6](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.5...1.3.6) (2017-08-09)

* Update cspell to enabled spelling checking 'untitled' files. See issue: [#99](https://github.com/streetsidesoftware/vscode-spell-checker/issues/99)

## [1.3.5](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.4...1.3.5) (2017-08-07)

* Add Extension API functions:
  * registerConfig - Register a cspell.json file to be loaded
  * triggerGetSettings - Causes all settings to be reloaded
  * enableLanguageId - Enables a programming language
  * disableLanguageId - Disables a programming language
  * enableCurrentLanguage - Enables the programming language associated with the active editor.
  * disableCurrentLanguage - Disables the programming language associated with the active editor.
  * addWordToUserDictionary - Adds a word to the User Dictionary
  * addWordToWorkspaceDictionary - Adds a word to the Workspace Dictionary
  * enableLocal - Enable Language Local like "en" or "es". Example: `enableLocal(true, 'es')`
  * disableLocal - Disables a Language Local. Example: `disableLocal(true, 'es')`
  * updateSettings - Update spelling settings by field. Example: `updateSettings(true, { language: "en", enable: true })`

## [1.3.4](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.3...1.3.4) (2017-08-06)

* Minor fix to the spell checking server related to importing settings from other extensions.

## [1.3.3](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.1...1.3.3) (2017-08-06)

* Fix an issue with words still showing up as incorrect after they have been added to user or project dictionary.
* Progress towards enabling Dictionary extensions.

## 1.3.2

* Fix issue [#80](https://github.com/streetsidesoftware/vscode-spell-checker/issues/80)

## [1.3.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.3.0...1.3.1) (2017-07-22)

* Fix issue [#112](https://github.com/streetsidesoftware/vscode-spell-checker/issues/112)
* Fix issue [#113](https://github.com/streetsidesoftware/vscode-spell-checker/issues/113)
* Fix issue [#110](https://github.com/streetsidesoftware/vscode-spell-checker/issues/110)

# [1.3.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.2.1...1.3.0) (2017-07-15)

* Upgraded to cspell 1.7.1 to get import support and global dictionaries.
* Adding cspell-dicts is now relatively simple.
* Change the delay to be delay after typing finishes. [#90](https://github.com/streetsidesoftware/vscode-spell-checker/issues/90)

## [1.2.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.0.2...1.2.1) (2017-07-01)
## 1.2.1

* Fix issue [#96](https://github.com/streetsidesoftware/vscode-spell-checker/issues/96)
* Added a FAQ file.
* User word lists are now sorted: [#91](https://github.com/streetsidesoftware/vscode-spell-checker/issues/91)
* Add commands to toggle the spell checker with key assignments [#64](https://github.com/streetsidesoftware/vscode-spell-checker/issues/64)
* Only use https links in .md files. [#103](https://github.com/streetsidesoftware/vscode-spell-checker/issues/103)

## 1.2.0

* Fix an issue with themes
* Update cspell library to support language specific overrides.
* Support Python unicode and byte strings.

## 1.1.0

* Fix Issue with cspell Info pane that prevented it from showing up. [#88](https://github.com/streetsidesoftware/vscode-spell-checker/issues/88)

## [1.0.2](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.0.1...1.0.2) (2017-03-20)

* Updated `cspell` to fix an issue where some misspelled words were considered correct even if they were not. See: [#7](https://github.com/Jason3S/cspell/issues/7)

## [1.0.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/1.0.0...1.0.1) (2017-03-11)

* Update Readme and changelog.

## 1.0.0

* Update to the latest version of cspell to handle large dictionary files.

## 0.17.2

* Update README to indicate that LaTex is enabled by default.

## 0.17.1

* Reduce the size of the extension by not including cspell twice.
* Removed unused packages.

## 0.17.0

* Minor changes to fix issues introduced by VS Code 1.9

## 0.16.0

* The spell checking engine was moved to its own repository [cspell](https://github.com/Jason3S/cspell)
  * [#58](https://github.com/streetsidesoftware/vscode-spell-checker/issues/58) Provide npm package with CLI
  * [#34](https://github.com/streetsidesoftware/vscode-spell-checker/issues/34) grunt plugin or a new library repository
* Added LaTex support [#65](https://github.com/streetsidesoftware/vscode-spell-checker/issues/65)
* Migrate from rxjs 4 to rxjs 5.
* Greatly extended the Typescript / Javascript dictionaries.
* Added a dictionary of file types to avoid common file types from being marked as spelling errors.
* Extend the *node* dictionary.

## [0.15.1](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.15.0...0.15.1) (2017-01-21)
# [0.15.0](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.14.9...0.15.0) (2017-01-21)

* Fix some issues with the spell checker info viewer
* Fix [#51](https://github.com/streetsidesoftware/vscode-spell-checker/issues/51)
* Fix an issue finding the cSpell.json file.
* Add some terms to the dictionaries.

## [0.14.9](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.14.8...0.14.9) (2017-01-21)

* Add a dictionary for C# and for .Net [#62](https://github.com/streetsidesoftware/vscode-spell-checker/issues/62)
* Turn on .json by default [#63](https://github.com/streetsidesoftware/vscode-spell-checker/issues/63)

## [0.14.8](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.14.7...0.14.8) (2017-01-20)

* Fix an issue with the displaying the spell checker info.

## [0.14.7](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.10.6...0.14.7) (2017-01-19)

* Enabled language pug [#60](https://github.com/streetsidesoftware/vscode-spell-checker/issues/60)
* As a stop-gap for csharp, use the typescript dictionary. Issue [#62](https://github.com/streetsidesoftware/vscode-spell-checker/issues/62)
* Add a dictionary for popular npm libraries
* Make sure most languages can be enabled / disabled without the need to restart vscode.
* Added a command to show an information page about the Spell Checker.
  It can be triggered by clicking on the statusbar or by `F1` `Show Spell Checker Configuration Info`

## 0.14.6

* Updates to documentation
* Fix [#55](https://github.com/streetsidesoftware/vscode-spell-checker/issues/55) - Have the exclude globs check the path relative to the workspace instead of the entire path.

## 0.14.5

* Minor fix to README.md

## 0.14.4

* Moved the default location for `cSpell.json` to the workspace root instead of *.vscode*.
  This makes it easier to have `cSpell.json` files checked into git.
  The spell checker will look for both `./vscode/cSpell.json` and `./cSpell.json` in the workspace.
* Fix [#54](https://github.com/streetsidesoftware/vscode-spell-checker/issues/54) - Spell checking problems should be removed from the diagnostic window when the editor tab is closed.

## 0.14.3

* Turn on C and CPP by default.
* Improve the CPP dictionary.
* Compress dictionaries
* Speed up dictionary load

## 0.14.2

* Fix [#49](https://github.com/streetsidesoftware/vscode-spell-checker/issues/49)
* Add support for CPP and C files.

## 0.14.1

* Fix [#47](https://github.com/streetsidesoftware/vscode-spell-checker/issues/47)

## 0.14.0

* This release includes a large amount of refactoring in order to support greater flexibility with the configuration.
* Ability to add file level settings:
  * ignore -- list of words to ignore
  * words -- list of words to consider correct
  * compound words -- can now turn on / off compound word checking.
  * disable / enable the spell checker
  * control which text in a file is checked.
* Ability to add new Dictionary files
* Per programming language level settings.
  * the ability to control which dictionaries are used.
  * enable / disable compound words
  * define `ignoreRegExpList` / `includeRegExpList` per language.
  * ability to define per language patterns
* Ability to define reusable patterns to be used with RegExpLists.
* Fixes [#7](https://github.com/streetsidesoftware/vscode-spell-checker/issues/7), [#31](https://github.com/streetsidesoftware/vscode-spell-checker/issues/31) -- String with escape characters like, "\nmessage", would be flagged as an error.
* Addresses [#3](https://github.com/streetsidesoftware/vscode-spell-checker/issues/3) -- Option to spell check only string and comments
* Addresses [#27](https://github.com/streetsidesoftware/vscode-spell-checker/issues/27) -- Regexp Ignore
* Addresses [#45](https://github.com/streetsidesoftware/vscode-spell-checker/issues/45) -- Adding custom dictionaries
* Fix issue $44 -- Settings in cSpell.json were not being applied without a reload.

## 0.13.3

* Fix for [#40](https://github.com/streetsidesoftware/vscode-spell-checker/issues/40) and [#44](https://github.com/streetsidesoftware/vscode-spell-checker/issues/44) - manually load the cSpell.json file and merge it will any project settings.

## 0.13.1

* Fix for [#42](https://github.com/streetsidesoftware/vscode-spell-checker/issues/42) - cSpell will not load on case sensitive file systems.

## 0.13.0

* Fix for [#39](https://github.com/streetsidesoftware/vscode-spell-checker/issues/39) - cSpell.flagWords Unknown configuration setting
* Added a list of fonts to the spelling words.  Font favorites like Webdings and Verdana
  will pass the spell checker.

## 0.12.2

* Minor fix to hex test.

## 0.12.1

* Ignore anything that looks like a hex value: 0xBADC0FFEE
* In-document disable / enable the spell checker.

## 0.12.0

* Greatly reduce the amount of time it takes to load this extension
* Add the ability to change the time delay for checking document changes.  See Issue [#28](https://github.com/streetsidesoftware/vscode-spell-checker/issues/28).

## 0.11.5

* Add Python support -- Special Thanks to @wheerd
* Move the "Add to Dictionary" suggestion back down to the bottom.
* Add some terms to the dictionary

## 0.11.4

* Hot fix for [#25](https://github.com/streetsidesoftware/vscode-spell-checker/issues/25).

## 0.11.2

* Updated Extension Icon
* Implemented [#16](https://github.com/streetsidesoftware/vscode-spell-checker/issues/16) -- Files that are excluded in search.exclude, will not be spellchecked.
* Glob support for the ignorePaths has been improved
* Adding words to the dictionary via command (F1 Add Word) will default to the currently selected text in the editor.
* By default, words are now added to the User Settings.
  At the bottom of the list of suggestions is the ability to add the word to the workspace.
  We are waiting for VS Code 1.7 to release to fix the suggestions list.
* The spellchecker can be enabled / disabled at the workspace level.
* Added information to the status bar (this can be hidden using settings.json).

## 0.10.13

* Fix issue [#21](https://github.com/streetsidesoftware/vscode-spell-checker/issues/21). Words added when editing a stand alone file, are now added to the user's words.
* Due to a change in the way vscode reads config files, it will no longer find your ~/.vscode/cSpell.json file.
  To keep the words you added, you need to copy them to your user settings file and add them to cSpell.userWords.

## 0.10.12

* Hot fix issue [#20](https://github.com/streetsidesoftware/vscode-spell-checker/issues/20).  The latest release of Visual Studio Code broke suggestions.

## 0.10.9

* Fix issue [#15](https://github.com/streetsidesoftware/vscode-spell-checker/issues/15): Windows users can now add words though the UI.

## 0.10.7

* Added all words from en_US Hunspell English Dictionary
* *GO* - 1.7 words added -- Special thanks to: @AlekSi
* Ignore Chinese/Japanese characters -- Issue: [#17](https://github.com/streetsidesoftware/vscode-spell-checker/issues/17)

## [0.10.6](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.10.2...0.10.6) (2016-06-23)

* Added support for contractions like wasn't, hasn't, could've.

## 0.10.5

* *GO* - keywords and library words added -- Special thanks to: @AlekSi
* *PHP* - many keywords and library functions added to word list.
* Word Lists now support CamelCase words.

## [0.10.2](https://github.com/streetsidesoftware/vscode-spell-checker/compare/0.9.5...0.10.2) (2016-06-21)
## 0.10.1 and 0.10.2

* Minor bug fixes

# 0.10.0 (2016-06-18)

* Feature: Suggestions
* Feature: Add to Dictionary

<!---
    These are at the bottom because the VSCode Marketplace leaves a bit space at the top

    cSpell:ignore jsja goededag alek wheerd behaviour tsmerge QQQQQ networkerrorexecption scrollbar
    cSpell:includeRegExp Everything
    cSpell:ignore hte
    cSpell:words Verdana
-->
