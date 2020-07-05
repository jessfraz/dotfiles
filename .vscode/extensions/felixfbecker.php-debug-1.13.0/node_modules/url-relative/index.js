var url = require('url');

function urlRelative (from, to) {
  var fromUrl = url.parse(from);
  var toUrl = url.parse(to);

  if (fromUrl.host !== toUrl.host) {
    return to;
  }

  // left to right, look for closest common path segment
  var fromSegments = fromUrl.pathname.substr(1).split('/');
  var toSegments = toUrl.pathname.substr(1).split('/');

  while (fromSegments[0] === toSegments[0]) {
    fromSegments.shift();
    toSegments.shift();
  }

  var length = fromSegments.length - toSegments.length;
  if (length > 0) {
    while (length--) {
      toSegments.unshift('..');
    }
    return toSegments.join('/');
  } else if (length < 0) {
    return toSegments.join('/');
  } else {
    length = toSegments.length - 1;
    while (length--) {
      toSegments.unshift('..');
    }
    return toSegments.join('/');
  }

}

module.exports = urlRelative;
