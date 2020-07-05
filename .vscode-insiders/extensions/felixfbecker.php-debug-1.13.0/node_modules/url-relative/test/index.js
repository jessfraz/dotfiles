var test = require('tap').test;

var relative = require('../index');

test('different domain', function (t) {
  t.plan(1);
  t.equal(
    relative('http://a.com:12/a', 'http://b.com/a'),
    'http://b.com/a');
});

test('same domain', function (t) {
  t.plan(1);
  t.equal(
    relative('http://a.com/a', 'http://a.com/b'),
    'b');
});

test('divergent paths, longer from', function (t) {
  t.plan(2);
  t.equal(
    relative('/a/b/c/d','/a/b/d'),
    '../d');
  t.equal(
    relative('/a/b/c/d/e','/a/d/e'),
    '../../d/e');
});

test('divergent paths, longer to', function (t) {
  t.plan(3);
  t.equal(
    relative('/a/b/c/d','/a/b/c/d/e'),
    'e');
  t.equal(
    relative('/a/b/c/d','/a/b/c/d/e/f'),
    'e/f');
  t.equal(
    relative('/','/a/b'),
    'a/b');
});

test('divergent paths, equal length', function (t) {
  t.plan(1);
  t.equal(
    relative('/a/b/c/d/e/f','/a/b/c/g/h/j'),
    '../../g/h/j');
});