var testCase     = require('nodeunit').testCase,
    randomstring = require('randomstring'),
    mkdirp       = require('mkdirp'),
    path         = require('path'),
    fs           = require('fs'),
    async        = require('async'),
    rimraf       = require('rimraf'),
    os           = require('os'),
    findRemoveSync

var rootDirectory = path.join(os.tmpdir(), 'find-remove')

function generateRandomFilename(ext) {
    var filename = randomstring.generate(24)

    if (ext)
        filename += '.' + ext

    return filename
}

/*
 pre defined directories:
    + rootDirectory

        * randomFile1 (*.bak)
        * randomFile2 (*.log)
        * randomFile3 (*.log)
        * randomFile4 (*.csv)

        + CVS (directory3)
        + directory1
            + CVS (directory1_3)
            + directory1_1
            + directory1_2
                + directory1_2_1
                    * randomFile1_2_1_1 (*.log)
                    * randomFile1_2_1_2 (*.bak)
                    * randomFile1_2_1_3 (*.bak)
                    * fixFile1_2_1_4 (something.jpg)
                    * fixFile1_2_1_5 (something.png)
                + directory1_2_2
        + directory2
            * randomFile2_1 (*.bak)
            * randomFile2_2 (*.csv)
 */

var directory1 = path.join(rootDirectory, 'directory1')
var directory2 = path.join(rootDirectory, 'directory2')
var directory3 = path.join(rootDirectory, 'CVS')

var directory1_1 = path.join(directory1, 'directory1_1')
var directory1_2 = path.join(directory1, 'directory1_2')
var directory1_3 = path.join(directory1, 'CVS')

var directory1_2_1 = path.join(directory1_2, 'directory1_2_1')
var directory1_2_2 = path.join(directory1_2, 'directory1_2_2')

// mix of pre defined and random file names
var randomFilename1 = generateRandomFilename('bak')
var randomFile1 = path.join(rootDirectory, randomFilename1)
var randomFilename2 = generateRandomFilename('log')
var randomFile2 = path.join(rootDirectory, randomFilename2)
var randomFile3 = path.join(rootDirectory, generateRandomFilename('log'))
var randomFile4 = path.join(rootDirectory, generateRandomFilename('csv'))

var randomFile2_1 = path.join(directory2, generateRandomFilename('bak'))
var randomFile2_2 = path.join(directory2, generateRandomFilename('csv'))

var randomFilename1_2_1_1 = generateRandomFilename('log')
var randomFile1_2_1_1 = path.join(directory1_2_1, randomFilename1_2_1_1)
var randomFile1_2_1_2 = path.join(directory1_2_1, generateRandomFilename('bak'))
var randomFilename1_2_1_3 = generateRandomFilename('bak')
var randomFile1_2_1_3 = path.join(directory1_2_1, randomFilename1_2_1_3)

var fixFilename1_2_1_4 = 'something.jpg'
var fixFile1_2_1_4 = path.join(directory1_2_1, fixFilename1_2_1_4)
var fixFilename1_2_1_5 = 'something.png'
var fixFile1_2_1_5 = path.join(directory1_2_1, fixFilename1_2_1_5)

function makeFile(file, cb) {
    fs.writeFile(file, '', function(err) {
        if (err)
            cb(err)
        else
            cb(null)
    })
}

