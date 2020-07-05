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
const Utils = require("./../utils");
/**
 * The component that acts as the contextMenu for slick grid
 */
const template = `
<ul class="contextMenu" style="position:absolute" [class.hidden]="!visible" [style.top.px]="position.y" [style.left.px]="position.x">
    <li id="copy" (click)="handleContextActionClick('copySelection')" [class.disabled]="isDisabled"> {{Constants.copyLabel}}
        <span style="float: right; color: lightgrey; padding-left: 10px">{{keys['event.copySelection']}}</span>
    </li>
</ul>
`;
let MessagesContextMenu = class MessagesContextMenu {
    constructor(shortcuts) {
        this.shortcuts = shortcuts;
        this.Utils = Utils;
        this.Constants = Constants;
        this.clickEvent = new core_1.EventEmitter();
        this.position = { x: 0, y: 0 };
        this.visible = false;
        this.keys = {
            'event.copySelection': ''
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
    show(x, y, selectedRange) {
        this.selectedRange = selectedRange;
        let selectedText = (selectedRange && selectedRange.toString) ? selectedRange.toString() : '';
        this.isDisabled = selectedText.length === 0;
        this.position = { x: x, y: y };
        this.visible = true;
    }
    hide() {
        this.visible = false;
    }
    handleContextActionClick(type) {
        if (!this.isDisabled) {
            this.clickEvent.emit({ 'type': type, 'selectedRange': this.selectedRange });
        }
    }
};
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MessagesContextMenu.prototype, "clickEvent", void 0);
MessagesContextMenu = __decorate([
    core_1.Component({
        selector: 'msg-context-menu',
        providers: [shortcuts_service_1.ShortcutService],
        template: template
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => shortcuts_service_1.ShortcutService))),
    __metadata("design:paramtypes", [shortcuts_service_1.ShortcutService])
], MessagesContextMenu);
exports.MessagesContextMenu = MessagesContextMenu;

//# sourceMappingURL=messagescontextmenu.component.js.map
