/* globals describe, it, beforeEach */
'use strict'

var mochi = require('mochi')
var expect = mochi.expect
var EventEmitter = require('events').EventEmitter

describe('listenercount', function () {
  var listenerCount = require('../')
  var ee
  beforeEach(function () {
    ee = new EventEmitter()
  })

  it('counts 0', function () {
    expect(listenerCount(ee, 'event')).to.equal(0)
  })

  it('counts 1', function () {
    ee.on('event', function () {})
    expect(listenerCount(ee, 'event')).to.equal(1)
  })

  it('counts many', function () {
    ee.on('event', function () {})
    ee.on('event', function () {})
    ee.on('event', function () {})
    expect(listenerCount(ee, 'event')).to.equal(3)
  })

})
