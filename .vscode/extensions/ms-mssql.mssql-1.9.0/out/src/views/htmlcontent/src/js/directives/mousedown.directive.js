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
let MouseDownDirective = class MouseDownDirective {
    constructor(_el) {
        this._el = _el;
        this.onMouseDown = new core_1.EventEmitter();
        const self = this;
        setTimeout(() => {
            let $gridCanvas = $(this._el.nativeElement).find('.grid-canvas');
            $gridCanvas.on('mousedown', () => {
                self.onMouseDown.emit();
            });
            let mouseDownFuncs = $._data($gridCanvas[0], 'events')['mousedown'];
            // reverse the event array so that our event fires first.
            mouseDownFuncs.reverse();
        });
    }
};
__decorate([
    core_1.Output('mousedown'),
    __metadata("design:type", core_1.EventEmitter)
], MouseDownDirective.prototype, "onMouseDown", void 0);
MouseDownDirective = __decorate([
    core_1.Directive({
        selector: '[mousedown]'
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => core_1.ElementRef))),
    __metadata("design:paramtypes", [core_1.ElementRef])
], MouseDownDirective);
exports.MouseDownDirective = MouseDownDirective;

//# sourceMappingURL=mousedown.directive.js.map
