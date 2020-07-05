'use strict';

var gulp = require('gulp'),
	paths = {
		gulp: './gulpfile.js',
		src: './index.js',
		test: './test/**/*.{e2e,spec}.js'
	};

gulp.task('default', ['test']);

gulp.task('bench', function (done) {
	var Benchmark = require('benchmark'),
		suite = new Benchmark.Suite();

	suite
		.add('find-config', require('./test/find-config.bench'))
		.add('findup-sync', require('./test/findup-sync.bench'))
		.add('look-up', require('./test/look-up.bench'))
		.on('cycle', function (event) {
			console.log(String(event.target));
		})
		.on('complete', function () {
			console.log('Fastest is ' + this.filter('fastest').pluck('name'));
			done();
		})
		.run({ async: true });
});

gulp.task('lint', function () {
	var eslint = require('gulp-eslint');

	return gulp
		.src([paths.gulp, paths.src, paths.test])
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task('cover', function () {
	var istanbul = require('gulp-istanbul');

	return gulp
		.src(paths.src)
		.pipe(istanbul())
		.pipe(istanbul.hookRequire());
});

gulp.task('test', ['lint', 'cover'], function () {
	var istanbul = require('gulp-istanbul'),
		mocha = require('gulp-mocha');

	return gulp
		.src(paths.test)
		.pipe(mocha({ reporter: 'spec' }))
		.pipe(istanbul.writeReports());
});
