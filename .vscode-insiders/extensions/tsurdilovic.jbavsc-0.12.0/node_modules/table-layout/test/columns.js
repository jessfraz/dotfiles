'use strict'
const TestRunner = require('test-runner')
const Columns = require('../lib/columns')
const a = require('assert')

const runner = new TestRunner()

runner.test('columns.autoSize(contentColumns, maxWidth)', function () {
  const columns = new Columns([
    { name: 'one', contentWidth: 10, contentWrappable: true },
    { name: 'two', contentWidth: 20, contentWrappable: true }
  ])

  columns.maxWidth = 30
  columns.autoSize()
  a.strictEqual(columns.list[0].generatedWidth, 12)
  a.strictEqual(columns.list[1].generatedWidth, 18)
})
