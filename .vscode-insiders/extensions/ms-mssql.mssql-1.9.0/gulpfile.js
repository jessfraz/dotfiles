var gulp = require('gulp');
var rename = require('gulp-rename');
var gulpTsLint = require('gulp-tslint');
var ts = require('gulp-typescript');
var tslint = require('tslint');
var tsProject = ts.createProject('tsconfig.json');
var del = require('del');
var srcmap = require('gulp-sourcemaps');
var config = require('./tasks/config');
var concat = require('gulp-concat');
var minifier = require('gulp-uglify/minifier');
var uglifyjs = require('uglify-js');
var nls = require('vscode-nls-dev');
var argv = require('yargs').argv;
var min = (argv.min === undefined) ? false : true;
var vscodeTest = require('vscode-test');
var packageJson = require('./package.json');

require('./tasks/packagetasks');
require('./tasks/localizationtasks');

gulp.task('ext:lint', () => {
    // !! If updating this make sure to check if you need to update the TSA Scan task in ADO !!
    var program = tslint.Linter.createProgram('tsconfig.json');
    return gulp.src([
        config.paths.project.root + '/src/**/*.ts',
        '!' + config.paths.project.root + '/src/views/htmlcontent/**/*',
        config.paths.project.root + '/test/**/*.ts'
    ])
    .pipe((gulpTsLint({
        program,
        formatter: "verbose",
        rulesDirectory: "node_modules/tslint-microsoft-contrib"
    })))
    .pipe(gulpTsLint.report());
});

// Copy icons for OE
gulp.task('ext:copy-OE-assets', (done) => {
    return gulp.src([
        config.paths.project.root + '/src/objectExplorer/objectTypes/*'
    ])
    .pipe(gulp.dest('out/src/objectExplorer/objectTypes'));
});

// Copy icons for Query History
gulp.task('ext:copy-queryHistory-assets', (done) => {
    return gulp.src([
        config.paths.project.root + '/src/queryHistory/icons/*'
    ])
    .pipe(gulp.dest('out/src/queryHistory/icons'));
});

// Compile source
gulp.task('ext:compile-src', (done) => {
    return gulp.src([
                config.paths.project.root + '/src/**/*.ts',
                config.paths.project.root + '/src/**/*.js',
                '!' + config.paths.project.root + '/typings/**/*.ts',
                '!' + config.paths.project.root + '/src/views/htmlcontent/**/*'])
                .pipe(srcmap.init())
                .pipe(tsProject())
                .on('error', function() {
                    if (process.env.BUILDMACHINE) {
                        done('Extension Tests failed to build. See Above.');
                        process.exit(1);
                    }
                })
                .pipe(nls.rewriteLocalizeCalls())
                .pipe(nls.createAdditionalLanguageFiles(nls.coreLanguages, config.paths.project.root + '/localization/i18n', undefined, false))
                .pipe(srcmap.write('.', {
                   sourceRoot: function(file){ return file.cwd + '/src'; }
                }))
                .pipe(gulp.dest('out/src/'));
});

// Compile angular view
gulp.task('ext:compile-view', (done) => {
    return gulp.src([
        config.paths.project.root + '/src/views/htmlcontent/**/*.ts'])
        .pipe(srcmap.init())
        .pipe(tsProject())
        .pipe(nls.rewriteLocalizeCalls())
        .pipe(nls.createAdditionalLanguageFiles(nls.coreLanguages, config.paths.project.root + '/localization/i18n', undefined, false))
        .pipe(srcmap.write('.', {
            sourceRoot: function(file){ return file.cwd + '/src'; }
        }))
        .pipe(gulp.dest('out/src/views/htmlcontent'));
});

// Copy systemjs config file
gulp.task('ext:copy-systemjs-config', (done) => {
    return gulp.src([
        config.paths.project.root + '/src/views/htmlcontent/*.js'])
        .pipe(gulp.dest('out/src/views/htmlcontent'));
});

// Copy html
gulp.task('ext:copy-html', (done) => {
    return gulp.src([
            config.paths.project.root + '/src/controllers/sqlOutput.ejs'])
        .pipe(gulp.dest('out/src/controllers/'));
});

