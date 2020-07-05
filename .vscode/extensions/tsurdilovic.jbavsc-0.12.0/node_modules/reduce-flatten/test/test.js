var test = require('tape')
var flatten = require('../')

test('flatten', function (t) {
  var numbers = [ 1, 2, [ 3, 4 ], 5 ]
  var result = numbers.reduce(flatten, [])
  t.deepEqual(result, [ 1, 2, 3, 4, 5 ])
  t.end()
})
