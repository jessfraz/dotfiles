'use strict'

class Section {
  constructor () {
    this.list = []
  }
  add (content) {
    const chalkFormat = require('./chalk-format')
    const arrayify = require('array-back')
    arrayify(content).forEach(line => this.list.push(line))
  }
  emptyLine () {
    this.list.push('')
  }
  header (text) {
    const chalk = require('chalk')
    if (text) {
      this.add(chalk.underline.bold(text))
      this.emptyLine()
    }
  }
  toString () {
    const os = require('os')
    return this.list.join(os.EOL)
  }
}

module.exports = Section
