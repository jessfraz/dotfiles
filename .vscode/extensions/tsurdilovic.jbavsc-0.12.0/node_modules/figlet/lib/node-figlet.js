/*
	Node plugin for figlet.js
*/

var figlet = require('./figlet.js'),
    fs = require('fs'),
    fontDir = __dirname + '/../fonts/';

/*
    Loads a font into the figlet object.

    Parameters:
    - name (string): Name of the font to load.
    - next (function): Callback function.
*/
figlet.loadFont = function(name, next) {
    if (figlet.figFonts[name]) {
        next(null, figlet.figFonts[name].options);
        return;
    }

    fs.readFile(fontDir + name + '.flf',  {encoding: 'utf-8'}, function(err, fontData) {
        if (err) {
            return next(err);
        }

        fontData = fontData + '';
        try {
            next(null, figlet.parseFont(name, fontData));
        } catch(error) {
            next(error);
        }
    });
};

/*
 Loads a font synchronously into the figlet object.

 Parameters:
 - name (string): Name of the font to load.
 */
figlet.loadFontSync = function(name) {
    if (figlet.figFonts[name]) {
        return figlet.figFonts[name].options;
    }

    var fontData = fs.readFileSync(fontDir + name + '.flf',  {encoding: 'utf-8'});

    fontData = fontData + '';
    return figlet.parseFont(name, fontData);
};

/*
    Returns an array containing all of the font names
*/
figlet.fonts = function(next) {
    var fontList = [];
    fs.readdir(fontDir, function (err, files) { // '/' denotes the root folder
        if (err) {
            return next(err);
        }

        files.forEach( function (file) {
            if ( /\.flf$/.test(file) ) {
                fontList.push( file.replace(/\.flf$/,'') );
            }
        });

        next(null, fontList);
    });

};

figlet.fontsSync = function() {
    var fontList = [];
    fs.readdirSync(fontDir).forEach(function(file) {
        if ( /\.flf$/.test(file) ) {
            fontList.push( file.replace(/\.flf$/,'') );
        }
    });

    return fontList;
};

module.exports = figlet;
