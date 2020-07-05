import { Injector, NgModule } from '@angular/core';
import { XHRBackend } from '@angular/http';
import { InMemoryBackendConfig, InMemoryBackendService, InMemoryDbService } from './in-memory-backend.service';
// AoT requires factory to be exported
export function inMemoryBackendServiceFactory(injector, dbService, options) {
    var backend = new InMemoryBackendService(injector, dbService, options);
    return backend;
}
export var InMemoryWebApiModule = (function () {
    function InMemoryWebApiModule() {
    }
    /**
    *  Prepare in-memory-web-api in the root/boot application module
    *  with class that implements InMemoryDbService and creates an in-memory database.
    *
    * @param {Type} dbCreator - Class that creates seed data for in-memory database. Must implement InMemoryDbService.
    * @param {InMemoryBackendConfigArgs} [options]
    *
    * @example
    * InMemoryWebApiModule.forRoot(dbCreator);
    * InMemoryWebApiModule.forRoot(dbCreator, {useValue: {delay:600}});
    */
    InMemoryWebApiModule.forRoot = function (dbCreator, options) {
        return {
            ngModule: InMemoryWebApiModule,
            providers: [
                { provide: InMemoryDbService, useClass: dbCreator },
                { provide: InMemoryBackendConfig, useValue: options },
            ]
        };
    };
    InMemoryWebApiModule.decorators = [
        { type: NgModule, args: [{
                    // Must useFactory for AoT
                    // https://github.com/angular/angular/issues/11178
                    providers: [{ provide: XHRBackend,
                            useFactory: inMemoryBackendServiceFactory,
                            deps: [Injector, InMemoryDbService, InMemoryBackendConfig] }]
                },] },
    ];
    /** @nocollapse */
    InMemoryWebApiModule.ctorParameters = [];
    return InMemoryWebApiModule;
}());
//# sourceMappingURL=in-memory-web-api.module.js.map