function createFakeDirectoryTree(cb) {

    async.series(
        [
            function(cb) {mkdirp(directory1, cb)},
            function(cb) {mkdirp(directory2, cb)},
            function(cb) {mkdirp(directory3, cb)},

            function(cb) {mkdirp(directory1_1, cb)},
            function(cb) {mkdirp(directory1_2, cb)},
            function(cb) {mkdirp(directory1_3, cb)},

            function(cb) {mkdirp(directory1_2_1, cb)},
            function(cb) {mkdirp(directory1_2_2, cb)},

            function(cb) {makeFile(randomFile1, cb)},
            function(cb) {makeFile(randomFile2, cb)},
            function(cb) {makeFile(randomFile3, cb)},
            function(cb) {makeFile(randomFile4, cb)},

            function(cb) {makeFile(randomFile2_1, cb)},
            function(cb) {makeFile(randomFile2_2, cb)},

            function(cb) {makeFile(randomFile1_2_1_1, cb)},
            function(cb) {makeFile(randomFile1_2_1_2, cb)},
            function(cb) {makeFile(randomFile1_2_1_3, cb)},
            function(cb) {makeFile(fixFile1_2_1_4, cb)},
            function(cb) {makeFile(fixFile1_2_1_5, cb)}
        ],

        function(err) {
            if (err) {
                console.error(err)
            } else {
                cb()
            }
        }
    )
}

function destroyFakeDirectoryTree(cb) {
    rimraf(rootDirectory, cb)
}

