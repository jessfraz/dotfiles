var Promise = require('bluebird');
var Stream = require('stream');
var Buffer = require('./Buffer');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

module.exports = function(entry) {
  return new Promise(function(resolve,reject) {
    var chunks = [];
    var bufferStream = Stream.Transform()
      .on('finish',function() {
        resolve(Buffer.concat(chunks));
      })
      .on('error',reject);
        
    bufferStream._transform = function(d,e,cb) {
      chunks.push(d);
      cb();
    };
    entry.on('error',reject)
      .pipe(bufferStream);
  });
};
