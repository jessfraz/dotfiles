// # hexy.js -- utility to create hex dumps 
// 
// `hexy` is a javascript library that's easy to use to create hex dumps. It
// works well in node and has cursory browser (more below) support. It contains a
// number of options to configure how the hex dump will end up looking.
// 
// It should create a pleasant looking hex dumb by default:
//     
//     var hexy = require('hexy'),
//            b = new Buffer("\000\001\003\005\037\012\011bcdefghijklmnopqrstuvwxyz0123456789")
//             // or String or Array containing numbers ( bytes, i.e. < 0xFF )
//     
//     console.log(hexy.hexy(b))
// 
// results in this dump:
// 
//     00000000: 0001 0305 1f0a 0962 6364 6566 6768 696a  .......bcdefghij
//     00000010: 6b6c 6d6e 6f70 7172 7374 7576 7778 797a  klmnopqrstuvwxyz
//     00000020: 3031 3233 3435 3637 3839                 0123456789
// 
// but it's also possible to configure:
// 
//   * Line numbering
//   * Line width
//   * Format of byte grouping
//   * Case of hex decimals
//   * Presence of the ASCII annotation in the right column.
// 
// This means it's easy to generate exciting dumps like:
// 
//     0000000: 0001 0305 1f0a 0962  .... ...b 
//     0000008: 6364 6566 6768 696a  cdef ghij 
//     0000010: 6b6c 6d6e 6f70 7172  klmn opqr 
//     0000018: 7374 7576 7778 797a  stuv wxyz 
//     0000020: 3031 3233 3435 3637  0123 4567 
//     0000028: 3839                 89
// 
// or even:
// 
//     0000000: 00 01 03 05 1f 0a 09 62   63 64 65 66 67 68 69 6a 
//     0000010: 6b 6c 6d 6e 6f 70 71 72   73 74 75 76 77 78 79 7a 
//     0000020: 30 31 32 33 34 35 36 37   38 39
// 
// with hexy!
// 
// ## Accepted Input
// 
// Currently, input should be one of the following:
// 
//   - a `Buffer`
//   - a `String`
//   - an `Array` containing `Number`s. These should fit into
//     8 bits, i.e. be smaller than 255. Larger values are truncated
//     (specifically `val & 0xff`)
// 
// ## Formatting Options
// 
// Formatting options are configured by passing a `format` object to the `hexy` function:
// 
//     var format = {}
//         format.width = width // how many bytes per line, default 16
//         format.numbering = n // ["hex_bytes" | "none"],  default "hex_bytes"
//         format.format = f    // ["eights"|"fours"|"twos"|"none"], how many nibbles per group
//                              //                          default "fours"
//         format.caps = c      // ["lower"|"upper"],       default lower
//         format.annotate=a    // ["ascii"|"none"], ascii annotation at end of line?
//                              //                          default "ascii"
//         format.prefix=p      // <string> something pretty to put in front of each line
//                              //                          default ""
//         format.indent=i      // <num> number of spaces to indent
//                              //                          default 0
//         format.html=true     // funky html divs 'n stuff! experimental.
//                              //                          default: false
//         format.offset = X    // generate hexdump based on X byte offset
//                              // into the provided source
//                              //                          default 0
//         format.length = Y    // process Y bytes of the provide source 
//                              // starting at `offset`. -1 for all
//                              //                          default -1
//         format.display_offset = Z
//                              // add Z to the address prepended to each line
//                              // (note, even if `offset` is provided, addressing
//                              // is started at 0)
//                                                          dafault 0                         
// 
//     console.log(hexy.hexy(buffer, format))
// 
// In case you're really nerdy, you'll have noticed that the defaults correspond
// to how `xxd` formats it's output.
//            
// 
// ## Installing
// 
// Either use `npm` (or whatever caompatible npm thingie people are using
// these days) :
//   
//     npm install hexy
// 
// This will install the lib which you'll be able to use like so:
//     
//     var hexy = require("hexy"),
//         buf  = // get Buffer from somewhere,
//         str  = hexy.hexy(buf)
// 
// It will also install `hexy` into your path in case you're totally fed up
// with using `xxd`.
//         
//  
// If you don't like `npm`, grab the source from github:
// 
//     http://github.com/a2800276/hexy.js
// 
// ## Browser Support
// 
// Basically eveything should work fine in the browser as well, just
// include hexy.js in a script tag, and you'll get `hexy` and `Hexy` stuck
// to the global object (window).
// 
// Some caveats: "Works fine on my system™". Browser support is 'new' and
// not thoroughly tested (... eh, only on chrome [Version: whatever I'm
// currently running]). Under node, I can generally assume that binary data
// is passed in in a sane fashion using buffers, but plain old Javascript
// doesn't really have any datatypes that can handle bytes gracefully.
// Currently only Strings and arrays containing Number'ish values are
// supported, I'd like to add numeric and typed arrays more explicitly.
// 
// Let me know in case you run into any issues, I'd be happy to find out
// about them.
// 
// ## TODOS
// 
// The current version only pretty prints node.js Buffers, and JS Strings
// and Arrays. This should be expanded to also do typed arrays,
// Streams/series of Buffers which would be nice so you don't have to
// collect the whole things you want to pretty print in memory, and such.
// 
// I'd like to improve html rendering, e.g. to be able to mouse over the
// ascii annotation and highlight the hex byte and vice versa, improve
// browser integration and set up a proper build & packaging system.
//
// Thinking about perhaps supporting typescript ...
// 
// Better testing for browser use.
// 
//  
// ## Thanks
// 
// * Thanks to Isaac Schlueter [isaacs] for gratiously lending a hand and
// cheering me up.
// * dodo (http://coderwall.com/dodo)
// * the fine folks at [Travis](http://travis-ci.org/a2800276/hexy.js)
// * radare (https://github.com/radare)
// * Michele Caini (https://github.com/skypjack)
// * Koen Houtman (https://github.com/automagisch)
// * Stef Levesque (https://github.com/stef-levesque)
// 
// ## History
// 
// This is a fairly straightforward port of `hexy.rb` which does more or less the
// same thing. You can find it here: 
//  
//     http://github.com/a2800276/hexy
//  
// in case these sorts of things interest you.
// 
// ## Mail
// 
// In case you discover bugs, spelling errors, offer suggestions for
// improvements or would like to help out with the project, you can contact
// me directly (tim@kuriositaet.de). 

