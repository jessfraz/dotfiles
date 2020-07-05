
# nrf-intel-hex

Yet another javascript parser/writer for "[Intel HEX](https://en.wikipedia.org/wiki/Intel_HEX)" files.

[![Build Status](https://travis-ci.org/NordicSemiconductor/nrf-intel-hex.svg?branch=master)](https://travis-ci.org/NordicSemiconductor/nrf-intel-hex)

This is part of [Nordic Semiconductor](http://www.nordicsemi.com/)'s javascript tools to
interface with nRF SoCs and development kits. Although the HEX format is a *de facto*
standard and `nrf-intel-hex` should work on other hardware platforms, Nordic Semiconductor
cannot offer support. This software is provided "as is".

## Demo

If you have some .hex files around, and can copy-paste them, try the
[interactive browser demo](https://nordicsemiconductor.github.io/nrf-intel-hex/demo.html).

## Usage

Do a `npm install nrf-intel-hex` or `yarn add nrf-intel-hex`, then

```
import { hexToArrays } from 'nrf-intel-hex';

let intelHexString =
    ":100000000102030405060708090A0B0C0D0E0F1068\n" +
    ":00000001FF";

let memMap = hexToArrays(intelHexString);
```

`memMap` is a `MemoryMap`, a [`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)
in which each key is a memory address offset, and each value is a
[`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
containing binary data.

For contiguous data, that `Map` will have only one entry. For sparse data, it will have
several entries, indexed by the start offset of each data block. Its keys are guaranteed
to be in ascending order.

In order to write .hex records, provide a `Map` of `Uint8Array`s, where each key is the
start address of that block:

```
import { arraysToHex } from 'nrf-intel-hex';

let memMap = new MemoryMap();
let bytes = new Uint8Array(....);
memMap.set(0x0FF80000, bytes); // The block with 'bytes' will start at offset 0x0FF80000

let string = memMap.asHexString();
```

The return value will be a string of text containing all the records.

This module also provides some utility functions for handling `Map`s of `Uint8Array`s.
Check the full API documentation at https://nordicsemiconductor.github.io/nrf-intel-hex/doc/

## Motivation

There are already other parsers/writers for HEX files (or, as the format is
[formally known](http://microsym.com/editor/assets/intelhex.pdf), "Hexadecimal
Object File Format". However, because [the original specification](http://microsym.com/editor/assets/intelhex.pdf)
is (very) vague in some aspects, the existing implementations all have shortcomings.

This format was designed to «Allow the placement of code and data within [the]
[address space](https://en.wikipedia.org/wiki/Address_space) of Intel processors».
Altough the *common* use case is use the Intel HEX format for binary files,
there are also use cases for:

* Specifying data which does not start at an address of zero (e.g. data to be
  written at the end of a storage device)
* Initializing peripherals by writing to their raw physical address
* Specifying sparse (non-contiguous) data at some intervals

Also, the specification is vague about:

* How records are separated
* Whether addresses should be strictly ascending or not
* Whether the file is meant for an 8-bit, 16-bit or 32-bit target
  (whether to use 16-, 20- or 32-bit addresses respectively)
* Whether there should be auto-detection of 8-, 16-, or 32-bit mode.
* What happens if the same memory address appears twice in the same file.
* What happens if there are 16- and 32-bit specific records in the same file.
* What should be the behaviour of 8-bit address wrapping.
* What should be the behaviour of 16-bit/32-bit address wrapping if/when
  the addressing mode is not known.

Some of the shortcomings in other parsers are:

* Not handling data over the 64KiB boundary (only 16-bit addresses)
* Naïvely assuming that the data is contiguous, or
* Throwing an error if the data is sparse, or
* Filling gaps in sparse data with `0x00`s or `0xFF`s

These assumptions might be right in the best case, but might cause destructive overwrites
in the worst case.

## Features

We wanted to cover the use cases at Nordic Semiconductor while clarifying behaviour and
overcoming the problems of other implementations. So, this **opinionated** implementation
has the following behaviour for parsing:

* Allows for both uppercase and lowercase hexadecimal characters
* Allows for `\n`, `\r`, `\r\n` and empty record separators
* Does not assume that data is given in records with strictly ascending addresses;
  out-of-order records create contiguous blocks of data.
* Does not assume contiguous data blocks, and so can return more than one block of binary
  data.
* Silently ignores 0x03 and 0x05 type records (the ones which would reset the program
  counter CPU registers - CS+IP in 16-bit mode, or EIP in 32-bit mode).
* Records for 20-bit and 32-bit address offsets (types 0x02 and 0x04) can be handled at
  the same time, but only the last one has effect.
* Records which might wrap over the low 0xFFFF address will throw an exception. Altough
  the spec calls for handling wrapping data over in 16- or 32-bit mode, not knowing the
  expected behaviour in 8-bit mode, and not knowing which mode a file refers to, makes
  it impossible to implement wrapping consistenly.

The behaviour for writing .hex format is stricter and predictable, in line with the
[robustness principle](https://en.wikipedia.org/wiki/Robustness_principle):

* Records have strictly ascending addresses.
* No 0x03 nor 0x05 records are generated.
* 32-bit mode is assumed. 0x02 records (16-bit mode segment offsets) are not used.
* A 0x04 record (32-bit linear address offset) is always generated before the first
  data record, even if the address of the first data record is 0x0.
* No byte wrapping at 0xFFFF.
* Default of 16 data bytes per record.
* `\n` is used as a record separator.
* Throws an error if there is data over 0xFFFFFFFF (4GiB)

### Compatibility

`nrf-intel-hex` relies on ES2015, [`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map),
[`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) and
[`String.prototype.padStart`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart).

It will work out of the box in a Node.js version 8 (or higher), and in all major modern browsers
(starting with Edge v15, Chrome/Chromium v57, Firefox v52, Safari v10). Node.js version 6
requires a `String.prototype.padStart` shim.

With proper ES2015→ES5 transpiling and shims, is *should* work in a nodejs environment as old
as version 4, and in all major browsers (as old as Edge v12, Chrome/Chromium v38,
Firefox v48, Safari v9).

### TODO

Some features that would be nice to have, but that are not needed for the current
use cases yet:

* Stream mode: allow to start parsing a byte stream (e.g. file or network socket), and
  emit data blocks of a given size when appropiate (e.g. when more than N contiguous byes have been parsed, or when jumping to a different memory address section). This is not a
  priority, as our current use case for .hex files does not involve more than 1MiB of data.
* Allow for some behaviour to be turned on/off
* Allow for less-strict parsing (allow non-canonical comments in the input data)
* Stricter treatment of 16- and 32-bit modes. Do not allow mixing records from both modes.
* Stream mode for the writer: return a Generator or an Iterator, and output the records as
  they are being requested.

## Further reference

* https://en.wikipedia.org/wiki/Intel_HEX
* http://microsym.com/editor/assets/intelhex.pdf
* http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.faqs/ka9903.html

## Legal

Distrubuted under a BSD-3 license. See the `LICENSE` file for details.