// Copy css
gulp.task('ext:copy-css', (done) => {
    return gulp.src([
            config.paths.project.root + '/src/views/htmlcontent/src/css/*.css'])
        .pipe(gulp.dest('out/src/views/htmlcontent/src/css'));
});

// Copy images
gulp.task('ext:copy-images', (done) => {
    return gulp.src([
            config.paths.project.root + '/src/views/htmlcontent/src/images/**/*'])
        .pipe(gulp.dest('out/src/views/htmlcontent/src/images'));
});

// Clean angular slickgrid library
gulp.task('ext:clean-library-ts-files', function() {
    del(config.paths.project.root + '/node_modules/angular2-slickgrid/**/*.ts');
    return del(config.paths.project.root + '/node_modules/rxjs/**/*.ts');
});

// Copy and bundle dependencies into one file (vendor/vendors.js)
// system.config.js can also bundled for convenience
gulp.task('ext:copy-dependencies', (done) => {
    gulp.src([config.paths.project.root + '/node_modules/rxjs/**/*'])
    .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib/rxjs'));

    gulp.src([config.paths.project.root + '/node_modules/angular-in-memory-web-api/**/*'])
        .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib/angular-in-memory-web-api'));

    // concatenate non-angular2 libs, shims & systemjs-config
    if (min) {
        gulp.src([
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery-1.8.3.js',
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery.event.drag-2.2.js',
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery-ui-1.9.2.js',
            config.paths.project.root + '/node_modules/underscore/underscore-min.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.core.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.grid.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.editors.js',
            config.paths.project.root + '/node_modules/core-js/client/shim.min.js',
            config.paths.project.root + '/node_modules/zone.js/dist/zone.js',
            config.paths.project.root + '/node_modules/rangy/lib/rangy-core.js',
            config.paths.project.root + '/node_modules/rangy/lib/rangy-textrange.js',
            config.paths.project.root + '/node_modules/reflect-metadata/Reflect.js',
            config.paths.project.root + '/node_modules/systemjs/dist/system.src.js',
            config.paths.project.root + '/src/views/htmlcontent/systemjs.config.js'
        ])
            .pipe(concat('vendors.min.js'))
            .pipe(minifier({}, uglifyjs))
            .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib'));
    } else {
        gulp.src([
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery-1.8.3.js',
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery.event.drag-2.2.js',
            config.paths.project.root + '/node_modules/slickgrid/lib/jquery-ui-1.9.2.js',
            config.paths.project.root + '/node_modules/underscore/underscore-min.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.core.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.grid.js',
            config.paths.project.root + '/node_modules/slickgrid/slick.editors.js',
            config.paths.project.root + '/node_modules/core-js/client/shim.min.js',
            config.paths.project.root + '/node_modules/rangy/lib/rangy-core.js',
            config.paths.project.root  + '/node_modules/rangy/lib/rangy-textrange.js',
            config.paths.project.root  + '/node_modules/reflect-metadata/Reflect.js',
            config.paths.project.root  + '/node_modules/systemjs/dist/system.src.js',
            config.paths.project.root  + '/src/views/htmlcontent/systemjs.config.js'
        ])
            .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib'));

        gulp.src([config.paths.project.root + '/node_modules/zone.js/**/*'])
        .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib/zone.js'));
    }

    // copy source maps
    gulp.src([
        // config.paths.html.root + '/node_modules/es6-shim/es6-shim.map',
        config.paths.project.root  + '/node_modules/reflect-metadata/Reflect.js.map',
        config.paths.project.root + '/node_modules/systemjs/dist/system-polyfills.js.map',
        config.paths.project.root + '/node_modules/systemjs-plugin-json/json.js'
    ]).pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib'));

    gulp.src([
        config.paths.project.root  + '/node_modules/angular2-slickgrid/components/css/SlickGrid.css',
        config.paths.project.root + '/node_modules/slickgrid/slick.grid.css'
    ]).pipe(gulp.dest('out/src/views/htmlcontent/src/css'));

    gulp.src([
        config.paths.project.root  + '/node_modules/angular2-slickgrid/index.js',
        config.paths.project.root  + '/node_modules/angular2-slickgrid/components/**/*.js'
    ], { base: config.paths.project.root + '/node_modules/angular2-slickgrid' }).pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib/angular2-slickgrid'));

    return gulp.src([config.paths.project.root + '/node_modules/@angular/**/*'])
        .pipe(gulp.dest('out/src/views/htmlcontent/src/js/lib/@angular'));
});

