'use strict'
const TestRunner = require('test-runner')
const Rows = require('../lib/rows')
const a = require('assert')

const runner = new TestRunner()

runner.test('removeEmptyColumns', function () {
  const input = [
    { name: 'Lloyd', 'age': '' },
    { name: 'Roger', 'age': ' ' },
    { name: 'Amir' },
    { name: 'Frank' },
    { name: 'Amy' }
  ]
  a.deepEqual(
    Rows.removeEmptyColumns(input),
    [
      { name: 'Lloyd' },
      { name: 'Roger' },
      { name: 'Amir' },
      { name: 'Frank' },
      { name: 'Amy' }
    ]
  )
})
