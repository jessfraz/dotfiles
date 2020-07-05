'use strict'
const Section = require('./section')

class ContentSection extends Section {
  constructor (section) {
    super()
    this.header(section.header)

    if (section.content) {
      /* add content without indentation or wrapping */
      if (section.raw) {
        const arrayify = require('array-back')
        const chalkFormat = require('./chalk-format')
        const content = arrayify(section.content).map(line => chalkFormat(line))
        this.add(content)
      } else {
        const Content = require('./content')
        const content = new Content(section.content)
        this.add(content.lines())
      }

      this.emptyLine()
    }
  }
}

module.exports = ContentSection
