# Cspell English Dictionary

English dictionary for cspell.

This is a pre-built dictionary for use with cspell.

## Note

This dictionary comes pre-installed with cspell. It should not be necessary to add it.

## Installation

Global Install and add to cspell global settings.

```sh
npm install -g cspell-dict-en-us
cspell-dict-en-us-link
```

## Uninstall from cspell

```sh
cspell-dict-en-us-unlink
```

## Manual Installation

The `cspell-ext.json` file in this package should be added to the import section in your cspell.json file.

```javascript
{
    // …
    "import": ["<path to node_modules>/cspell-dict-en-us/cspell-ext.json"],
    // …
}
```

## Building

Building is only necessary if you want to modify the contents of the dictionary.  Note: Building will take a few minutes for large files.

```sh
npm run build
```

## Resources

The Hunspell source for this dictionary can be found:

http://wordlist.aspell.net/hunspell-readme/

## License

MIT
> Some packages may have other licenses included.
