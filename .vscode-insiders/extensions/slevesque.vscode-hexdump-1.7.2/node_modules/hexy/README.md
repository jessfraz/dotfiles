[![build status](https://secure.travis-ci.org/a2800276/hexy.js.png)](http://travis-ci.org/a2800276/hexy.js)

 # hexy.js -- utility to create hex dumps 
 
 `hexy` is a javascript library that's easy to use to create hex dumps. It
 works well in node and has cursory browser (more below) support. It contains a
 number of options to configure how the hex dump will end up looking.
 
 It should create a pleasant looking hex dumb by default:
     
     var hexy = require('hexy'),
            b = new Buffer("\000\001\003\005\037\012\011bcdefghijklmnopqrstuvwxyz0123456789")
             // or String or Array containing numbers ( bytes, i.e. < 0xFF )
     
     console.log(hexy.hexy(b))
 
 results in this dump:
 
     00000000: 0001 0305 1f0a 0962 6364 6566 6768 696a  .......bcdefghij
     00000010: 6b6c 6d6e 6f70 7172 7374 7576 7778 797a  klmnopqrstuvwxyz
     00000020: 3031 3233 3435 3637 3839                 0123456789
 
 but it's also possible to configure:
 
   * Line numbering
   * Line width
   * Format of byte grouping
   * Case of hex decimals
   * Presence of the ASCII annotation in the right column.
 
 This means it's easy to generate exciting dumps like:
 
     0000000: 0001 0305 1f0a 0962  .... ...b 
     0000008: 6364 6566 6768 696a  cdef ghij 
     0000010: 6b6c 6d6e 6f70 7172  klmn opqr 
     0000018: 7374 7576 7778 797a  stuv wxyz 
     0000020: 3031 3233 3435 3637  0123 4567 
     0000028: 3839                 89
 
 or even:
 
     0000000: 00 01 03 05 1f 0a 09 62   63 64 65 66 67 68 69 6a 
     0000010: 6b 6c 6d 6e 6f 70 71 72   73 74 75 76 77 78 79 7a 
     0000020: 30 31 32 33 34 35 36 37   38 39
 
 with hexy!
 
 ## Accepted Input
 
 Currently, input should be one of the following:
 
   - a `Buffer`
   - a `String`
   - an `Array` containing `Number`s. These should fit into
     8 bits, i.e. be smaller than 255. Larger values are truncated
     (specifically `val & 0xff`)
 
 ## Formatting Options
 
 Formatting options are configured by passing a `format` object to the `hexy` function:
 
     var format = {}
         format.width = width // how many bytes per line, default 16
         format.numbering = n // ["hex_bytes" | "none"],  default "hex_bytes"
         format.format = f    // ["eights"|"fours"|"twos"|"none"], how many nibbles per group
                              //                          default "fours"
         format.caps = c      // ["lower"|"upper"],       default lower
         format.annotate=a    // ["ascii"|"none"], ascii annotation at end of line?
                              //                          default "ascii"
         format.prefix=p      // <string> something pretty to put in front of each line
                              //                          default ""
         format.indent=i      // <num> number of spaces to indent
                              //                          default 0
         format.html=true     // funky html divs 'n stuff! experimental.
                              //                          default: false
         format.offset = X    // generate hexdump based on X byte offset
                              // into the provided source
                              //                          default 0
         format.length = Y    // process Y bytes of the provide source 
                              // starting at `offset`. -1 for all
                              //                          default -1
         format.display_offset = Z
                              // add Z to the address prepended to each line
                              // (note, even if `offset` is provided, addressing
                              // is started at 0)
                                                          dafault 0                         
 
     console.log(hexy.hexy(buffer, format))
 
 In case you're really nerdy, you'll have noticed that the defaults correspond
 to how `xxd` formats it's output.
            
 
 ## Installing
 
 Either use `npm` (or whatever caompatible npm thingie people are using
 these days) :
   
     npm install hexy
 
 This will install the lib which you'll be able to use like so:
     
     var hexy = require("hexy"),
         buf  = // get Buffer from somewhere,
         str  = hexy.hexy(buf)
 
 It will also install `hexy` into your path in case you're totally fed up
 with using `xxd`.
         
  
 If you don't like `npm`, grab the source from github:
 
     http://github.com/a2800276/hexy.js
 
 ## Browser Support
 
 Basically eveything should work fine in the browser as well, just
 include hexy.js in a script tag, and you'll get `hexy` and `Hexy` stuck
 to the global object (window).
 
 Some caveats: "Works fine on my system™". Browser support is 'new' and
 not thoroughly tested (... eh, only on chrome [Version: whatever I'm
 currently running]). Under node, I can generally assume that binary data
 is passed in in a sane fashion using buffers, but plain old Javascript
 doesn't really have any datatypes that can handle bytes gracefully.
 Currently only Strings and arrays containing Number'ish values are
 supported, I'd like to add numeric and typed arrays more explicitly.
 
 Let me know in case you run into any issues, I'd be happy to find out
 about them.
 
 ## TODOS
 
 The current version only pretty prints node.js Buffers, and JS Strings
 and Arrays. This should be expanded to also do typed arrays,
 Streams/series of Buffers which would be nice so you don't have to
 collect the whole things you want to pretty print in memory, and such.
 
 I'd like to improve html rendering, e.g. to be able to mouse over the
 ascii annotation and highlight the hex byte and vice versa, improve
 browser integration and set up a proper build & packaging system.

 Thinking about perhaps supporting typescript ...
 
 Better testing for browser use.
 
  
 ## Thanks
 
 * Thanks to Isaac Schlueter [isaacs] for gratiously lending a hand and
 cheering me up.
 * dodo (http://coderwall.com/dodo)
 * the fine folks at [Travis](http://travis-ci.org/a2800276/hexy.js)
 * radare (https://github.com/radare)
 * Michele Caini (https://github.com/skypjack)
 * Koen Houtman (https://github.com/automagisch)
 * Stef Levesque (https://github.com/stef-levesque)
 
 ## History
 
 This is a fairly straightforward port of `hexy.rb` which does more or less the
 same thing. You can find it here: 
  
     http://github.com/a2800276/hexy
  
 in case these sorts of things interest you.
 
 ## Mail
 
 In case you discover bugs, spelling errors, offer suggestions for
 improvements or would like to help out with the project, you can contact
 me directly (tim@kuriositaet.de). 