(function (arg) {

var hexy = function (buffer, config) {
  var h = new Hexy(buffer, config)
  return h.toString()
}

var Hexy = function (buffer, config) {
  var self = this
  
  if (typeof Buffer !== 'undefined') {
    buffer = (Buffer.isBuffer(buffer) && buffer) 
      || (typeof buffer === 'string' && new Buffer(buffer)) 
      || (buffer && (buffer.constructor === Array) && new Buffer(buffer)) // accept num arrays
      || new Buffer(0)
  }
  buffer = buffer || []
  config = config || {}
 
  self.buffer    = buffer // magic string conversion here?
  self.width     = parseInt(config.width) || 16
  self.numbering = config.numbering == "none"  ? "none" : "hex_bytes"
   
  switch (config.format) {
    case "none":
    case "twos":
    case "eights":
      self.format = config.format
      break
    default:
      self.format = "fours"
  }
  
  self.caps        = config.caps        == "upper" ? "upper" : "lower"
  self.annotate    = config.annotate    == "none"  ? "none"  : "ascii"
  self.prefix      = config.prefix      || ""
  self.indent      = config.indent      || 0
  self.html        = config.html        || false
  self.offset      = config.offset      || 0
  self.length      = config.length      || -1
  
  self.display_offset = config.display_offset || 0

  if (self.offset) {
    if (self.offset < self.buffer.length) {
      self.buffer = self.buffer.slice(self.offset)
    }
  }

  if (self.length !== -1) {
    if (self.length <= self.buffer.length) {
      self.buffer = self.buffer.slice(0,self.length)
    }
  }

  for (var i = 0; i!=self.indent; ++i) {
    self.prefix = " "+self.prefix
  }

  var pos = 0

  this.toString = function () {
    var str = ""
    
    if (self.html) { str += "<div class='hexy'>\n"}
    //split up into line of max `self.width`
    var line_arr = lines()
    
    //lines().forEach(function(hex_raw, i)
    for (var i = 0; i!= line_arr.length; ++i) {
      var hex_raw = line_arr[i],
          hex = hex_raw[0],
          raw = hex_raw[1]
      //insert spaces every `self.format.twos`, fours or eights
      var howMany = hex.length
      if (self.format === "eights") {
        howMany = 8
      } else if (self.format === "fours") {
        howMany = 4
      } else if (self.format === "twos") {
        howMany = 2
      }

      var hex_formatted = ""


      for (var j =0; j< hex.length; j+=howMany) {
        var s = hex.substr(j, howMany)
        hex_formatted += s + " "
      } 

      var addr = (i*self.width)+self.offset+self.display_offset;
      if (self.html) {
        odd = i%2 == 0 ? " even" : "  odd"
        str += "<div class='"+pad(addr, 8)+odd+"'>"
      }
      str += self.prefix 

      if (self.numbering === "hex_bytes") {
        str += pad(addr, 8) // padding...
        str += ": "
      }
      
      var padlen = 0
      switch(self.format) {
        case "eights":
          padlen = self.width*2 + Math.floor(self.width/4)
          break
        case "fours":
          padlen = self.width*2 + Math.floor(self.width/2)
          break
        case "twos":
          padlen = self.width*3 + 2
          break
        default:
          padlen = self.width * 2 + 1
      }

      str += rpad(hex_formatted, padlen)
      if (self.annotate === "ascii") {
        str+=" "
        var ascii = raw.replace(/[\000-\040\177-\377]/g, ".")
        if (self.html) {str += escape(ascii)}
        else { str += ascii }
      }
      if (self.html) {
        str += "</div>\n"
      } else {
      str += "\n"
      } 
    }
    if (self.html) { str += "</div>\n"}
    return str
  }

  var lines = function() {
    var hex_raw = []
    for (var i = 0; i<self.buffer.length ; i+=self.width) {
      var begin = i,
          end   = i+self.width >= self.buffer.length ? self.buffer.length : i+self.width,
          slice = self.buffer.slice(begin, end),
          hex   = self.caps === "upper" ? hexu(slice) : hexl(slice),
          raw   = slice.toString('ascii')
      
      if (self.buffer.constructor == Array) {
        raw = String.fromCharCode.apply(self, slice)
      }
      hex_raw.push([hex,raw])
    }
    return hex_raw

  }

  var hexl = function (buffer) {
    var str = ""
    for (var i=0; i!=buffer.length; ++i) {
      if (buffer.constructor == String) {
        str += pad(buffer.charCodeAt(i), 2)
      } else {
        str += pad(buffer[i], 2)
      }
    }
    return str
  }
  var hexu = function (buffer) {
    return hexl(buffer).toUpperCase()
  }

  var pad = function(b, len) {
    var s = b.toString(16)
    
    while (s.length < len) {
      s = "0" + s
    }
    return s
  } 
  var rpad = function(s, len) {
    for (var n = len - s.length; n>0; --n) {
      if (self.html) {
        s += "&nbsp;"
      } else {
        s += " "
      }
    
    }
    return s
  }

  var escape = function (str) {
    str = str.split("&").join("&amp;")
    str = str.split("<").join("&lt;")
    str = str.split(">").join("&gt;")
    return str
  }
  

}

Hexy.VERSION = "0.2.11"

// This is probably not the prettiest or coolest way to to determine runtime
// environment. It seems to work and I'm not up to the task figuring out what
// the module system du jour is and how to interface with it ...

// If anyone wants to fix this to include this module "properly", I'm more than
// happy to incorporate any fixes...

var _exp
if (typeof exports !== "undefined") {
  _exp = exports
} else if (arg === window) {
  _exp = window
} else {
  // who knows?
  _exp = arg // or this or somethings. ...
}
_exp.hexy = hexy
_exp.Hexy = Hexy

})(this)
