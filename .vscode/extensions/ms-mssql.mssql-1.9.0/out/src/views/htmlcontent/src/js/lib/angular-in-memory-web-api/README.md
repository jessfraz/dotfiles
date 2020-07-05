# Angular in-memory-web-api
[![Build Status][travis-badge]][travis-badge-url]

>**UPDATE NOTICE**
>
>As of v.0.1.0, the npm package was renamed from `angular2-in-memory-web-api` to its current name,
`angular-in-memory-web-api`. All versions ***after 0.0.21*** are shipped under this name.
**Be sure to update your `package.json` and import statements**.

An in-memory web api for Angular demos and tests.

It will intercept HTTP requests that would otherwise go to the remote server
via the Angular `XHRBackend` service

This in-memory web api service processes an HTTP request and 
returns an `Observable` of HTTP `Response` object
in the manner of a RESTy web api.
It natively handles URI patterns in the form :base/:collectionName/:id?

Examples:
```ts
  // for store with a 'heroes' collection
  GET api/heroes          // all heroes
  GET api/heroes/42       // the character with id=42
  GET api/heroes?name=^j  // 'j' is a regex; returns heroes whose name starting with 'j' or 'J'
  GET api/heroes.json/42  // ignores the ".json"
```
Also accepts
  "commands":
  ```
    POST "resetDb",
    GET/POST "config" - get or (re)set the config
  ```

## Basic usage
Create an `InMemoryDataService` class that implements `InMemoryDataService`.

At minimum it must implement `createDb` which 
creates a "database" hash whose keys are collection names
and whose values are arrays of collection objects to return or update.
For example:
```ts
import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemHeroService implements InMemoryDbService {
  createDb() {
    let heroes = [
      { id: '1', name: 'Windstorm' },
      { id: '2', name: 'Bombasto' },
      { id: '3', name: 'Magneta' },
      { id: '4', name: 'Tornado' }
    ];
    return {heroes};
  }
}
```

Register this module and your service implementation in `AppModule.imports`
calling the `forRoot` static method with this service class and optional configuration object:
```ts
// other imports
import { HttpModule }           from '@angular/http';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';

import { InMemHeroService }     from '../app/hero-data';
@NgModule({
 imports: [
   HttpModule,
   InMemoryWebApiModule.forRoot(InMemHeroService),
   ...
 ],
 ...
})
export class AppModule { ... }
```

See examples in the Angular.io such as the
[Server Communication](https://angular.io/docs/ts/latest/guide/server-communication.html) and
[Tour of Heroes](https://angular.io/docs/ts/latest/tutorial/toh-pt6.html) chapters.

>Always import the `InMemoryWebApiModule` _after_ the `HttpModule` to ensure that 
the `XHRBackend` provider of the `InMemoryWebApiModule` supersedes all others.

# Bonus Features
Some features are not readily apparent in the basic usage example.

The `InMemoryBackendConfigArgs` defines a set of options. Add them as the second `forRoot` argument:
```ts
   InMemoryWebApiModule.forRoot(InMemHeroService, { delay: 500 }),
```

## Simple query strings
Pass custom filters as a regex pattern via query string. 
The query string defines which property and value to match.

Format: `/app/heroes/?propertyName=regexPattern`

The following example matches all names start with the letter 'j'  or 'J' in the heroes collection.

`/app/heroes/?name=^j`

>Search pattern matches are case insensitive by default. 
Set `config.caseSensitiveSearch = true` if needed.

## Pass thru to a live XHRBackend

If an existing, running remote server should handle requests for collections 
that are not in the in-memory database, set `Config.passThruUnknownUrl: true`.
This service will forward unrecognized requests via a base version of the Angular XHRBackend.

## _parseUrl_ override

The `parseUrl` method breaks down the request URL into a `ParsedUrl` object.
`ParsedUrl` is a public interface whose properties guide the in-memory web api
as it processes the request.

Request URLs for your api may not match the api imagined by the default `parseUrl` and may even cause it to throw an error.
You can override the default by implementing a `parseUrl` method in your `InMemoryDbService`.
Such a method must take the incoming request URL string and return a `ParsedUrl` object. 

## HTTP method interceptors

If you make requests this service can't handle but still want an in-memory database to hold values,
override the way this service handles any HTTP method by implementing a method in
your `InMemoryDbService` that does the job.

The `InMemoryDbService` method name must be the same as the HTTP method name but all lowercase.
This service calls it with an `HttpMethodInterceptorArgs` object.
For example, your HTTP GET interceptor would be called like this:
e.g., `yourInMemDbService["get"](interceptorArgs)`.
Your method must return an `Observable<Response>`

The `HttpMethodInterceptorArgs` (as of this writing) are:
```ts
requestInfo: RequestInfo;           // parsed request
db: Object;                         // the current in-mem database collections
config: InMemoryBackendConfigArgs;  // the current config
passThruBackend: ConnectionBackend; // pass through backend, if it exists
```
## Examples

The file `examples/hero-data.service.ts` is an example of a Hero-oriented `InMemoryDbService`,
derived from the [HTTP Client](https://angular.io/docs/ts/latest/guide/server-communication.html) 
sample in the Angular documentation.

Add the following line to `AppModule.imports`
```ts
InMemoryWebApiModule.forRoot(HeroDataService)
```
  
That file also has a `HeroDataOverrideService` derived class that demonstrates overriding
the `parseUrl` method and an HTTP GET interceptor.

Add the following line to `AppModule.imports` to see it in action:
```ts
InMemoryWebApiModule.forRoot(HeroDataOverrideService)
```

# To Do
* add tests (shameful omission!)

# Build Instructions

Mostly gulp driven.

The following describes steps for updating from one Angular version to the next

>This is essential even when there are no changes of real consequence.
Neglecting to synchronize Angular 2 versions
triggers typescript definition duplication error messages when
compiling your application project.

- `gulp bump` - up the package version number

- update `CHANGELOG.MD` to record the change

- update the dependent version(s) in `package.json`

- `npm install` the new package(s) (make sure they really do install!)<br>
   `npm list --depth=0`

- consider updating typings, install individually/several:
  `npm run typings -- install packagename --ambient --save`

   **NB: Do not add to `npm postinstall` as that screws up consumers!**

- `npm run typings install`

- `npm run tsc` to confirm the project compiles w/o error (sanity check)

 -- NO TESTS YET ... BAD --

- `gulp build`
- commit and push

- `npm publish`

- Fix and validate angular.io docs samples

- Add two tags to the release commit with for unpkg
  - the version number
  - 'latest'

[travis-badge]: https://travis-ci.org/angular/in-memory-web-api.svg?branch=master
[travis-badge-url]: https://travis-ci.org/angular/in-memory-web-api
