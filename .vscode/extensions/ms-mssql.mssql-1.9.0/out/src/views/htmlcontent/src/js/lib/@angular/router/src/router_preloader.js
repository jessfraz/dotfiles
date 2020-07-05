/**
*@license
*Copyright Google Inc. All Rights Reserved.
*
*Use of this source code is governed by an MIT-style license that can be
*found in the LICENSE file at https://angular.io/license
*/
import { Compiler, Injectable, Injector, NgModuleFactoryLoader } from '@angular/core';
import { from } from 'rxjs/observable/from';
import { of } from 'rxjs/observable/of';
import { _catch } from 'rxjs/operator/catch';
import { concatMap } from 'rxjs/operator/concatMap';
import { filter } from 'rxjs/operator/filter';
import { mergeAll } from 'rxjs/operator/mergeAll';
import { mergeMap } from 'rxjs/operator/mergeMap';
import { NavigationEnd, Router } from './router';
import { RouterConfigLoader } from './router_config_loader';
/**
 * @whatItDoes Provides a preloading strategy.
 *
 * @experimental
 */
export var PreloadingStrategy = (function () {
    function PreloadingStrategy() {
    }
    return PreloadingStrategy;
}());
/**
 * @whatItDoes Provides a preloading strategy that preloads all modules as quicky as possible.
 *
 * @howToUse
 *
 * ```
 * RouteModule.forRoot(ROUTES, {preloadingStrategy: PreloadAllModules})
 * ```
 *
 * @experimental
 */
export var PreloadAllModules = (function () {
    function PreloadAllModules() {
    }
    PreloadAllModules.prototype.preload = function (route, fn) {
        return _catch.call(fn(), function () { return of(null); });
    };
    return PreloadAllModules;
}());
/**
 * @whatItDoes Provides a preloading strategy that does not preload any modules.
 *
 * @description
 *
 * This strategy is enabled by default.
 *
 * @experimental
 */
export var NoPreloading = (function () {
    function NoPreloading() {
    }
    NoPreloading.prototype.preload = function (route, fn) { return of(null); };
    return NoPreloading;
}());
/**
 * The preloader optimistically loads all router configurations to
 * make navigations into lazily-loaded sections of the application faster.
 *
 * The preloader runs in the background. When the router bootstraps, the preloader
 * starts listening to all navigation events. After every such event, the preloader
 * will check if any configurations can be loaded lazily.
 *
 * If a route is protected by `canLoad` guards, the preloaded will not load it.
 */
export var RouterPreloader = (function () {
    function RouterPreloader(router, moduleLoader, compiler, injector, preloadingStrategy) {
        this.router = router;
        this.injector = injector;
        this.preloadingStrategy = preloadingStrategy;
        this.loader = new RouterConfigLoader(moduleLoader, compiler);
    }
    ;
    RouterPreloader.prototype.setUpPreloading = function () {
        var _this = this;
        var navigations = filter.call(this.router.events, function (e) { return e instanceof NavigationEnd; });
        this.subscription = concatMap.call(navigations, function () { return _this.preload(); }).subscribe(function (v) { });
    };
    RouterPreloader.prototype.preload = function () { return this.processRoutes(this.injector, this.router.config); };
    RouterPreloader.prototype.ngOnDestroy = function () { this.subscription.unsubscribe(); };
    RouterPreloader.prototype.processRoutes = function (injector, routes) {
        var res = [];
        for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
            var c = routes_1[_i];
            // we already have the config loaded, just recurce
            if (c.loadChildren && !c.canLoad && c._loadedConfig) {
                var childConfig = c._loadedConfig;
                res.push(this.processRoutes(childConfig.injector, childConfig.routes));
            }
            else if (c.loadChildren && !c.canLoad) {
                res.push(this.preloadConfig(injector, c));
            }
            else if (c.children) {
                res.push(this.processRoutes(injector, c.children));
            }
        }
        return mergeAll.call(from(res));
    };
    RouterPreloader.prototype.preloadConfig = function (injector, route) {
        var _this = this;
        return this.preloadingStrategy.preload(route, function () {
            var loaded = _this.loader.load(injector, route.loadChildren);
            return mergeMap.call(loaded, function (config) {
                var c = route;
                c._loadedConfig = config;
                return _this.processRoutes(config.injector, config.routes);
            });
        });
    };
    RouterPreloader.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    RouterPreloader.ctorParameters = [
        { type: Router, },
        { type: NgModuleFactoryLoader, },
        { type: Compiler, },
        { type: Injector, },
        { type: PreloadingStrategy, },
    ];
    return RouterPreloader;
}());
//# sourceMappingURL=router_preloader.js.map