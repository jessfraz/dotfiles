

'use strict';

var figlet = require('../lib/node-figlet'),
    grunt = require('grunt'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.figlet = {
    setUp: function(done) {
        // setup here if necessary
        done();
    },
    standard: function(test) {
        test.expect(1);

        figlet('FIGlet\nFONTS', {
            font: 'Standard',
            verticalLayout: 'fitted'
        }, function(err, actual) {
            var expected = grunt.file.read('test/expected/standard');
            test.equal(actual, expected, 'Standard font with a vertical layout of "fitted".');

            test.done();
        });
    },
    standardSync: function(test) {
        test.expect(1);

        var expected = grunt.file.read('test/expected/standard');
        var actual = figlet.textSync('FIGlet\nFONTS', {font: 'Standard', verticalLayout: 'fitted'});

        test.equal(actual, expected, 'Standard font with a vertical layout of "fitted".');

        test.done();
    },
    standardParse: function(test) {
        test.expect(1);

        var expected = grunt.file.read('test/expected/standard');
        var data = fs.readFileSync(path.join(__dirname, '../fonts/Standard.flf'), 'utf8');
        var font = figlet.parseFont('StandardParseFontName', data);
        var actual = figlet.textSync('FIGlet\nFONTS', {font: 'StandardParseFontName', verticalLayout: 'fitted'});

        test.equal(actual, expected, 'Standard font with a vertical layout of "fitted" loaded using parseFont().');

        test.done();
    },
    graffiti: function(test) {
        test.expect(1);

        figlet.text('ABC.123', {
            font: 'Graffiti',
            horizontalLayout: 'fitted'
        }, function(err, actual) {
            var expected = grunt.file.read('test/expected/graffiti');
            test.equal(actual, expected, 'Graffiti font with a horizontal layout of "fitted".');

            test.done();
        });
    },
    graffitiSync: function(test) {
        test.expect(1);

        var expected = grunt.file.read('test/expected/graffiti');
        var actual = figlet.textSync('ABC.123', {font: 'Graffiti', horizontalLayout: 'fitted'});
        test.equal(actual, expected, 'Graffiti font with a horizontal layout of "fitted".');

        test.done();
    },
    dancingFont: function(test) {
        test.expect(1);

        figlet.text('pizzapie', {
            font: 'Dancing Font',
            horizontalLayout: 'full'
        }, function(err, actual) {

            var expected = grunt.file.read('test/expected/dancingFont');
            test.equal(actual, expected, 'Dancing Font with a horizontal layout of "full".');

            test.done();
        });
    },
    dancingFontSync: function(test) {
        test.expect(1);

        var expected = grunt.file.read('test/expected/dancingFont');
        var actual = figlet.textSync('pizzapie', {font: 'Dancing Font', horizontalLayout: 'full'});
        test.equal(actual, expected, 'Dancing Font with a horizontal layout of "full".');

        test.done();
    },
    printDirection: function(test) {
        test.expect(1);

        figlet.text('pizzapie', {
            font: 'Dancing Font',
            horizontalLayout: 'full',
            printDirection: 1
        }, function(err, actual) {

            var expected = grunt.file.read('test/expected/dancingFontReverse');
            test.equal(actual, expected, 'Dancing Font with a reversed print direction.');

            test.done();
        });
    },
    /*
        This test ensures that all fonts will load without error
    */
    loadAll: function(test) {
        var errCount = 0;
        test.expect(1);

        figlet.fonts(function(err, fonts) {
            if (err) {
                errCount++;
                return;
            }

            async.eachSeries(fonts, function(font, next) {
                figlet.text('abc ABC ...', {
                    font: font
                }, function(err, data) {
                    if (err) {
                        errCount++;
                    }
                    next();
                });
            }, function(err) {
                test.equal(errCount, 0, 'A problem occurred while testing one of the fonts.');
                test.done();
            });
        });
    }
};