module.exports = testCase({

    'TC 1: tests without real files': testCase({
        'loading findRemoveSync function (require)': function(t) {
            findRemoveSync = require('../find-remove.js')

            t.ok(findRemoveSync, 'findRemoveSync is loaded.')
            t.done()
        },

        'removing non-existing directory': function(t) {
            var result, dir = generateRandomFilename()

            result = findRemoveSync(dir)
            t.strictEqual(Object.keys(result).length, 0, 'returned empty')

            t.done()
        }
    }),

    'TC 2: tests with real files': testCase({

        setUp: function(cb) {
            createFakeDirectoryTree(cb)
        },
        tearDown: function(cb) {
            destroyFakeDirectoryTree(cb)
        },

        'findRemoveSync(nonexisting)': function(t) {
            var result = findRemoveSync('/tmp/blahblah/hehehe/yo/what/')

            t.strictEqual(Object.keys(result).length, 0, 'did nothing.')

            t.done()
        },

        'findRemoveSync(no params)': function(t) {
            var result = findRemoveSync(rootDirectory)

            t.strictEqual(Object.keys(result).length, 0, 'did nothing.')

            var exists = fs.existsSync(rootDirectory)
            t.equal(exists, true, 'did not remove root directory')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'findRemoveSync(no params) did not remove directory1_1')

            t.done()
        },

        'findRemoveSync(all files)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*"})

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'did not remove directory1_1')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, false, 'removed randomFile1_2_1_2 fine')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'removed randomFile1_2_1_3 fine')

            t.done()
        },

        'findRemoveSync(all directories)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: "*"})

            t.strictEqual(Object.keys(result).length, 8, 'all 8 directories deleted')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, false, 'removed directory1_1')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, false, 'removed randomFile1_2_1_2')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'removed randomFile1_2_1_3')

            t.done()
        },

        'findRemoveSync(everything)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: "*", files: "*.*"})

            t.strictEqual(Object.keys(result).length, 19, 'all 19 directories + files deleted')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, false, 'removed directory1_1')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, false, 'did not remove randomFile1_2_1_2 fine')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'dit not remove randomFile1_2_1_3 fine')

            t.done()
        },

        'findRemoveSync(files no hit)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "no.hit.me"})

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'did not remove directory1_1')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, true, 'did not remove randomFile1_2_1_3')

            t.done()
        },

        'findRemoveSync(directory1_2_1)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: 'directory1_2_1'})

            var exists1_2_1 = fs.existsSync(directory1_2_1)
            t.equal(exists1_2_1, false, 'did remove directory1_2_1')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'did not remove directory1_1')

            t.done()
        },


        'findRemoveSync(one directory and all files)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: 'directory1_2_1', files: '*.*'})

            var exists1_2_1 = fs.existsSync(directory1_2_1)
            t.equal(exists1_2_1, false, 'did remove directory1_2_1')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'did not remove directory1_1')

            t.ok(result[randomFile1_2_1_1], 'randomFile1_2_1_1 is in result')
            t.ok(result[randomFile1_2_1_2], 'randomFile1_2_1_2 is in result')
            t.ok(result[randomFile1_2_1_3], 'randomFile1_2_1_3 is in result')
            t.ok(result[directory1_2_1], 'directory1_2_1 is in result')

            t.done()
        },

        'findRemoveSync(another directory and all files)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: 'directory2', files: '*.*'})

            var exists2 = fs.existsSync(directory2)
            t.equal(exists2, false, 'directory2 not removed')

            var exists1_2 = fs.existsSync(directory1_2)
            t.equal(exists1_2, true, 'directory1_2 not removed')

            t.ok(result[randomFile2_1], 'randomFile2_1 is in result')

            t.done()
        },

        'findRemoveSync(all bak files from root)': function(t) {
            findRemoveSync(rootDirectory, {extensions: '.bak'})

            var exists1 = fs.existsSync(randomFile1)
            var exists2_1 = fs.existsSync(randomFile2_1)
            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)

            t.equal(exists1, false, 'findRemoveSync(all bak files from root) removed randomFile1 fine')
            t.equal(exists2_1, false, 'findRemoveSync(all bak files from root) removed exists2_1 fine')
            t.equal(exists1_2_1_2, false, 'findRemoveSync(all bak files from root) removed exists1_2_1_2 fine')
            t.equal(exists1_2_1_3, false, 'findRemoveSync(all bak files from root) removed exists1_2_1_3 fine')

            var exists3 = fs.existsSync(randomFile3)
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            var exists0 = fs.existsSync(rootDirectory)
            var exists1_2_1 = fs.existsSync(directory1_2_1)

            t.equal(exists3, true, 'findRemoveSync(all bak files from root) did not remove log file exists3')
            t.equal(exists1_2_1_1, true, 'findRemoveSync(all bak files from root) did not remove log file exists1_2_1_1')
            t.equal(exists0, true, 'findRemoveSync(all bak files from root) did not remove root directory')
            t.equal(exists1_2_1, true, 'findRemoveSync(all bak files from root) did not remove directory directory1_2_1')

            t.done()
        },

        'findRemoveSync(all log files from directory1_2_1)': function(t) {
            findRemoveSync(directory1_2_1, {extensions: '.log'})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(all log files from directory1_2_1) removed randomFile1_2_1_1 fine')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, true, 'findRemoveSync(all log files from directory1_2_1) did not remove file randomFile1_2_1_2')

            var exists1_2_1 = fs.existsSync(directory1_2_1)
            t.equal(exists1_2_1, true, 'findRemoveSync(all log files from directory1_2_1) did not remove directory directory1_2_1')

            t.done()
        },

        'findRemoveSync(all bak or log files from root)': function(t) {
            findRemoveSync(rootDirectory, {extensions: ['.bak', '.log']})

            var exists1 = fs.existsSync(randomFile1)
            var exists2_1 = fs.existsSync(randomFile2_1)
            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)

            var exists2 = fs.existsSync(randomFile2)
            var exists3 = fs.existsSync(randomFile3)
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)

            t.equal(exists1, false, 'findRemoveSync(all bak and log files from root) removed randomFile1 fine')
            t.equal(exists2_1, false, 'findRemoveSync(all bak and log files from root) removed exists2_1 fine')
            t.equal(exists1_2_1_2, false, 'findRemoveSync(all bak and log files from root) removed exists1_2_1_2 fine')
            t.equal(exists1_2_1_3, false, 'findRemoveSync(all bak and log files from root) removed exists1_2_1_3 fine')

            t.equal(exists2, false, 'findRemoveSync(all bak and log files from root) removed exists2 fine')
            t.equal(exists3, false, 'findRemoveSync(all bak and log files from root) removed exists3 fine')
            t.equal(exists1_2_1_1, false, 'findRemoveSync(all bak and log files from root) removed exists1_2_1_1 fine')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'findRemoveSync(all bak and log files from root) did not remove directory1_1')

            t.done()
        },

        'findRemoveSync(filename randomFilename1_2_1_1 from directory1_2)': function(t) {
            findRemoveSync(directory1_2, {files: randomFilename1_2_1_1})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(filename randomFilename1_2_1_1 from directory1_2) removed randomFile1_2_1_1 fine')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, true, 'findRemoveSync(filename randomFilename1_2_1_1 from directory1_2) did not remove randomFile1_2_1_2')

            var exists1_2 = fs.existsSync(directory1_2)
            t.equal(exists1_2, true, 'findRemoveSync(filename randomFilename1_2_1_1 from directory1_2) did not remove directory1_2')

            t.done()
        },

        'findRemoveSync(two files from root)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: [randomFilename2, randomFilename1_2_1_3]})

            var exists2 = fs.existsSync(randomFile2)
            t.equal(exists2, false, 'findRemoveSync(two files from root) removed randomFile2 fine')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'findRemoveSync(two files from root) removed randomFile1_2_1_3 fine')

            var exists1 = fs.existsSync(randomFile1)
            t.equal(exists1, true, 'findRemoveSync(two files from root) did not remove randomFile1')

            var exists0 = fs.existsSync(rootDirectory)
            t.equal(exists0, true, 'findRemoveSync(two files from root) did not remove root directory')

            t.done()
        },

        'findRemoveSync(files set to *.*)': function(t) {
            findRemoveSync(directory1_2_1, {files: '*.*'})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(files set to *.*) removed randomFile1_2_1_1 fine')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, false, 'findRemoveSync(files set to *.*) removed randomFile1_2_1_2 fine')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'findRemoveSync(files set to *.*) removed randomFile1_2_1_3 fine')

            var exists1_2_1 = fs.existsSync(directory1_2_1)
            t.equal(exists1_2_1, true, 'findRemoveSync(files set to *.* did not remove directory1_2_1')

            t.done()
        },

        'findRemoveSync(with mixed ext and file params)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: randomFilename1, extensions: ['.log']})

            var exists1 = fs.existsSync(randomFile1)
            var exists2 = fs.existsSync(randomFile2)
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1, false, 'findRemoveSync(with mixed ext and file params) removed randomFile1 fine')
            t.equal(exists2, false, 'findRemoveSync(with mixed ext and file params) removed randomFile2 fine')
            t.equal(exists1_2_1_1, false, 'findRemoveSync(with mixed ext and file params) removed randomFile1_2_1_1 fine')

            var exists1_2_1 = fs.existsSync(directory1_2_1)
            t.equal(exists1_2_1, true, 'did not remove directory1_2_1')

            t.strictEqual(typeof result[randomFile1], 'boolean', 'randomFile1 in result is boolean')
            t.strictEqual(typeof result[randomFile1_2_1_2], 'undefined', 'randomFile1_2_1_2 is NOT in result')

            t.done()
        },

        'findRemoveSync(with ignore param)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", ignore: fixFilename1_2_1_4})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(with ignore) did remove file randomFile1_2_1_1')

            var exists1_2_1_4 = fs.existsSync(fixFile1_2_1_4)
            t.equal(exists1_2_1_4, true, 'file fixFile1_2_1_4 not removed')

            t.strictEqual(typeof result[randomFile1_2_1_1], 'boolean', 'randomFile1_2_1_1 in result is boolean')
            t.strictEqual(typeof result[fixFile1_2_1_4], 'undefined', 'fixFile1_2_1_4 is NOT in result')

            t.done()
        },

        'findRemoveSync(with ignore and jpg extension params)': function(t) {
            var result = findRemoveSync(rootDirectory, {ignore: fixFilename1_2_1_4, extensions: '.jpg'})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            var exists1_2_1_4 = fs.existsSync(fixFile1_2_1_4)
            t.equal(exists1_2_1_1, true, 'findRemoveSync(with ignore + jpg extension) did not remove file randomFile1_2_1_1')
            t.equal(exists1_2_1_4, true, 'findRemoveSync(with ignore + jpg extension) did not remove file fixFile1_2_1_4')
            t.strictEqual(typeof result[randomFile1_2_1_1], 'undefined', 'randomFile1_2_1_1 is NOT in result')
            t.strictEqual(typeof result[fixFile1_2_1_4], 'undefined', 'fixFile1_2_1_4 is NOT in result')

            t.done()
        },

        'findRemoveSync(with multiple ignore)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", ignore: [fixFilename1_2_1_4, fixFilename1_2_1_5]})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(with multiple ignore) did remove file randomFile1_2_1_1')

            var exists1_2_1_4 = fs.existsSync(fixFile1_2_1_4)
            t.equal(exists1_2_1_4, true, 'findRemoveSync(with multiple ignore) did not remove file fixFile1_2_1_4')

            var exists1_2_1_5 = fs.existsSync(fixFile1_2_1_5)
            t.equal(exists1_2_1_5, true, 'findRemoveSync(with multiple ignore) did not remove file fixFile1_2_1_5')

            t.strictEqual(typeof result[randomFile1_2_1_1], 'boolean', 'randomFile1_2_1_1 is in result')
            t.strictEqual(typeof result[fixFile1_2_1_4], 'undefined', 'fixFile1_2_1_4 is NOT in result')
            t.strictEqual(typeof result[fixFile1_2_1_5], 'undefined', 'fixFile1_2_1_5 is NOT in result')

            t.done()
        },

        'findRemoveSync(with ignore and bak extension params)': function(t) {
            var result = findRemoveSync(rootDirectory, {ignore: fixFilename1_2_1_4, extensions: '.bak'})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, true, 'findRemoveSync(with ignore + bak extension) did not remove file randomFile1_2_1_1')

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2)
            t.equal(exists1_2_1_2, false, 'findRemoveSync(with ignore + bak extension) did remove file randomFile1_2_1_2')

            var exists1_2_1_4 = fs.existsSync(fixFile1_2_1_4)
            t.equal(exists1_2_1_4, true, 'findRemoveSync(with ignore + bak extension) did not remove file fixFile1_2_1_4')

            t.strictEqual(typeof result[randomFile1_2_1_1], 'undefined', 'randomFile1_2_1_1 is NOT in result')
            t.strictEqual(typeof result[randomFile1_2_1_2], 'boolean', 'randomFile1_2_1_2 is in result')
            t.strictEqual(typeof result[fixFile1_2_1_4], 'undefined', 'fixFile1_2_1_4 is NOT in result')

            t.done()
        },

        'findRemoveSync(two files and check others)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: [randomFilename1_2_1_1, randomFilename1_2_1_3]})

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, false, 'findRemoveSync(two files and check others) removed randomFile1_2_1_1 fine')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, false, 'findRemoveSync(two files and check others) removed randomFile1_2_1_3 fine')

            var exists1_2_1_4 = fs.existsSync(fixFile1_2_1_4)
            t.equal(exists1_2_1_4, true, 'findRemoveSync(two files and check others) did not remove fixFile1_2_1_4')

            var exists1_2_1_5 = fs.existsSync(fixFile1_2_1_5)
            t.equal(exists1_2_1_5, true, 'findRemoveSync(two files and check others) did not remove fixFile1_2_1_5')

            t.strictEqual(typeof result[randomFile1_2_1_1], 'boolean', 'randomFile1_2_1_1 is in result')
            t.strictEqual(typeof result[randomFile1_2_1_3], 'boolean', 'randomFile1_2_1_3 is in result')
            t.strictEqual(typeof result[fixFile1_2_1_4], 'undefined', 'fixFile1_2_1_4 is NOT in result')
            t.strictEqual(typeof result[fixFile1_2_1_5], 'undefined', 'fixFile1_2_1_5 is NOT in result')

            t.done()
        },

        'findRemoveSync(limit to maxLevel = 0)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", maxLevel: 0})

            t.strictEqual(Object.keys(result).length, 0, 'findRemoveSync(limit to maxLevel = 0) returned empty an array.')

            t.done()
        },

        'findRemoveSync(limit to maxLevel = 1)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", maxLevel: 1})

            t.strictEqual(Object.keys(result).length, 7, 'findRemoveSync(limit to maxLevel = 1) returned 7 entries.')

            t.done()
        },

        'findRemoveSync(limit to maxLevel = 2)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", maxLevel: 2})

            t.strictEqual(Object.keys(result).length, 12, 'findRemoveSync(limit to maxLevel = 2) returned 12 entries.')

            t.done()
        },

        'findRemoveSync(limit to maxLevel = 3)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", maxLevel: 3})

            t.strictEqual(Object.keys(result).length, 6, 'findRemoveSync(limit to maxLevel = 3) returned 6 entries.')

            t.done()
        },

        'findRemoveSync(limit to maxLevel = 3 + bak only)': function(t) {
            var result = findRemoveSync(rootDirectory, {maxLevel: 3, extensions: '.bak'})

            t.strictEqual(Object.keys(result).length, 2, 'findRemoveSync(limit to maxLevel = 3 + bak only) returned 2 entries.')

            t.done()
        },

        'findRemoveSync(single dir)': function(t) {
            var result = findRemoveSync(rootDirectory, {dir: 'directory1_2'})

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'findRemoveSync(single dir) did not remove directory1_1')

            var exists1_2 = fs.existsSync(directory1_2)
            t.equal(exists1_2, false, 'findRemoveSync(single dir) removed directory1_2')

            t.done()
        },

        'findRemoveSync(two directories)': function(t) {
            findRemoveSync(rootDirectory, {dir: ['directory1_1', 'directory1_2']})

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, false, 'findRemoveSync(remove single dir) removed directory1_1')

            var exists1_2 = fs.existsSync(directory1_2)
            t.equal(exists1_2, false, 'findRemoveSync(remove single dir) removed directory1_2')

            t.done()
        },

        'findRemoveSync(directories with the same basename)': function(t) {
            findRemoveSync(rootDirectory, {dir: 'CVS'})

            var exists1_3 = fs.existsSync(directory1_3)
            t.equal(exists1_3, false, 'findRemoveSync(directories with the same basename) removed root/directory1/CVS')

            var exists3 = fs.existsSync(directory3)
            t.equal(exists3, false, 'findRemoveSync(directories with the same basename) removed root/CVS')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'findRemoveSync(remove single dir) did not remove directory1_1')

            var exists1_2 = fs.existsSync(directory1_2)
            t.equal(exists1_2, true, 'findRemoveSync(remove single dir) did not remove directory1_2')

            t.done()
        },

        'findRemoveSync(test run)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", test: true})

            t.strictEqual(Object.keys(result).length, 19, 'findRemoveSync(test run) returned 19 entries.')

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1)
            t.equal(exists1_2_1_1, true, 'findRemoveSync(test run) did not remove randomFile1_2_1_1')

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3)
            t.equal(exists1_2_1_3, true, 'findRemoveSync(test run) did not remove randomFile1_2_1_3')

            var exists1_1 = fs.existsSync(directory1_1)
            t.equal(exists1_1, true, 'findRemoveSync(test run) did not remove directory1_1')

            t.done()
        }
    }),

    'TC 3: age checks': testCase({

        setUp: function(cb) {
            createFakeDirectoryTree(cb)
        },
        tearDown: function(cb) {
            destroyFakeDirectoryTree(cb)
        },

        'findRemoveSync(files and dirs older than 10000000000000000 sec)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", age: {seconds: 10000000000000000}})

            t.strictEqual(Object.keys(result).length, 0, 'findRemoveSync(files older than 10000000000000000 sec) returned zero entries.')

            t.done()
        },

        'findRemoveSync(files and dirs older than 10 sec)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", age: {seconds: 10}})

            t.strictEqual(Object.keys(result).length, 0, 'findRemoveSync(files older than 10 sec) returned zero entries.')

            t.done()
        },

        'findRemoveSync(files older than 2 sec with wait)': function(t) {
            setTimeout(function() {
                var result = findRemoveSync(rootDirectory, {files: "*.*", age: {seconds: 2}})

                t.strictEqual(Object.keys(result).length, 11, 'findRemoveSync(files older than 2 sec with wait) returned 11 entries.')

                t.done()
            }, 2100)
        },

        'findRemoveSync(files older than 2 sec with wait + maxLevel = 1)': function(t) {
            setTimeout(function() {
                var result = findRemoveSync(rootDirectory, {files: "*.*", maxLevel: 1, age: {seconds: 2}})

                t.strictEqual(Object.keys(result).length, 4, 'findRemoveSync(files older than 2 sec with wait + maxLevel = 1) returned 4 entries.')

                t.done()
            }, 2100)
        }
    }),

    'TC 4: github issues': testCase({

        setUp: function(cb) {
            createFakeDirectoryTree(cb)
        },
        tearDown: function(cb) {
            destroyFakeDirectoryTree(cb)
        },

        // from https://github.com/binarykitchen/find-remove/issues/7
        'findRemoveSync(issues/7a)': function(t) {
            setTimeout(function() {
                var result = findRemoveSync(rootDirectory, {age: {seconds: 2}, extensions: '.csv'})

                t.strictEqual(Object.keys(result).length, 2, 'findRemoveSync(issues/7) deleted 2 files.')

                t.done()
            }, 3 * 1000)
        },

        // from https://github.com/binarykitchen/find-remove/issues/7
        'findRemoveSync(issues/7b)': function(t) {
            var result = findRemoveSync(rootDirectory, {extensions: '.dontexist'})

            t.deepEqual(result, {}, 'is an empty json')

            t.done()
        }
    }),

    'TC 5: limit checks': testCase({

        setUp: function(cb) {
            createFakeDirectoryTree(cb)
        },
        tearDown: function(cb) {
            destroyFakeDirectoryTree(cb)
        },

        'findRemoveSync(files older with limit of 2)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", limit: 2})

            t.strictEqual(Object.keys(result).length, 2, 'findRemoveSync(files with limit of 2) returned 2 entries (out of 11).')

            t.done()
        },

        'findRemoveSync(files and dirs with limit of 5)': function(t) {
            var result = findRemoveSync(rootDirectory, {files: "*.*", dir: "*", limit: 5})

            t.strictEqual(Object.keys(result).length, 5, 'findRemoveSync(files and dirs with limit of 5) returned 5 entries (out of 19).')

            t.done()
        }

    }),

    'TC 6: prefix checks': testCase({

        setUp: function(cb) {
            createFakeDirectoryTree(cb)
        },
        tearDown: function(cb) {
            destroyFakeDirectoryTree(cb)
        },

        'findRemoveSync(files with exiting prefix "someth")': function(t) {
            var result = findRemoveSync(rootDirectory, {prefix: "someth"})

            t.strictEqual(Object.keys(result).length, 2, 'findRemoveSync(files with prefix "someth") returned 2 entries (out of 11).')

            t.done()
        },

        'findRemoveSync(files with non-existing prefix "ssssssssssssssssssssssssss" - too many chars)': function(t) {
            var result = findRemoveSync(rootDirectory, {prefix: "ssssssssssssssssssssssssss"})

            t.strictEqual(Object.keys(result).length, 0, 'findRemoveSync(files with non-existing prefix "ssssssssssssssssssssssssss"- too many chars) returned 0 entries (out of 11).')

            t.done()
        }

    })
})
