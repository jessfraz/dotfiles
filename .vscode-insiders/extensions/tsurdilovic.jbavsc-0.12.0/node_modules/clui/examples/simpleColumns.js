var CLI = require('../lib/clui.js'),
    clc = require('cli-color');

var Line = CLI.Line;

var blankLine = new Line().fill().output();

var headers = new Line()
  .padding(2)
  .column('Suscipit', 20, [clc.cyan])
  .column('Voluptatem', 20, [clc.cyan])
  .column('Nesciunt', 20, [clc.cyan])
  .column('Laudantium', 20, [clc.cyan])
  .fill()
  .output();

var line;
for(var l = 0; l < 20; l++)
{
  line = new Line()
    .padding(2)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 20)
    .column((Math.random()*100).toFixed(3), 20)
    .fill()
    .output();
}

blankLine.output();
