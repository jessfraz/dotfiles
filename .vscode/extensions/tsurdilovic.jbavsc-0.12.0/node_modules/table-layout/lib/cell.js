'use strict'
const t = require('typical')

const _value = new WeakMap()
const _column = new WeakMap()

class Cell {
  constructor (value, column) {
    this.value = value
    _column.set(this, column)
  }

  set value (val) {
    _value.set(this, val)
  }

  get value () {
    let cellValue = _value.get(this)
    if (t.isFunction(cellValue)) cellValue = cellValue.call(_column.get(this))
    if (cellValue === undefined) {
      cellValue = ''
    } else {
      cellValue = String(cellValue)
    }
    return cellValue
  }
}

module.exports = Cell
