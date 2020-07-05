var binary = require('binary');

module.exports = function(extraField, vars) {
  var extra;
  // Find the ZIP64 header, if present.
  while(!extra && extraField && extraField.length) {
    var candidateExtra = binary.parse(extraField)
      .word16lu('signature')
      .word16lu('partsize')
      .word64lu('uncompressedSize')
      .word64lu('compressedSize')
      .word64lu('offset')
      .word64lu('disknum')
      .vars;

    if(candidateExtra.signature === 0x0001) {
      extra = candidateExtra;
    } else {
      // Advance the buffer to the next part.
      // The total size of this part is the 4 byte header + partsize.
      extraField = extraField.slice(candidateExtra.partsize + 4);
    }
  }

  extra = extra || {};

  if (vars.compressedSize === 0xffffffff)
    vars.compressedSize = extra.compressedSize;

  if (vars.uncompressedSize  === 0xffffffff)
    vars.uncompressedSize= extra.uncompressedSize;

  if (vars.offsetToLocalFileHeader === 0xffffffff)
    vars.offsetToLocalFileHeader= extra.offset;

  return extra;
};
