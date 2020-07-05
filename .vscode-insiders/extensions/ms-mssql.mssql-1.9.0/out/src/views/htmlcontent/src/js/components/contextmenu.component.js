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
const shortcuts_service_1 = require("./../services/shortcuts.service");
const Constants = require("./../constants");
/**
 * The component that acts as the contextMenu for slick grid
 */
const template = `
<ul class="contextMenu" style="position:absolute" [class.hidden]="!visible" [style.top.px]="position.y" [style.left.px]="position.x">
    <li id="savecsv" (click)="handleContextActionClick('savecsv')" [class.disabled]="isDisabled"> {{Constants.saveCSVLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.saveAsCSV']}}</span></li>
    <li id="savejson" (click)="handleContextActionClick('savejson')" [class.disabled]="isDisabled"> {{Constants.saveJSONLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.saveAsJSON']}}</span></li>
    <li id="saveexcel" (click)="handleContextActionClick('saveexcel')" [class.disabled]="isDisabled"> {{Constants.saveExcelLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.saveAsExcel']}}</span></li>
    <li id="selectall" (click)="handleContextActionClick('selectall')" [class.disabled]="isDisabled"> {{Constants.selectAll}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.selectAll']}}</span></li>
    <li id="copy" (click)="handleContextActionClick('copySelection')" [class.disabled]="isDisabled"> {{Constants.copyLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.copySelection']}}</span></li>
    <li id="copyWithHeaders" (click)="handleContextActionClick('copyWithHeaders')" [class.disabled]="isDisabled"> {{Constants.copyWithHeadersLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.copyWithHeaders']}}</span></li>
    <li id="copyAllHeaders" (click)="handleContextActionClick('copyAllHeaders')" [class.disabled]="isDisabled"> {{Constants.copyAllHeadersLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.copyAllHeaders']}}</span></li>
</ul>
`;
let ContextMenu = class ContextMenu {
    constructor(shortcuts) {
        this.shortcuts = shortcuts;
        // tslint:disable-next-line:no-unused-variable
        this.Constants = Constants;
        this.clickEvent = new core_1.EventEmitter();
        this.position = { x: 0, y: 0 };
        this.visible = false;
        this.keys = {
            'event.saveAsCSV': '',
            'event.saveAsJSON': '',
            'event.selectAll': '',
            'event.copySelection': '',
            'event.copyWithHeaders': '',
            'event.copyAllHeaders': ''
        };
        const self = this;
        for (let key in this.keys) {
            if (this.keys.hasOwnProperty(key)) {
                this.shortcuts.stringCodeFor(key).then((result) => {
                    self.keys[key] = result;
                });
            }
        }
    }
    ngOnInit() {
        const self = this;
        $(document).on('click', () => {
            self.hide();
        });
    }
    show(x, y, batchId, resultId, index, selection) {
        this.batchId = batchId;
        this.resultId = resultId;
        this.index = index;
        this.selection = selection;
        this.position = { x: x, y: y };
        this.visible = true;
    }
    hide() {
        this.visible = false;
    }
    handleContextActionClick(type) {
        if (!this.isDisabled) {
            this.clickEvent.emit({ 'type': type, 'batchId': this.batchId, 'resultId': this.resultId, 'selection': this.selection, 'index': this.index });
        }
    }
};
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], ContextMenu.prototype, "clickEvent", void 0);
ContextMenu = __decorate([
    core_1.Component({
        selector: 'context-menu',
        providers: [shortcuts_service_1.ShortcutService],
        template: template
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => shortcuts_service_1.ShortcutService))),
    __metadata("design:paramtypes", [shortcuts_service_1.ShortcutService])
], ContextMenu);
exports.ContextMenu = ContextMenu;

//# sourceMappingURL=contextmenu.component.js.map
