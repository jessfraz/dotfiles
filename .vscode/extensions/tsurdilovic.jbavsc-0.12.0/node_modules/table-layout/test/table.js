'use strict'
const TestRunner = require('test-runner')
const Table = require('../')
const os = require('os')
const a = require('assert')

const runner = new TestRunner()

runner.test('new Table()', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const table = new Table(fixture.data, fixture.options)

  a.strictEqual(table.rows.list.length, 2)
  a.strictEqual(table.columns.list.length, 2)
})

runner.test('table.getWrapped()', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const table = new Table(fixture.data, fixture.options)

  a.deepEqual(table.getWrapped(), [
    [ ['row 1 column one ..', '.. ..'], ['r1 c2'] ],
    [ ['r2 c1'], ['row two column 2'] ]
  ])
})

runner.test('table.getLines()', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const table = new Table(fixture.data, fixture.options)

  a.deepEqual(table.getLines(), [
    [ 'row 1 column one ..', 'r1 c2' ],
    [ '.. ..', '' ],
    [ 'r2 c1', 'row two column 2' ]
  ])
})

runner.test('table.renderLines()', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const table = new Table(fixture.data, fixture.options)

  a.deepEqual(table.renderLines(), [
    '<row 1 column one .. ><r1 c2           >',
    '<.. ..               ><                >',
    '<r2 c1               ><row two column 2>'
  ])
})

runner.test('table.toString()', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const result = [
    '<row 1 column one .. ><r1 c2           >',
    '<.. ..               ><                >',
    '<r2 c1               ><row two column 2>'
  ].join(os.EOL) + os.EOL

  const table = new Table(fixture.data, fixture.options)
  a.strictEqual(table.toString(), result)
})

runner.test('table.renderLines() 2', function () {
  const fixture = require('./fixture/simple-maxWidth')
  const result = [
    '<row 1 column one .. ><r1 c2           >',
    '<.. ..               ><                >',
    '<r2 c1               ><row two column 2>'
  ]

  const table = new Table(fixture.data, fixture.options)
  a.deepEqual(table.renderLines(), result)
})

runner.test('table.renderLines() 3', function () {
  const fixture = require('./fixture/primatives')
  const result = [
    '<row 1 column one .. .. ..><3000>',
    '<true                     ><null>',
    '<[object Object]          ><    >'
  ]

  const table = new Table(fixture.data, fixture.options)
  a.deepEqual(table.renderLines(), result)
})
