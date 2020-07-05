'use strict'

var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    uglify      = require('gulp-uglify'),
    rename      = require('gulp-rename'),
    sourcemaps  = require('gulp-sourcemaps'),
    header      = require('gulp-header'),
    eslint      = require('gulp-eslint'),
    mocha       = require('gulp-mocha'),
    benchmark   = require('gulp-benchmark'),
    banner      = '/*! <%= pkg.name %> v<%= pkg.version %> | Copyright (c) 2007-present, <%= pkg.author %> | <%= pkg.license %> */\n'

gulp.task('benchmark', function () {
    return gulp
        .src('benchmark/*.js', {read: false})
        .pipe(benchmark())
})

gulp.task('lint', function() {
    return gulp
        .src('src/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
})

gulp.task('test', ['lint'], function() {
    return gulp
        .src('test/*.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}))
})

gulp.task('dist', ['test'], function() {
    return gulp.src([
        'src/*.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
})

gulp.task('default', ['dist'])
