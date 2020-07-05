'use strict'
const Table = require('table-layout')
const chalkFormat = require('./chalk-format')
const t = require('typical')

class Content {
  constructor (content) {
    this._content = content
  }

  lines () {
    const content = this._content
    const defaultPadding = { left: '  ', right: ' ' }

    if (content) {
      /* string content */
      if (t.isString(content)) {
        const table = new Table({ column: chalkFormat(content) }, {
          padding: defaultPadding,
          maxWidth: 80
        })
        return table.renderLines()

      /* array of strings */
      } else if (Array.isArray(content) && content.every(t.isString)) {
        const rows = content.map(string => ({ column: chalkFormat(string) }))
        const table = new Table(rows, {
          padding: defaultPadding,
          maxWidth: 80
        })
        return table.renderLines()

      /* array of objects (use table-layout) */
      } else if (Array.isArray(content) && content.every(t.isPlainObject)) {
        const table = new Table(content.map(row => ansiFormatRow(row)), {
          padding: defaultPadding
        })
        return table.renderLines()

      /* { options: object, data: object[] } */
      } else if (t.isPlainObject(content)) {
        if (!content.options || !content.data) {
          throw new Error('must have an "options" or "data" property\n' + JSON.stringify(content))
        }
        const options = Object.assign(
          { padding: defaultPadding },
          content.options
        )

        /* convert nowrap to noWrap to avoid breaking compatibility */
        if (options.columns) {
          options.columns = options.columns.map(column => {
            if (column.nowrap) {
              column.noWrap = column.nowrap
              delete column.nowrap
            }
            return column
          })
        }

        const table = new Table(
          content.data.map(row => ansiFormatRow(row)),
          options
        )
        return table.renderLines()
      } else {
        const message = `invalid input - 'content' must be a string, array of strings, or array of plain objects:\n\n${JSON.stringify(content)}`
        throw new Error(message)
      }
    }
  }
}

function ansiFormatRow (row) {
  for (const key in row) {
    row[key] = chalkFormat(row[key])
  }
  return row
}

module.exports = Content
