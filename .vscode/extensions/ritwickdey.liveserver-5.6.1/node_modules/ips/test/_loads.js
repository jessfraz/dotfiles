// _loads.js
'use strict';

var should = require('should')

describe('package', function() {
  var test

  it('loads', function() {
      test = require('../index.js')
      test.should.be.ok
  })

})
