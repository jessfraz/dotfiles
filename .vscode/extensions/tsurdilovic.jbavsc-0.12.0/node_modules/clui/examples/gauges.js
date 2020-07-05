var CLI = require('../lib/clui.js'),
    clear = CLI.Clear,
    clc = require('cli-color'),
    os  = require('os');

var Line          = CLI.Line,
    Gauge         = CLI.Gauge;
    Sparkline     = CLI.Sparkline;

var drawTimeout;
var requestSeries = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var errorSeries = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

function draw() {
  clear()

  var blankLine = new Line().fill().output();

  var total = os.totalmem();
  var free = os.freemem();
  var used = total-free;
  var human = Math.ceil(used / 1000000) + ' MB';

  var memoryLine = new Line()
    .padding(2)
    .column('Memory In Use', 20, [clc.cyan])
    .column(Gauge(used, total, 20, total * 0.8, human), 40)
    .fill()
    .output();

  var load = os.loadavg()[0];
  var maxLoad = os.cpus().length * 2;
  var danger = os.cpus().length;

  var loadLine = new Line()
    .padding(2)
    .column('System Load', 20, [clc.cyan])
    .column(Gauge(load, maxLoad, 20, danger, load.toString()), 40)
    .fill()
    .output();

  var uptimeLine = new Line()
    .padding(2)
    .column('Uptime', 20, [clc.cyan])
    .column(os.uptime().toString() + ' seconds', 40)
    .fill()
    .output();

  blankLine.output();

  requestSeries.push(Math.ceil((Math.random()*100)));
  requestSeries.shift();

  var requestLine = new Line()
    .padding(2)
    .column('Requests/Sec', 20, [clc.cyan])
    .column(Sparkline(requestSeries, ' reqs/sec'), 80)
    .fill()
    .output();

  errorSeries.push(Math.ceil((Math.random()*10)));
  errorSeries.shift();

  var errorLine = new Line()
    .padding(2)
    .column('Errors/Sec', 20, [clc.cyan])
    .column(Sparkline(errorSeries, ' errs/sec'), 80)
    .fill()
    .output();

  blankLine.output();

  drawTimeout = setTimeout(draw, 1000);
}

draw();

process.stdout.on('resize', function() {
  clearTimeout(drawTimeout);
  draw();
});
