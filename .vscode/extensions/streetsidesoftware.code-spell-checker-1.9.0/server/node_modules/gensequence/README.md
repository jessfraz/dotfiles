# GenSequence

[![Build Status](https://travis-ci.org/Jason3S/GenSequence.svg?branch=master)](https://travis-ci.org/Jason3S/GenSequence)
[![Coverage Status](https://coveralls.io/repos/github/Jason3S/GenSequence/badge.svg?branch=master)](https://coveralls.io/github/Jason3S/GenSequence?branch=master)

Small library to simplify working with Generators and Iterators in Javascript / Typescript

Javascript [Iterators and Generators](https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Iterators_and_Generators)
are very exciting and provide some powerful new ways to solve programming problems.

The purpose of this library is to make using the results of a generator function easier.
It is not intended as a replacement for arrays and the convenient [...genFn()] notation.
GenSequence is useful for cases where you might not want an array of all possible values.
GenSequence deals efficiently with large sequences because only one element at a time is evaluated.
Intermediate arrays are not created, saving memory and cpu cycles.

## Installation

```
npm install -S gensequence
```

## Usage

### Javascript
```
import genSequence from "gensequence";
```
or
```
import {genSequence} from "gensequence";
```


### Typescript
```
import {genSequence} from 'gensequence';
```

## Examples

### Fibonacci
The Fibonacci sequence can be very simply expressed using a generator.  Yet using the result of a generator can be a bit convoluted.
GenSequence provides a wrapper to add familiar functionality similar to arrays.

```javascript
function fibonacci() {
    function* fib() {
        let [a, b] = [0, 1];
        while (true) {
            yield b;
            [a, b] = [b, a + b];
        }
    }
    // Wrapper the Iterator result from calling the generator.
    return genSequence(fib);
}

let fib5 = fibonacci()
    .take(5)            // Take the first 5 from the fibonacci sequence
    .toArray();         // Convert it into an array
// fib5 == [1, 1, 2, 3, 5]

let fib6n7seq = fibonacci().skip(5).take(2);
let fib6n7arr = [...fib6n7seq];                 // GenSequence are easily converted into arrays.

let fib5th = fibonacci()
    .skip(4)            // Skip the first 4
    .first();           // Return the next one.
```

### RegEx Match

Regular expressions are wonderfully powerful.  Yet, working with the results can sometimes be a bit of a pain.

```javascript
function* execRegEx(reg: RegExp, text: string) {
    const regLocal = new RegExp(reg);
    let r;
    while (r = regLocal.exec(text)) {
        yield r;
    }
}

/* return a sequence of matched text */
function match(reg: RegExp, text: string) {
    return genSequence(execRegEx(reg, text))
        // extract the full match
        .map(a => a[0]);
}

/* extract words out of a string of text */
function matchWords(text: string) {
    return genSequence(match(/\w+/g, text));
}

/* convert some text into a set of unique words */
function toSetOfWords(text: string) {
    // Sequence can be used directly with a Set or Match
    return new Set(matchWords(text));
}

const text = 'Some long bit of text with many words, duplicate words...';
const setOfWords = toSetOfWords(text);
// Walk through the set of words and pull out the 4 letter one.
const setOf4LetterWords = new Set(genSequence(setOfWords).filter(a => a.length === 4));

```


## Reference
- `genSequence(Iterable|Array|()=>Iterable)` -- generate a new Iterable from an Iterable, Array or function with the following functions.

### Filters
- `.filter(fn)` -- just like array.filter, filters the sequence
- `.skip(n)` -- skip *n* entries in the sequence
- `.take(n)` -- take the next *n* entries in the sequence.

### Extenders
- `.concat(iterable)` -- this will extend the current sequence with the values from *iterable*
- `.concatMap(fnMap)` -- this is used to flatten the result of a map function.

### Mappers
- `.combine(fnCombiner, iterable)` -- is used to combine values from two different lists.
- `.map(fn)` -- just like array.map, allows you to convert the values in a sequence.
- `.pipe(...operatorFns)` -- pipe any amount of operators in sequence.
- `.scan(fn, init?)` -- similar to reduce, but returns a sequence of all the results of fn.

### Reducers
- `.all(fn)` -- true if all values in the sequence return true for *fn(value)* or the sequence is empty.
- `.any(fn)` -- true if any value in the sequence exists where *fn(value)* returns true.
- `.count()` -- return the number of values in the sequence.
- `.first()` -- return the next value in the sequence.
- `.first(fn)` -- return the next value in the sequence where *fn(value)* return true.
- `.forEach(fn)` -- apply *fn(value, index)* to all values.
- `.max()` -- return the largest value in the sequence.
- `.max(fn)` -- return the largest value of *fn(value)* in the sequence.
- `.min()` -- return the smallest value in the sequence.
- `.min(fn)` -- return the smallest value of *fn(value)* in the sequence.
- `.reduce(fn, init?)` -- just like array.reduce, reduces the sequence into a single result.
- `.reduceAsync(fn, init?)` -- just like array.reduce, reduces promises into the sequence into a single result chaining the promises, fn/init can be async or not, it will work, the previousValue, and currentValue will never be a promise.
- `.reduceToSequence(fn, init)` -- return a sequence of values that *fn* creates from looking at all the values and the initial sequence.

### Cast
- `.toArray()` -- convert the sequence into an array.  This is the same as [...iterable].
- `.toIterable()` -- Casts a Sequence into an IterableIterator - used in cases where type checking is too strict.
