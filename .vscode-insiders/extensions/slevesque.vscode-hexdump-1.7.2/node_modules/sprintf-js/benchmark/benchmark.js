var Benchmark   = require('benchmark'),
    suite       = new Benchmark.Suite,
    sprintfjs   = require('../src/sprintf.js'),
    sprintf     = sprintfjs.sprintf

suite
    .add('%8d', function() {
        sprintf('%8d', 12345)
    })
    .add('%08d', function() {
        sprintf('%08d', 12345)
    })
    .add('%2d', function() {
        sprintf('%2d', 12345)
    })
    .add('%8s', function() {
        sprintf('%8s', 'abcde')
    })
    .add('%+010d', function() {
        sprintf('%+010d', 12345)
    })

module.exports = suite
