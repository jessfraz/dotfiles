var clc      = require('cli-color'),
    ansiTrim = require('cli-color/trim'),
    sprintf  = require('util').format;

var sparklineSymbols = [
  '\u2581',
  '\u2582',
  '\u2583',
  '\u2584',
  '\u2585',
  '\u2586',
  '\u2587',
  '\u2588'
];

// Tiny helper function used for making default values prettier.
function pick(value, defaultValue) {
 return (typeof value == 'undefined' ? defaultValue : value);
}

var helpers = {

  // Make a console spinner.
  // Code based on code from Mocha by Visionmedia/Tj
  // https://github.com/visionmedia/mocha/blob/master/bin/_mocha
  Spinner: function (message, style) {
    var spinnerMessage = message;
    var spinnerStyle = style;

    this.start = function () {
      var self = this;
      var spinner = spinnerStyle;

      if (!spinner || spinner.length === 0) {
        spinner = 'win32' == process.platform ? ['|','/','-','\\'] : ['◜','◠','◝','◞','◡','◟'];
      }

      function play(arr, interval) {
        var len = arr.length, i = 0;
        interval = interval || 100;

        var drawTick = function () {
          var str = arr[i++ % len];
          process.stdout.write('\u001b[0G' + str + '\u001b[90m' + spinnerMessage + '\u001b[0m');
        };

        self.timer = setInterval(drawTick, interval);
      }

      var frames = spinner.map(function(c) {
        return sprintf('  \u001b[96m%s ', c);
      });

      play(frames, 70);
    };

    this.message = function (message) {
      spinnerMessage = message;
    };

    this.stop = function () {
      process.stdout.write('\u001b[0G\u001b[2K');
      clearInterval(this.timer);
    };
  },

  // Make an ascii horizontal gauge
  Gauge: function (value, maxValue, width, dangerZone, suffix) {
    if (maxValue === 0) {
      return '[]';
    } else {
      var barLength = value ? Math.ceil(value / maxValue * width) : 1;
      if (barLength > width)
        barLength = width;

      var barColor = clc.green;
      if (value > dangerZone)
        barColor = clc.red;

      return '['+
        barColor(Array(barLength).join("|")) +  // The filled portion
        Array(width + 1 - barLength).join("-") +    // The empty portion
      '] ' + clc.blackBright(suffix);
    }
  },

  // Make a progress bar
  Progress: function (width) {
    var currentValue = 0;
    var maxValue = 0;
    var self = this;

    this.update = function (currentValue, maxValue) {
      if(maxValue === 0) {
        return '[]';
      }

      // if no maxValue assigned, treat as percentage
      if (typeof maxValue === 'undefined')
        maxValue = 1

      // maintain correct barLength when value is 0
      var barLength = currentValue ? Math.ceil(currentValue / maxValue * width) : 1;

      // prevent barLength from overflowing column width
      if (barLength > width)
        barLength = width;

      // prevent value from being greater than maxValue
      if (currentValue > maxValue)
        currentValue = maxValue

      return '['+
        clc.green(Array(barLength).join("|")) +  //The filled portion
        Array(width + 1 - barLength).join("-") +    //The empty portion
      '] ' + clc.blackBright(Math.ceil(currentValue / maxValue * 100) + '%');
    };
  },

  // Make a unicode sparkline chart
  Sparkline: function (points, suffix) {
    if(typeof suffix == 'undefined')
      suffix = '';

    var max = Math.max.apply(Math, points);

    var scaledSequence = points.map(function (thisPoint) {
      if(max === 0)
        return [0, 0];
      else if(thisPoint === 0)
        return [0, 0];
      else
        return [
          Math.ceil(thisPoint / max * (sparklineSymbols.length-1)),
          thisPoint
        ];
    });

    var sparklineGraph = '';
    var alreadyDrawnMax = false;
    scaledSequence.forEach(function (symbolNumber) {
      if(symbolNumber[1] == max & !alreadyDrawnMax)
      {
        sparklineGraph += clc.green(sparklineSymbols[symbolNumber[0]]);
        alreadyDrawnMax = true;
      }
      else
        sparklineGraph += sparklineSymbols[symbolNumber[0]];
    });

    return sparklineGraph + '  ' + clc.blackBright(points[points.length-1] + suffix + ' (') + clc.green(max + suffix) + clc.blackBright(')');
  },

  // Interface for storing multiple lines and then outputting them all at once.
  LineBuffer: function (userOptions) {
    var self = this;
    self.lines = [];

    //Merge the user defined settings (if there are any) with the default settings.
    var defaultOptions = {
      x: 0,
      y: 0,
      width: 'console',
      height: 'console',
      scroll: 0
    };

    if(typeof userOptions == 'undefined')
      self.userOptions = defaultOptions;
    else
    {
      self.userOptions = {
        x: pick(userOptions.x, defaultOptions.x),
        y: pick(userOptions.y, defaultOptions.y),
        width: pick(userOptions.width, defaultOptions.width),
        height: pick(userOptions.height, defaultOptions.height),
        scroll: pick(userOptions.scroll, defaultOptions.scroll)
      };
    }

    this.height = function ()
    {
      if(self.userOptions.height == 'console')
        return process.stdout.rows;
      else
        return self.userOptions.height;
    };

    this.width = function ()
    {
      if(self.userOptions.width == 'console')
        return process.stdout.columns;
      else
        return self.userOptions.width;
    };

    // Push a line of content into the buffer.
    this.addLine = function (lineObject) {
      self.lines.push(lineObject);
      return self;
    };

    // See if the buffer has enough content to fill the vertical space, if not fill the vertical space
    // with the designated fill line.
    this.fill = function (fillLine) {
      var fillHeight = self.height()-self.lines.length;
      if(fillHeight > 0)
      {
        for(var i = 0; i < fillHeight; i++)
        {
          self.addLine(fillLine);
        }
      }
      return self;
    };

    // Output a buffer full of lines.
    this.output = function () {
      // First grab a subset of the lines depending on the scroll location and the height of the buffer.
      var outputLines;
      var sliceEnd;
      var outputHeight = self.height();
      if(self.userOptions.scroll > self.lines.length)
        return;

      if(self.lines.length - self.userOptions.scroll > outputHeight)
        outputLines = self.lines.slice(self.userOptions.scroll, self.userOptions.scroll + outputHeight);
      else
        outputLines = self.lines.slice(self.userOptions.scroll);

      // First move the cursor to the location where we want the buffer to draw.
      var currentY = self.userOptions.y;
      outputLines.forEach(function (line) {
        process.stdout.write(clc.moveTo(self.userOptions.x, currentY));
        line.output();
        currentY++;
      });
    };
  },

  // Create a new table object to output
  Table: function () {
    var self = this;
    var tableContent = '';

    // Adds a new table row to the output
    self.tr = function () {
      return self;
    };

    // Adds a new table cell to the output
    self.td = function (cellContent, cellWidth) {
      return self;
    };

    // Draw this table to the screen
    self.output = function () {
      return self;
    };

    return self;
  },

  // Chainable wrapper for line content
  Line: function (defaultBuffer) {
    var lineContent = "";
    var self = this;
    self.defaultBuffer = defaultBuffer;

    // Put text in the line
    this.text = function (text, styles) {
      for(var styleNumber in styles)
      {
        text = styles[styleNumber](text);
      }
      lineContent += text;
      return self;
    };

    // Put padding in the line.
    this.padding = function (width, styles) {
      var padding = Array(width+1).join(" ");
      for(var styleNumber in styles)
      {
        padding = styles[styleNumber](padding);
      }
      lineContent += padding;
      return self;
    };

    // Put padding in the line.
    this.column = function (text, columnWidth, textStyles) {
      var textWidth = ansiTrim(text).length;

      if(textWidth > columnWidth)
      {
        self.text(text.slice(0, columnWidth), textStyles);
      }
      else if(textWidth < columnWidth)
      {
        self.text(text, textStyles)
            .padding(columnWidth - textWidth);
      }
      else
      {
        self.text(text, textStyles);
      }
      return self;
    };

    // Fill the rest of the width of the line with space.
    this.fill = function (styles) {
      var fillWidth = process.stdout.columns-ansiTrim(lineContent).length;
      if(fillWidth > 0)
        self.padding(fillWidth, styles);
      return self;
    };

    // Store a line in a line buffer to be output later.
    this.store = function (buffer) {
      if(typeof buffer == 'undefined')
      {
        if(typeof self.defaultBuffer == 'undefined')
          process.stderr.write('Attempt to store a line in a line buffer, without providing a line buffer to store that line in.');
        else
          self.defaultBuffer.addLine(self);
      }
      else
      {
        buffer.addLine(self);
      }
      return self;
    };

    // Output a line directly to the screen.
    this.output = function () {
      process.stdout.write(lineContent+"\n");
      return self;
    };

    // Return the contents
    this.contents = function () {
      return lineContent;
    };
  },

  // Effectively clear a screen.
  // Code based on code from Clear by bahamas10/node-clear
  // https://github.com/bahamas10/node-clear
  Clear: function(clear) {
    if (clear !== false) {
      // Ansi code for clearing screen
      process.stdout.write('\033[2J');
    }
    // if false, don't clear screen, rather move cursor to top left
    process.stdout.write('\033[0;0f');
  }
};

module.exports = helpers;
