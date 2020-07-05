var util = require('util');
var zlib = require('zlib');
var Stream = require('stream');
var binary = require('binary');
var Promise = require('bluebird');
var PullStream = require('./PullStream');
var NoopStream = require('./NoopStream');
var BufferStream = require('./BufferStream');
var parseExtraField = require('./parseExtraField');
var Buffer = require('./Buffer');
var parseDateTime = require('./parseDateTime');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

var endDirectorySignature = Buffer.alloc(4);
endDirectorySignature.writeUInt32LE(0x06054b50, 0);

function Parse(opts) {
  if (!(this instanceof Parse)) {
    return new Parse(opts);
  }
  var self = this;
  self._opts = opts || { verbose: false };

  PullStream.call(self, self._opts);
  self.on('finish',function() {
    self.emit('close');
  });
  self._readRecord().catch(function(e) {
    if (!self.__emittedError || self.__emittedError !== e)
      self.emit('error',e);
  });
}

util.inherits(Parse, PullStream);

Parse.prototype._readRecord = function () {
  var self = this;
  return self.pull(4).then(function(data) {
    if (data.length === 0)
      return;

    var signature = data.readUInt32LE(0);

    if (signature === 0x34327243) {
      return self._readCrxHeader();
    }
    if (signature === 0x04034b50) {
      return self._readFile();
    }
    else if (signature === 0x02014b50) {
      self.__ended = true;
      return self._readCentralDirectoryFileHeader();
    }
    else if (signature === 0x06054b50) {
      return self._readEndOfCentralDirectoryRecord();
    }
    else if (self.__ended) {
      return self.pull(endDirectorySignature).then(function() {
          return self._readEndOfCentralDirectoryRecord();
        });
    }
    else
      self.emit('error', new Error('invalid signature: 0x' + signature.toString(16)));
  });
};

Parse.prototype._readCrxHeader = function() {
  var self = this;
  return self.pull(12).then(function(data) {
    self.crxHeader = binary.parse(data)
      .word32lu('version')
      .word32lu('pubKeyLength')
      .word32lu('signatureLength')
      .vars;
    return self.pull(self.crxHeader.pubKeyLength + self.crxHeader.signatureLength);
  }).then(function(data) {
    self.crxHeader.publicKey = data.slice(0,self.crxHeader.pubKeyLength);
    self.crxHeader.signature = data.slice(self.crxHeader.pubKeyLength);
    self.emit('crx-header',self.crxHeader);
    return self._readRecord();
  });
};

