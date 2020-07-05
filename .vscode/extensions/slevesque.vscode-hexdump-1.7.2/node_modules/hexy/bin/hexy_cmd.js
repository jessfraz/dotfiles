#!/usr/bin/env node

var hexy = require("../hexy.js"),
    fs   = require("fs")

function usage (mes) {
  console.log(mes)
  console.log("usage bla bal bal");
  console.log("--width     [(16)]                     how many bytes per line")
  console.log("--numbering [(hex_bytes)|none]         prefix current byte count")
  console.log("--format    [eights|(fours)|twos|none] how many nibbles per group")
  console.log("--caps      [(lower)|upper]            case of hex chars")
  console.log("--annotate  [(ascii)|none]             provide ascii annotation")
  console.log("--prefix    [(\"\")|<prefix>]          printed in front of each line")
  console.log("--indent    [(0)|<num>]                number of spaces to indent output")
  console.log("parameter in (parens) are default")
  process.exit(1)
}

function existsFatal(fn) {
  try {
    var stat = fs.statSync(fn)
    if (stat.isFile()) {
      return;
    } 
  } catch (e) {}
  usage("not a file: "+fn)
}
function handleArgs () {
  var format = {}, 
      ARGS = [
      "--width",
      "--numbering",
      "--format",
      "--caps",
      "--annotate",
      "--prefix",
      "--indent",
      ]

  var args = process.argv,
      last = -1

  for (var i=2; i<args.length; ++i) {
    var arg = args[i]
    if ("--help" === arg) {
      usage()
    }
    if ( -1 === ARGS.indexOf(arg) ) {
      // not a valid flag
      if (args.length-1 === i) {
        //last arg, could be filename
        existsFatal(arg)
        format.filename = arg
        break;
      } else {
        usage()
      }
    }
    arg = arg.substr(2, arg.length)
    format[arg] = args[++i] 
    
  }

  if (format.width) {
    format.width = parseInt(format.width, 10)
  }
  if (format.indent) {
    format.indent = parseInt(format.indent, 10)
  }
  return format
}

/************************************************************************
 * MAIN ***************************************************************** 
************************************************************************/

var format = handleArgs(),
    buffer = null,
    str    = null

if (format.filename) {
  buffer = fs.readFileSync(format.filename)
  console.log(hexy.hexy(buffer, format))
} else {
  var stdin = process.openStdin()
      stdin.on("data", function(data) {
        var offset = 0
        if (buffer) {
          offset = buffer.length
          buffer_ = new Buffer(buffer.length + data.length)
          buffer.copy(buffer_,0,0)
          buffer = buffer_
          data.copy(buffer, offset, data.length)
        } else {
          buffer = data 
        }
      })

      stdin.on("end", function(){
        console.log(hexy.hexy(buffer, format))
      }) 
}


