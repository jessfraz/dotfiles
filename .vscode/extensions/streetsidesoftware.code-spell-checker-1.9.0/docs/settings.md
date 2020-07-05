# Settings

Settings, Configuration, and Preferences

## `cSpell.configLocation`
A resource level setting that specifies the location of the `cspell.json` file.

## `cSpell.userWordsUrl`, `cSpell.wordsUrl`, `cSpell.ignoreWordsUrl`


## Raw Notes

* need setting to indicate that settings should use `cspell.json` by default.
* need to be able to specify the location of user words, words, ignore words, and forbid words.
* would like to have a format for a single list of words that represents words / ignore / forbid.
    * Use the format for cspell 5
        * `!` indicates forbidden
        * `+` indicates compound required
        * `*` indicates optional compound
        * ` ` (don't know yet) indicates do not suggest.