Parse.prototype._readFile = function () {
  var self = this;
  return self.pull(26).then(function(data) {
    var vars = binary.parse(data)
      .word16lu('versionsNeededToExtract')
      .word16lu('flags')
      .word16lu('compressionMethod')
      .word16lu('lastModifiedTime')
      .word16lu('lastModifiedDate')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .word16lu('fileNameLength')
      .word16lu('extraFieldLength')
      .vars;

    vars.lastModifiedDateTime = parseDateTime(vars.lastModifiedDate, vars.lastModifiedTime);

    if (self.crxHeader) vars.crxHeader = self.crxHeader;

    return self.pull(vars.fileNameLength).then(function(fileNameBuffer) {
      var fileName = fileNameBuffer.toString('utf8');
      var entry = Stream.PassThrough();
      var __autodraining = false;

      entry.autodrain = function() {
        __autodraining = true;
        var draining = entry.pipe(NoopStream());
        draining.promise = function() {
          return new Promise(function(resolve, reject) {
            draining.on('finish',resolve);
            draining.on('error',reject);
          });
        };
        return draining;
      };

      entry.buffer = function() {
        return BufferStream(entry);
      };

      entry.path = fileName;
      entry.props = {};
      entry.props.path = fileName;
      entry.props.pathBuffer = fileNameBuffer;
      entry.props.flags = {
        "isUnicode": vars.flags & 0x11
      };
      entry.type = (vars.uncompressedSize === 0 && /[\/\\]$/.test(fileName)) ? 'Directory' : 'File';

      if (self._opts.verbose) {
        if (entry.type === 'Directory') {
          console.log('   creating:', fileName);
        } else if (entry.type === 'File') {
          if (vars.compressionMethod === 0) {
            console.log(' extracting:', fileName);
          } else {
            console.log('  inflating:', fileName);
          }
        }
      }

      return self.pull(vars.extraFieldLength).then(function(extraField) {
        var extra = parseExtraField(extraField, vars);

        entry.vars = vars;
        entry.extra = extra;

        if (self._opts.forceStream) {
          self.push(entry);
        } else {
          self.emit('entry', entry);

          if (self._readableState.pipesCount || (self._readableState.pipes && self._readableState.pipes.length))
            self.push(entry);
        }

        if (self._opts.verbose)
          console.log({
            filename:fileName,
            vars: vars,
            extra: extra
          });

        var fileSizeKnown = !(vars.flags & 0x08) || vars.compressedSize > 0,
            eof;

        entry.__autodraining = __autodraining;  // expose __autodraining for test purposes
        var inflater = (vars.compressionMethod && !__autodraining) ? zlib.createInflateRaw() : Stream.PassThrough();

        if (fileSizeKnown) {
          entry.size = vars.uncompressedSize;
          eof = vars.compressedSize;
        } else {
          eof = Buffer.alloc(4);
          eof.writeUInt32LE(0x08074b50, 0);
        }

        return new Promise(function(resolve, reject) {
          self.stream(eof)
            .pipe(inflater)
            .on('error',function(err) { self.emit('error',err);})
            .pipe(entry)
            .on('finish', function() {
              return fileSizeKnown ?
                self._readRecord().then(resolve).catch(reject) :
                self._processDataDescriptor(entry).then(resolve).catch(reject);
            });
        });
      });
    });
  });
};

Parse.prototype._processDataDescriptor = function (entry) {
  var self = this;
  return self.pull(16).then(function(data) {
    var vars = binary.parse(data)
      .word32lu('dataDescriptorSignature')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .vars;

    entry.size = vars.uncompressedSize;
    return self._readRecord();
  });
};

Parse.prototype._readCentralDirectoryFileHeader = function () {
  var self = this;
  return self.pull(42).then(function(data) {

    var vars = binary.parse(data)
      .word16lu('versionMadeBy')
      .word16lu('versionsNeededToExtract')
      .word16lu('flags')
      .word16lu('compressionMethod')
      .word16lu('lastModifiedTime')
      .word16lu('lastModifiedDate')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .word16lu('fileNameLength')
      .word16lu('extraFieldLength')
      .word16lu('fileCommentLength')
      .word16lu('diskNumber')
      .word16lu('internalFileAttributes')
      .word32lu('externalFileAttributes')
      .word32lu('offsetToLocalFileHeader')
      .vars;

    return self.pull(vars.fileNameLength).then(function(fileName) {
      vars.fileName = fileName.toString('utf8');
      return self.pull(vars.extraFieldLength);
    })
    .then(function(extraField) {
      return self.pull(vars.fileCommentLength);
    })
    .then(function(fileComment) {
      return self._readRecord();
    });
  });
};

Parse.prototype._readEndOfCentralDirectoryRecord = function() {
  var self = this;
  return self.pull(18).then(function(data) {

    var vars = binary.parse(data)
      .word16lu('diskNumber')
      .word16lu('diskStart')
      .word16lu('numberOfRecordsOnDisk')
      .word16lu('numberOfRecords')
      .word32lu('sizeOfCentralDirectory')
      .word32lu('offsetToStartOfCentralDirectory')
      .word16lu('commentLength')
      .vars;

    return self.pull(vars.commentLength).then(function(comment) {
      comment = comment.toString('utf8');
      self.end();
      self.push(null);
    });

  });
};

Parse.prototype.promise = function() {
  var self = this;
  return new Promise(function(resolve,reject) {
    self.on('finish',resolve);
    self.on('error',reject);
  });
};

module.exports = Parse;
