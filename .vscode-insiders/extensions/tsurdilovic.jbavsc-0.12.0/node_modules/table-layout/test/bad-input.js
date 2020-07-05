'use strict'
const TestRunner = require('test-runner')
const Table = require('../')
const a = require('assert')

const runner = new TestRunner()

runner.test('table.lines(): no data', function () {
  let table = new Table([])
  a.deepEqual(table.getLines([]), [])

  table = new Table([])
  a.deepEqual(table.getLines(), [])
})
