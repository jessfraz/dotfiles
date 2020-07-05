var Benchmark = require('benchmark');

new Benchmark.Suite()
	.add('find-config', require('./find-config.bench'))
	.add('findup-sync', require('./findup-sync.bench'))
	.add('look-up', require('./look-up.bench'))
	.on('cycle', function (event) {
		console.log(String(event.target));
	})
	.on('complete', function () {
		console.log('Fastest:', this.filter('fastest').map('name').join(', '));
	})
	.run({async: true});
