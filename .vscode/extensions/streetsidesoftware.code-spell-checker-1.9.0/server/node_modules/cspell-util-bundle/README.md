# cspell-util-bundle

This is a bundle of imported libraries used by cspell.

The purpose of this bundle is to reduce the install size of cspell-lib and cspell app.

## install

`npm install -S cspell-util-bundle`

### Typescript dependencies
`npm install -SD @types/xregexp`

## xregexp
`xregexp` is a wonderful enhancement to the builtin regex engine in Javascript.
The downside is that it includes a LOT of unnecessary files.
