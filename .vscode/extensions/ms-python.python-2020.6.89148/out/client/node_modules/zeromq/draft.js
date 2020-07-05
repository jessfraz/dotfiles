if (require(".").capability.draft) {
  process.emitWarning(
    "ZeroMQ draft features are experimental and could change at any time.",
  )
} else {
  throw new Error(
    "ZeroMQ draft features are not enabled in this build. " +
    "To enable support, (re)compile this library with --zmq-draft.",
  )
}

module.exports = require("./lib/draft")
