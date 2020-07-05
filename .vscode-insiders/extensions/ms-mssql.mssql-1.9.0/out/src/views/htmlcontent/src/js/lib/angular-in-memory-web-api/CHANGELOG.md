# "angular-in-memory-web-api" versions

<a name="0.1.13"></a>
## 0.1.13 (2016-10-20)
* Update README for 0.1.11 breaking change: npm publish as `esm` and a `umd` bundle

  Going to `umd` changes your `systemjs.config` and the way you import the library.

  In `systemjs.config.js` you should change the mapping to:
  ```
  'angular-in-memory-web-api': 'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js'
  ```
  then delete from `packages`:
  ```
  'angular-in-memory-web-api': {		
    main: './index.js',		
    defaultExtension: 'js'		
  }
  ```
  You must ES import the in-mem module (typically in `AppModule`) like this:
  ```
  import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
  ```
<a name="0.1.12"></a>
## 0.1.12 (2016-10-19)
* exclude travis.yml and rollup.config.js from npm package

<a name="0.1.11"></a>
## 0.1.11 (2016-10-19)
* BREAKING CHANGE: npm publish as `esm` and a `umd` bundle.
Does not change the API but does change the way you register and import the
in-mem module. Documented in later release, v.0.1.13

<a name="0.1.10"></a>
## 0.1.10 (2016-10-19)
* Catch a `handleRequest` error and return as a failed server response.

<a name="0.1.9"></a>
## 0.1.9 (2016-10-18)
* Restore delay option, issue #53.

<a name="0.1.7"></a>
## 0.1.7 (2016-10-12)
* Angular 2.1.x support.

<a name="0.1.6"></a>
## 0.1.6 (2016-10-09)
* Do not add delay to observable if delay value === 0 (issue #47)
* Can override `parseUrl` method in your db service class (issue #46, #35)
* README.md explains `parseUrl` override.
* Exports functions helpful for custom HTTP Method Interceptors
  * `createErrorResponse`
  * `createObservableResponse`
  * `setStatusText`
* Added `examples/hero-data.service.ts` to show overrides (issue #44)

<a name="0.1.5"></a>
## 0.1.5 (2016-10-03)
* project.json license changed again to match angular.io package.json

<a name="0.1.4"></a>
## 0.1.4 (2016-10-03)
* project.json license is "MIT"

<a name="0.1.3"></a>
## 0.1.3 (2016-09-29)
* Fix typos

<a name="0.1.2"></a>
## 0.1.2 (2016-09-29)
* AoT support from Tor PR #36
* Update npm packages
* `parseId` fix from PR #33

<a name="0.1.1"></a>
## 0.1.1 (2016-09-26)
* Exclude src folder and its TS files from npm package

<a name="0.1.0"></a>
## 0.1.0 (2016-09-25)
* Renamed package to "angular-in-memory-web-api"
* Added "passThruUnknownUrl" options
* Simplified `forRoot` and made it acceptable to AoT
* Support case sensitive search (PR #16)

# "angular2-in-memory-web-api" versions
The last npm package named "angular2-in-memory-web-api" was v.0.0.21

<a name="0.0.21"></a>
## 0.0.21 (2016-09-25)
* Add source maps (PR #14)

<a name="0.0.20"></a>
## 0.0.20 (2016-09-15)
* Angular 2.0.0
* Typescript 2.0.2

<a name="0.0.19"></a>
## 0.0.19 (2016-09-13)
* RC7

<a name="0.0.18"></a>
## 0.0.18 (2016-08-31)
* RC6 (doesn't work with older versions)

<a name="0.0.17"></a>
## 0.0.17 (2016-08-19)
* fix `forRoot` type constraint
* clarify `forRoot` param

<a name="0.0.16"></a>
## 0.0.16 (2016-08-19)
* No longer exports `HttpModule`
* Can specify configuration options in 2nd param of `forRoot`
* jsDocs for `forRoot`

<a name="0.0.15"></a>
## 0.0.15 (2016-08-09)
* RC5
* Support for NgModules

<a name="0.0.14"></a>
## 0.0.14 (2016-06-30)
* RC4

<a name="0.0.13"></a>
## 0.0.13 (2016-06-21)
* RC3

<a name="0.0.12"></a>
## 0.0.12 (2016-06-15)
* RC2

<a name="0.0.11"></a>
## 0.0.11 (2016-05-27)
* add RegExp query support
* find-by-id is sensitive to string ids that look like numbers

<a name="0.0.10"></a>
## 0.0.10 (2016-05-21)
* added "main:index.js" to package.json
* updated to typings v.1.0.4 (a breaking release)
* dependencies -> peerDependencies|devDependencies
* no es6-shim dependency.
* use core-js as devDependency.

<a name="0.0.9"></a>
## 0.0.9 (2016-05-19)
* renamed the barrel core.js -> index.js

<a name="0.0.8"></a>
## 0.0.8 (2016-05-19)
* systemjs -> commonjs
* replace es6-shim typings w/ core-js typings

<a name="0.0.7"></a>
## 0.0.7 (2016-05-03)
* RC1
* update to 2.0.0-rc.1

<a name="0.0.6"></a>
## 0.0.6 (2016-05-03)
* RC0
* update to 2.0.0-rc.0

<a name="0.0.5"></a>
## 0.0.5 (2016-05-01)
* PROVISIONAL - refers to @angular packages
* update to 0.0.0-5

<a name="0.0.4"></a>
## 0.0.4 (2016-04-30)
* PROVISIONAL - refers to @angular packages
* update to 0.0.0-3
* rxjs: "5.0.0-beta.6"

<a name="0.0.3"></a>
## 0.0.3 (2016-04-29)
* PROVISIONAL - refers to @angular packages
* update to 0.0.0-2

<a name="0.0.2"></a>
## 0.0.2 (2016-04-27)
* PROVISIONAL - refers to @angular packages

<a name="0.0.1"></a>
## 0.0.1 (2016-04-27)
* DO NOT USE. Not adapted to new package system.
* Initial cut for Angular 2 repackaged
  * target forthcoming Angular 2 RC
