"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const core_1 = require("@angular/core");
const Observable_1 = require("rxjs/Observable");
let ScrollDirective = class ScrollDirective {
    constructor(_el) {
        this._el = _el;
        this.scrollEnabled = true;
        this.onScroll = new core_1.EventEmitter();
        const self = this;
        Observable_1.Observable.fromEvent(this._el.nativeElement, 'scroll').subscribe((event) => {
            if (self.scrollEnabled) {
                self.onScroll.emit(self._el.nativeElement.scrollTop);
            }
        });
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], ScrollDirective.prototype, "scrollEnabled", void 0);
__decorate([
    core_1.Output('onScroll'),
    __metadata("design:type", core_1.EventEmitter)
], ScrollDirective.prototype, "onScroll", void 0);
ScrollDirective = __decorate([
    core_1.Directive({
        selector: '[onScroll]'
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => core_1.ElementRef))),
    __metadata("design:paramtypes", [core_1.ElementRef])
], ScrollDirective);
exports.ScrollDirective = ScrollDirective;

//# sourceMappingURL=scroll.directive.js.map
