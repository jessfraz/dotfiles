# `cspell-glob`

A simple library for checking filenames against a set of glob rules. It attempts to emulate the `.gitignore` rules.

## Purpose

The purpose behind this library is a bit different than the other glob matchers.
The goal here is to see if a file name matches a glob, not to find files that match globs.
This library doesn't do any file i/o. It uses [micromatch](https://github.com/micromatch/micromatch#readme) under the hood for the actual matching.

## Usage

```
const cspellGlob = require('cspell-glob');

// TODO: DEMONSTRATE API
```
