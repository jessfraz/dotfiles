clui [![Changelog Status](https://changelogs.md/img/changelog-check-green.svg)](https://changelogs.md/github/nathanpeck/clui/)
=============

This is a Node.js toolkit for quickly building nice looking command line interfaces which can respond to changing terminal sizes. It also includes the following easy to use components:

* Gauges
* Progress Bars
* Sparklines
* Spinners

__Updates__

_October 8, 2014_ - Adding Line.contents() for fetching the contents of a line as a string.

_June 2, 2014_ - Fixed a crash caused by inability to locate the required trim helper in the latest version of cli-color. (And locked down the version of the cli-color dependency to stop this from ever happening again.) Also removed lodash as a dependency in favor of vanilla JS, to keep installs faster and smaller than ever.

<a name="line-buffer"></a>
### LineBuffer(options)

Creates an object for buffering a group of text lines and then outputting them. When printing lines using `LineBuffer` it will crop off extra width and height so that the lines will fit into a specific space.

__Options__

The following options can be passed in on creation of the `LineBuffer`

* `x` - The X location of where to draw the lines in this buffer.
* `y` - The Y location of where the draw the lines.
* `width` - How wide the buffer is in columns. Any lines longer than this will be cropped. You can specify either an integer value or `'console'` in order to let the width of the console determine the width of the `LineBuffer`.
* `height` - How high the buffer is in rows. You can either pass in an integer value or
  `'console'` to let the height on the console determine the height of the `LineBuffer`.
* `scroll` - Where the user is scrolled to in the buffer

__Functions__

* `height()` - Return the height of the `LineBuffer`, in case you specified it as `'console'`
* `width()` - Return the width of the `LineBuffer`, in case you specified it as `'console'`
* `addLine(Line)` - Put a `Line` object into the `LineBuffer`.
* `fill()` - If you don't have enough lines in the buffer this will fill the rest of the lines
   with empty space.
* `output()` - Draw the `LineBuffer` to screen.

__Example__

```js
var CLI = require('clui'),
    clc = require('cli-color');

var Line          = CLI.Line,
    LineBuffer    = CLI.LineBuffer;

var outputBuffer = new LineBuffer({
  x: 0,
  y: 0,
  width: 'console',
  height: 'console'
});

var message = new Line(outputBuffer)
  .column('Title Placehole', 20, [clc.green])
  .fill()
  .store();

var blankLine = new Line(outputBuffer)
  .fill()
  .store();

var header = new Line(outputBuffer)
  .column('Suscipit', 20, [clc.cyan])
  .column('Voluptatem', 20, [clc.cyan])
  .column('Nesciunt', 20, [clc.cyan])
  .column('Laudantium', 11, [clc.cyan])
  .fill()
  .store();

var line;
for(var l = 0; l < 20; l++)
{
  line = new Line(outputBuffer)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 11)
    .fill()
    .store();
}

outputBuffer.output();
```

<a name="line"></a>
### Line(outputBuffer)

This chainable object can be used to generate a line of text with columns, padding, and fill. The parameter `outputBuffer` can be provided to save the line of text into a `LineBuffer` object for future outputting, or you can use `LineBuffer.addLine()` to add a `Line` object into a `LineBuffer`.

Alternatively if you do not wish to make use of a `LineBuffer` you can just use `Line.output()` to output the `Line` immediately rather than buffering it.

__Chainable Functions__

* `padding(width)` - Output `width` characters of blank space.
* `column(text, width, styles)` - Output text within a column of the specified width. If the text is longer than `width` it will be truncated, otherwise extra padding will be added until it is `width` characters long. The `styles` variable is a list of [cli-color](https://github.com/medikoo/cli-color) styles to apply to this column.
* `fill()` - At the end of a line fill the rest of the columns to the right edge of the
  terminal with whitespace to erase any content there.
* `output()` - Print the generated line of text to the console.
* `contents()` - Return the contents of this line as a string.

__Example__

```js
var clui = require('clui'),
    clc = require('cli-color'),
    Line = clui.Line;

var headers = new Line()
  .padding(2)
  .column('Column One', 20, [clc.cyan])
  .column('Column Two', 20, [clc.cyan])
  .column('Column Three', 20, [clc.cyan])
  .column('Column Four', 20, [clc.cyan])
  .fill()
  .output();

var line = new Line()
  .padding(2)
  .column((Math.random()*100).toFixed(3), 20)
  .column((Math.random()*100).toFixed(3), 20)
  .column((Math.random()*100).toFixed(3), 20)
  .column((Math.random()*100).toFixed(3), 20)
  .fill()
  .output();
```

<a name="gauge"></a>
### Gauge(value, maxValue, gaugeWidth, dangerZone, suffix)

![Picture of two gauges](https://raw.githubusercontent.com/nathanpeck/clui/master/docs/gauges.png)

Draw a basic horizontal gauge to the screen.

__Parameters__

* `value` - The current value of the metric being displayed by this gauge
* `maxValue` - The highest possible value of the metric being displayed
* `gaugeWidth` - How many columns wide to draw the gauge
* `dangerZone` - The point after which the value will be drawn in red because it is too high
* `suffix` - A value to output after the gauge itself.

__Example__

```js
var os   = require('os'),
    clui = require('clui');

var Gauge = clui.Gauge;

var total = os.totalmem();
var free = os.freemem();
var used = total - free;
var human = Math.ceil(used / 1000000) + ' MB';

console.log(Gauge(used, total, 20, total * 0.8, human));
```

<a name="sparkline"></a>
### Sparkline(values, suffix)

![Picture of two sparklines](https://raw.githubusercontent.com/nathanpeck/clui/master/docs/sparklines.png)

A simple command line sparkline that draws a series of values, and highlights the peak for the period. It also automatically outputs the current value and the peak value at the end of the sparkline.

__Parameters__

* `values` - An array of values to go into the sparkline
* `suffix` - A suffix to use when drawing the current and max values at the end of sparkline

__Example__

```js
var Sparkline = require('clui').Sparkline;
var reqsPerSec = [10,12,3,7,12,9,23,10,9,19,16,18,12,12];

console.log(Sparkline(reqsPerSec, 'reqs/sec'));
```

<a name="progress"></a>
### Progress(length)

![Picture of a few progress bars](https://raw.githubusercontent.com/nathanpeck/clui/master/docs/progress.png)

__Parameters__

* `length` - The desired length of the progress bar in characters.

__Methods__

* `update(currentValue, maxValue)` - Returns the progress bar min/max content to write to stdout. Allows for dynamic max values.
* `update(percent)` - Returns the progress bar content as a percentage to write to stdout. `0.0 > value < 1.0`.

__Example__

```js
var clui = require('clui');

var Progress = clui.Progress;

var thisProgressBar = new Progress(20);
console.log(thisProgressBar.update(10, 30));

// or

var thisPercentBar = new Progress(20);
console.log(thisPercentBar.update(0.4));

```

<a name="spinner"></a>
### Spinner(statusText)

![Picture of a spinner](https://raw.githubusercontent.com/nathanpeck/clui/master/docs/spinner.gif)

__Parameters__

* `statusText` - The default status text to display while the spinner is spinning.
* `style` - Array of graphical characters used to draw the spinner. By default,
  on Windows: ['|', '/', '-', '\'], on other platforms: ['◜','◠','◝','◞','◡','◟']

__Methods__

* `start()` - Show the spinner on the screen.
* `message(statusMessage)` - Update the status message that follows the spinner.
* `stop()` - Erase the spinner from the screen.

*Note: The spinner is slightly different from other Clui controls in that it outputs
directly to the screen, instead of just returning a string that you output yourself.*

__Example__

```js
var CLI = require('clui'),
    Spinner = CLI.Spinner;

var countdown = new Spinner('Exiting in 10 seconds...  ', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);

countdown.start();

var number = 10;
setInterval(function () {
  number--;
  countdown.message('Exiting in ' + number + ' seconds...  ');
  if (number === 0) {
    process.stdout.write('\n');
    process.exit(0);
  }
}, 1000);
```

License
=======

Copyright (C) 2014 Nathan Peck (https://github.com/nathanpeck)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
