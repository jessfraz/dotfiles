'use strict'
const TestRunner = require('test-runner')
const wordwrap = require('./')
const a = require('assert')

const runner = new TestRunner()
const bars = "I'm rapping. I'm rapping. I'm rap rap rapping. I'm rap rap rap rap rappity rapping."

runner.test('simple', function () {
  a.strictEqual(
    wordwrap.wrap(bars),
    "I'm rapping. I'm rapping. I'm\nrap rap rapping. I'm rap rap\nrap rap rappity rapping."
  )
})

runner.test('width', function () {
  a.strictEqual(
    wordwrap.wrap(bars, { width: 3 }),
    "I'm\nrapping.\nI'm\nrapping.\nI'm\nrap\nrap\nrapping.\nI'm\nrap\nrap\nrap\nrap\nrappity\nrapping."
  )
})

runner.skip('ignore', function () {
  a.strictEqual(
    wrap(bars, { ignore: "I'm" }),
    "I'm rapping. I'm rapping. I'm rap rap\nrapping. I'm rap rap rap rap\nrappity rapping."
  )
})

runner.test('wordwrap.lines', function () {
  a.deepStrictEqual(
    wordwrap.lines(bars),
    [ "I'm rapping. I'm rapping. I'm",
      "rap rap rapping. I'm rap rap",
      'rap rap rappity rapping.' ]
  )
})

runner.test('wordwrap.lines, width', function () {
  a.deepStrictEqual(
    wordwrap.lines(bars, { width: 3 }),
    [ "I'm",
      'rapping.',
      "I'm",
      'rapping.',
      "I'm",
      'rap',
      'rap',
      'rapping.',
      "I'm",
      'rap',
      'rap',
      'rap',
      'rap',
      'rappity',
      'rapping.' ]
  )
})

runner.test('wordwrap.lines, width smaller than content width', function () {
  a.deepStrictEqual(
    wordwrap.lines('4444', { width: 3 }),
    [ '4444' ]
  )
  a.deepStrictEqual(
    wordwrap.lines('onetwothreefour fivesixseveneight', { width: 7 }),
    [ 'onetwothreefour', 'fivesixseveneight' ]
  )
})

runner.test('wordwrap.lines, break', function () {
  a.deepStrictEqual(
    wordwrap.lines('onetwothreefour', { width: 7, break: true }),
    [ 'onetwot', 'hreefou', 'r' ]
  )
  a.deepStrictEqual(
    wordwrap.lines('\u001b[4m--------\u001b[0m', { width: 10, break: true, ignore: /\u001b.*?m/g }),
    [ '\u001b[4m--------\u001b[0m' ]
  )
  a.deepStrictEqual(
    wordwrap.lines(
      'onetwothreefour fivesixseveneight',
      { width: 7, break: true }
    ),
    [ 'onetwot', 'hreefou', 'r', 'fivesix', 'sevenei', 'ght' ]
  )
})

runner.test('wordwrap.lines(text): respect existing linebreaks', function () {
  a.deepStrictEqual(
    wordwrap.lines('one\ntwo three four', { width: 8 }),
    [ 'one', 'two', 'three', 'four' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('one \n \n two three four', { width: 8 }),
    [ 'one', '', 'two', 'three', 'four' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('one\r\ntwo three four', { width: 8 }),
    [ 'one', 'two', 'three', 'four' ]
  )
})

runner.test('wordwrap.lines(text): multilingual', function () {
  a.deepStrictEqual(
    wordwrap.lines('Può parlare più lentamente?', { width: 10 }),
    [ 'Può', 'parlare', 'più', 'lentamente?' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('один два три', { width: 4 }),
    [ 'один', 'два', 'три' ]
  )
})

runner.test('wrap hyphenated words', function () {
  a.deepStrictEqual(
    wordwrap.lines('ones-and-twos', { width: 5 }),
    [ 'ones-', 'and-', 'twos' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('ones-and-twos', { width: 10 }),
    [ 'ones-and-', 'twos' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('--------', { width: 5 }),
    [ '--------' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('--one --fifteen', { width: 5 }),
    [ '--one', '--fifteen' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('one-two', { width: 10 }),
    [ 'one-two' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('ansi-escape-sequences', { width: 22 }),
    [ 'ansi-escape-sequences' ]
  )

  a.deepStrictEqual(
    wordwrap.lines('one - two'),
    [ 'one - two' ]
  )
})

runner.test('isWrappable(input)', function () {
  a.strictEqual(wordwrap.isWrappable('one two'), true)
  a.strictEqual(wordwrap.isWrappable('one-two'), true)
  a.strictEqual(wordwrap.isWrappable('one\ntwo'), true)
})

runner.test('getChunks', function () {
  a.deepStrictEqual(wordwrap.getChunks('one two three'), [ 'one', ' ', 'two', ' ', 'three' ])
})

runner.test('noTrim', function () {
  a.deepStrictEqual(wordwrap.lines('word\n - word\n - word'), [
    'word', '- word', '- word'
  ])
  a.deepStrictEqual(wordwrap.lines('word\n - word\n - word', { noTrim: true }), [
    'word', ' - word', ' - word'
  ])
})

runner.test('wrapping text containing ansi escape sequences', function () {
  a.deepStrictEqual(
    wordwrap.wrap('Generates something \u001b[3mvery\u001b[0m important.', { width: 35 }),
    'Generates something \u001b[3mvery\u001b[0m important.'
  )
})

runner.test('non-string input', function () {
  a.strictEqual(wordwrap.wrap(undefined), '')
  a.strictEqual(wordwrap.wrap(function () {}), 'function () {}')
  a.strictEqual(wordwrap.wrap({}), '[object Object]')
  a.strictEqual(wordwrap.wrap(null), 'null')
  a.strictEqual(wordwrap.wrap(true), 'true')
  a.strictEqual(wordwrap.wrap(0), '0')
  a.strictEqual(wordwrap.wrap(NaN), 'NaN')
  a.strictEqual(wordwrap.wrap(Infinity), 'Infinity')
})
