/**
 * System configuration for Angular 2 samples
 * Adjust as necessary for your application needs.
 */
(function(global) {
  var paths = {
    'npm:': 'views/htmlcontent/src/js/lib/'
  }
  // map tells the System loader where to look for things
  var map = {
    'app':                        'views/htmlcontent/src/js',
    '@angular':                   'npm:@angular',
    'rxjs':                       'npm:rxjs',
    'json':                       'npm:json.js',
    'angular2-slickgrid':         'npm:angular2-slickgrid',
    '@angular/common':            'npm:@angular/common/bundles/common.umd.js',
    '@angular/compiler':          'npm:@angular/compiler/bundles/compiler.umd.js',
    '@angular/core':              'npm:@angular/core/bundles/core.umd.js',
    '@angular/forms':             'npm:@angular/forms/bundles/forms.umd.js',
    '@angular/http':              'npm:@angular/http/bundles/http.umd.js',
    '@angular/platform-browser':  'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
    '@angular/platform-browser-dynamic':  'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
    '@angular/router':            'npm:@angular/router/bundles/router.umd.js',
    '@angular/upgrade':           'npm:@angular/upgrade/bundles/upgrade.umd.js',
    'angular-in-memory-web-api':  'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js'
  };
  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'app':                        { main: 'main.js',  defaultExtension: 'js' },
    '':                           { main: 'views/htmlcontent/src/js/constants.js', defaultExtension: 'js'},
    'angular2-slickgrid':         { main: 'index.js', defaultExtension: 'js'},
    '/src/controllers':           { defaultExtension: 'js' },
    'rxjs':                       { main: 'Rx.js', defaultExtension: 'js' }
  };
  var meta = {
    '**/*.json' : {
      loader: 'json'
    }
  }
  var config = {
    paths: paths,
    map: map,
    packages: packages,
    meta: meta
  };
  System.config(config);
})(this);