// Compile tests
gulp.task('ext:compile-tests', (done) => {
    return gulp.src([
        config.paths.project.root + '/test/**/*.ts',
        config.paths.project.root + '/typings/**/*.ts'])
        .pipe(srcmap.init())
        .pipe(tsProject())
        .on('error', function() {
            if (process.env.BUILDMACHINE) {
                done('Extension Tests failed to build. See Above.');
                process.exit(1);
            }
        })
        .pipe(srcmap.write('.', {
           sourceRoot: function(file){ return file.cwd + '/test'; }
                }))
        .pipe(gulp.dest('out/test/'));

});

gulp.task('ext:compile', gulp.series('ext:compile-src', 'ext:compile-tests', 'ext:copy-OE-assets', 'ext:copy-queryHistory-assets'));

gulp.task('ext:copy-tests', () => {
    return gulp.src(config.paths.project.root + '/test/resources/**/*')
            .pipe(gulp.dest(config.paths.project.root + '/out/test/resources/'))
});

gulp.task('ext:copy-config', () => {
    var env = process.env.VsMsSqlEnv;
    env = env == undefined ? "dev" : env;
    return gulp.src(config.paths.project.root + '/src/configurations/' + env + '.config.json')
            .pipe(rename('config.json'))
            .pipe(gulp.dest(config.paths.project.root + '/out/src'));
});

gulp.task('ext:copy-js', () => {
    return gulp.src([
            config.paths.project.root + '/src/**/*.js',
            '!' + config.paths.project.root + '/src/views/htmlcontent/**/*'])
        .pipe(gulp.dest(config.paths.project.root + '/out/src'))
});

// Copy the files which aren't used in compilation
gulp.task('ext:copy', gulp.series('ext:copy-tests', 'ext:copy-js', 'ext:copy-config', 'ext:copy-systemjs-config', 'ext:copy-dependencies', 'ext:copy-html', 'ext:copy-css', 'ext:copy-images'));

gulp.task('ext:localization', gulp.series('ext:localization:xliff-to-ts', 'ext:localization:xliff-to-json', 'ext:localization:xliff-to-package.nls'));

gulp.task('ext:build', gulp.series('ext:localization', 'ext:copy', 'ext:clean-library-ts-files', 'ext:compile', 'ext:compile-view')); // removed lint before copy

gulp.task('ext:test', (done) => {
    let workspace = process.env['WORKSPACE'];
    if (!workspace) {
        workspace = process.cwd();
    }
    process.env.JUNIT_REPORT_PATH = workspace + '/test-reports/ext_xunit.xml';
    var args = ['--verbose', '--disable-gpu', '--disable-telemetry', '--disable-updates', '-n'];
    let vscodeVersion = packageJson.engines.vscode.slice(1);
    let extensionTestsPath = `${workspace}/out/test`;
    vscodeTest.downloadAndUnzipVSCode(vscodeVersion).then((vscodePath) => {
        if (vscodePath) {
            vscodeTest.runTests({
                vscodeExecutablePath: vscodePath,
                extensionDevelopmentPath: workspace,
                extensionTestsPath: extensionTestsPath,
                launchArgs: args
            }).then(() => done()).catch((error) => {
                console.log(`stdout: ${process.stdout}`);
                console.log(`stderr: ${process.stderr}`);
                console.error(`exec error: ${error}`);
                done(error);
            });
        }
    })
});

gulp.task('test', gulp.series('ext:test'));

require('./tasks/covertasks');

gulp.task('clean', function (done) {
    return del('out', done);
});

gulp.task('build', gulp.series('clean', 'ext:build', 'ext:install-service'));

gulp.task('watch', function(){
    return gulp.watch(config.paths.project.root + '/src/**/*', gulp.series('build'))
});

gulp.task('lint', gulp.series('ext:lint'));
