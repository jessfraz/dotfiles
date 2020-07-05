"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const core_1 = require("@angular/core");
const platform_browser_1 = require("@angular/platform-browser");
const forms_1 = require("@angular/forms");
const http_1 = require("@angular/http");
const angular2_slickgrid_1 = require("angular2-slickgrid");
const app_component_1 = require("./components/app.component");
const scroll_directive_1 = require("./directives/scroll.directive");
const mousedown_directive_1 = require("./directives/mousedown.directive");
const contextmenu_component_1 = require("./components/contextmenu.component");
const messagescontextmenu_component_1 = require("./components/messagescontextmenu.component");
/**
 * Top level angular module, no actual content here
 */
const WINDOW_PROVIDER = {
    provide: Window,
    useValue: window
};
let AppModule = class AppModule {
};
AppModule = __decorate([
    core_1.NgModule({
        imports: [
            platform_browser_1.BrowserModule,
            http_1.HttpModule,
            http_1.JsonpModule,
            forms_1.FormsModule
        ],
        providers: [
            WINDOW_PROVIDER
        ],
        declarations: [app_component_1.AppComponent, angular2_slickgrid_1.SlickGrid, scroll_directive_1.ScrollDirective, mousedown_directive_1.MouseDownDirective, contextmenu_component_1.ContextMenu, messagescontextmenu_component_1.MessagesContextMenu],
        bootstrap: [app_component_1.AppComponent]
    })
], AppModule);
exports.AppModule = AppModule;

//# sourceMappingURL=app.module.js.map
