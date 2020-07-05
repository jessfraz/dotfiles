const chalk = require('chalk')

function format (str) {
  return chalk(Object.assign([], { raw: [ str ] }))
}

function chalkFormat (str) {
  if (str) {
    str = str.replace(/`/g, '\\`')
    return format(str)
  } else {
    return ''
  }
}

module.exports = chalkFormat
