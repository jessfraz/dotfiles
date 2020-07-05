'use strict'
const Section = require('./section')
const Table = require('table-layout')
const chalkFormat = require('./chalk-format')
const t = require('typical')
const arrayify = require('array-back')

class OptionList extends Section {
  constructor (data) {
    super()
    let definitions = arrayify(data.optionList)
    const hide = arrayify(data.hide)
    const groups = arrayify(data.group)

    /* filter out hidden definitions */
    if (hide.length) {
      definitions = definitions.filter(definition => {
        return hide.indexOf(definition.name) === -1
      })
    }

    /* All definitions must have a name */
    const validNames = definitions.every(d => d.name)
    if (!validNames) {
      throw new Error('Every definition in the optionList must have a `name` property')
    }

    if (data.header) this.header(data.header)

    if (groups.length) {
      definitions = definitions.filter(def => {
        const noGroupMatch = groups.indexOf('_none') > -1 && !t.isDefined(def.group)
        const groupMatch = intersect(arrayify(def.group), groups)
        if (noGroupMatch || groupMatch) return def
      })
    }

    const rows = definitions.map(def => {
      return {
        option: getOptionNames(def, data.reverseNameOrder),
        description: chalkFormat(def.description)
      }
    })

    const tableOptions = data.tableOptions || {
      padding: { left: '  ', right: ' ' },
      columns: [
        { name: 'option', noWrap: true },
        { name: 'description', maxWidth: 80 }
      ]
    }
    const table = new Table(rows, tableOptions)
    this.add(table.renderLines())

    this.emptyLine()
  }
}

function getOptionNames (definition, reverseNameOrder) {
  let type = definition.type ? definition.type.name.toLowerCase() : ''
  const multiple = definition.multiple ? '[]' : ''
  if (type) {
    type = type === 'boolean' ? '' : `{underline ${type}${multiple}}`
  }
  // console.error(require('util').inspect(definition.typeLabel || type, { depth: 6, colors: true }))
  type = chalkFormat(definition.typeLabel || type)

  let result = ''
  if (definition.alias) {
    if (reverseNameOrder) {
      result = `${chalkFormat(`{bold --${definition.name}}`)}, ${chalkFormat(`{bold -${definition.alias}}`)} ${type}`
    } else {
      result = `${chalkFormat(`{bold -${definition.alias}}`)}, ${chalkFormat(`{bold --${definition.name}} ${type}`)}`
    }
  } else {
    result = `${chalkFormat(`{bold --${definition.name}}`)} ${type}`
  }
  return result
}

function intersect (arr1, arr2) {
  return arr1.some(function (item1) {
    return arr2.some(function (item2) {
      return item1 === item2
    })
  })
}

module.exports = OptionList
