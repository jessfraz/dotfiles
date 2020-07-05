var Stream = require('stream');
var util = require('util');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

function NoopStream() {
  if (!(this instanceof NoopStream)) {
    return new NoopStream();
  }
  Stream.Transform.call(this);
}

util.inherits(NoopStream,Stream.Transform);

NoopStream.prototype._transform = function(d,e,cb) { cb() ;};
  
module.exports = NoopStream;