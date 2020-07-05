var CLI = require('../lib/clui.js'),
    clear = CLI.Clear,
    clc = require('cli-color');

var Line          = CLI.Line,
    LineBuffer    = CLI.LineBuffer;

var drawTimeout;

function draw() {
  clear()

  var xLocation = Math.floor(process.stdout.columns / 2) - 35;
  if (xLocation < 0)
    xLocation = 0;

  var yLocation = Math.floor(process.stdout.rows / 2) - 10;
  if (yLocation < 0)
    yLocation = 0;

  var outputBuffer = new LineBuffer({
    x: xLocation,
    y: yLocation,
    width: 71,
    height: 21
  });

  var message = new Line(outputBuffer)
    .column('Press Control+C to quit. Try resizing terminal.', 71, [clc.green])
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

  drawTimeout = setTimeout(draw, 1000);
}

draw();

process.stdout.on('resize', function() {
  clearTimeout(drawTimeout);
  draw();
});
