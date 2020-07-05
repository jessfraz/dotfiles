/**!
 * urlencode - lib/urlencode.js
 *
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var iconv = require('iconv-lite');

function isUTF8(charset) {
  if (!charset) {
    return true;
  }
  charset = charset.toLowerCase();
  return charset === 'utf8' || charset === 'utf-8';
}

function encode(str, charset) {
  if (isUTF8(charset)) {
    return encodeURIComponent(str);
  }

  var buf = iconv.encode(str, charset);
  var encodeStr = '';
  var ch = '';
  for (var i = 0; i < buf.length; i++) {
    ch = buf[i].toString('16');
    if (ch.length === 1) {
      ch = '0' + ch;
    }
    encodeStr += '%' + ch;
  }
  encodeStr = encodeStr.toUpperCase();
  return encodeStr;
}

function decode(str, charset) {
  if (isUTF8(charset)) {
    return decodeURIComponent(str);
  }

  var bytes = [];
  for (var i = 0; i < str.length; ) {
    if (str[i] === '%') {
      i++;
      bytes.push(parseInt(str.substring(i, i + 2), 16));
      i += 2;
    } else {
      bytes.push(str.charCodeAt(i));
      i++;
    }
  }
  var buf = new Buffer(bytes);
  return iconv.decode(buf, charset);
}

function parse(qs, sep, eq, options) {
  if (typeof sep === 'object') {
    // parse(qs, options)
    options = sep;
    sep = null;
  }

  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  var charset = null;
  if (options) {
    if (typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }
    if (typeof options.charset === 'string') {
      charset = options.charset;
    }
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20');
    var idx = x.indexOf(eq);
    var kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    if (kstr && kstr.indexOf('%') >= 0) {
      try {
        k = decode(kstr, charset);
      } catch (e) {
        k = kstr;
      }
    } else {
      k = kstr;
    }

    if (vstr && vstr.indexOf('%') >= 0) {
      try {
        v = decode(vstr, charset);
      } catch (e) {
        v = vstr;
      }
    } else {
      v = vstr;
    }

    if (!has(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
}

function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isASCII(str) {
  return (/^[\x00-\x7F]*$/).test(str);
}

function encodeComponent(item, charset) {
  item = String(item);
  if (isASCII(item)) {
    item = encodeURIComponent(item);
  } else {
    item = encode(item, charset);
  }
  return item;
}

var stringify = function(obj, prefix, options) {
  if (typeof prefix !== 'string') {
    options = prefix || {};
    prefix = null;
  }
  var charset = options.charset || 'utf-8';
  if (Array.isArray(obj)) {
    return stringifyArray(obj, prefix, options);
  } else if ('[object Object]' === {}.toString.call(obj)) {
    return stringifyObject(obj, prefix, options);
  } else if ('string' === typeof obj) {
    return stringifyString(obj, prefix, options);
  } else {
    return prefix + '=' + encodeComponent(String(obj), charset);
  }
};

function stringifyString(str, prefix, options) {
  if (!prefix) {
    throw new TypeError('stringify expects an object');
  }
  var charset = options.charset;
  return prefix + '=' + encodeComponent(str, charset);
}

function stringifyArray(arr, prefix, options) {
  var ret = [];
  if (!prefix) {
    throw new TypeError('stringify expects an object');
  }
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']', options));
  }
  return ret.join('&');
}

function stringifyObject(obj, prefix, options) {
  var ret = [];
  var keys = Object.keys(obj);
  var key;

  var charset = options.charset;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if ('' === key) {
      continue;
    }
    if (null === obj[key]) {
      ret.push(encode(key, charset) + '=');
    } else {
      ret.push(stringify(
        obj[key],
        prefix ? prefix + '[' + encodeComponent(key, charset) + ']': encodeComponent(key, charset),
        options));
    }
  }

  return ret.join('&');
}

module.exports = encode;
module.exports.encode = encode;
module.exports.decode = decode;
module.exports.parse = parse;
module.exports.stringify = stringify;
