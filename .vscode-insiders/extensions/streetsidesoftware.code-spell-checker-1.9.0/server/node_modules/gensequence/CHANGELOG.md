# Release Notes

## [3.1.0]
* Initial support for `AsyncIterator`s
  * Special thanks to [albertossilva (Alberto)](https://github.com/albertossilva)
  * Only supports reduce at the moment.

## [3.0.0]
* Supports Node >= 10
* Add the ability to pipe operators

## [2.2.0]
* Move operator functions out of GenSequence
* Update to TypeScript

## [2.1.3]
* Update dev packages to address issues with code coverage generation in Node 10

## 2.1.1
* Update dev packages
* add `forEach` function

## 2.1.0
* fix a function signature issue surfaced by typescript 2.4.2

## 2.0.1
* minor update to README.md.
* added test showing how it is not possible to reuse some iterators.

## 2.0.0
* sequences are now reusable as long as the original iterator is reusable.
* it is not possible to initialize a sequence with a function that returns an iterator
  This is very powerful.
* `.count()` added.
* special thanks to @sea1jxr for all of the above.

## 1.3.0
* Refactor the methods to give them a logical grouping - thanks to @sea1jxr

## 1.2.0
* Added `min` and `max` - thanks to @sea1jxr

## 1.1.0
* Added `all` and `any` - thanks to @sea1jxr

## 1.0.0
* Added full test coverage
* Fix an issue with scan and working with arrays.
* Fix the `.next()` function to correctly work with arrays.
* Sequence supports both Iterable<T> and IterableIterator<T> interfaces

## 0.1.0 - 0.2.4
* These were the initial set of releases

<!---
cspell:ignore albertossilva
-->
