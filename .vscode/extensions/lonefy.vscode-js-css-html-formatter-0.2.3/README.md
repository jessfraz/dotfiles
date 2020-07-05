## VS Code JS, CSS, HTML Formatting

This extension wraps [js-beautify](https://github.com/beautify-web/js-beautify) to format your JS, CSS, HTML, JSON file.

##How To Use

*  open `Context Menu` and choose `Format Code`
*  shortcuts: `Alt+Shift+F`
*  CLI: Press `F1`, enter `Format Code`

>the upper 3 ways don't work for `Javascript`&`JSON` after `vscode v0.10.10`, but you can still format `CSS` and `HTML`.

###To format **Javascript,CSS and HTML** after vscode v0.10.10
*  CLI: Press `F1`,enter `Formatter`

##Config

1. Press `F1`, enter `Formatter Config`, open the config file:

   ![image](https://cloud.githubusercontent.com/assets/7921431/15070016/2bf251a4-13b4-11e6-8ebe-eefaa6adcbf6.png)

2. Edit the file as your needs. This extension uses `js-beautify` internally, so you can edit the parameters which `js-beautify` can use.

   ![image](https://cloud.githubusercontent.com/assets/7921431/15069887/47ee136c-13b3-11e6-9505-4a3b378be601.png)

3. `Restart` vscode  **[!Important]**

## License
[MIT](https://github.com/lonefy/vscode-js-css-html-formatter/blob/master/LICENSE)

##Bug and Issue
[Issue](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues)

##Changes Log：
###0.2.3 31 Mar 2017
* (BUG FIX): Try to fix the saving problem

###0.2.2 23 Nov 2016
* (BUG FIX): `onSave` feature.Try to fix the `Save loop` problem.[Issue #20](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/20)
* New VSCode API changes:[Issue #30](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/30);

###0.2.0 20 July 2016
* New Feature: `SCSS support`[Issue #14](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/14)

###0.1.32 15 July 2016
* (BUG FIX) Path maybe undefined
* ES6/7 Import Syntax **Need to update your `formatter.json` file** [Issue #9](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/9)
* Avoid line break to indent the CSS code[Issue #8](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/8) 

###0.1.3 06 May 2016
* New Feature: `on save`.[Issue #4](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/4)

    Add a new field in config file `onSave`(default true);

* New Feature: `local config file`. [Issue#3](https://github.com/Lonefy/vscode-JS-CSS-HTML-formatter/issues/3)
    
    Use `F1-> Formatter Create Local Config` to generate the local config file in `.vscode folder` of your project. Formatter will use the **local config file** first.
   
* Support `JSON` file.

###0.1.0 26 Mar 2016
* add Config file ,you can format your code as your own settings.  

##THANKS:
rjmacarthy, zhaopengme, Arrow7000, bitwiseman
