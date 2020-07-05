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
const data_service_1 = require("./data.service");
const keycodes = {
    '37': 'left',
    '38': 'up',
    '39': 'right',
    '40': 'down'
};
const displayCodes = {
    'mac': {
        'ctrl': '⌘',
        'alt': '⌥',
        'shift': '⇧'
    },
    'windows': {
        'ctrl': 'Ctrl',
        'alt': 'Alt',
        'shift': 'Shift'
    },
    'linux': {
        'ctrl': 'Ctrl',
        'alt': 'Alt',
        'shift': 'Shift'
    }
};
/**
 * Service which performs the http requests to get the data resultsets from the server.
 */
let ShortcutService = class ShortcutService {
    constructor(dataService, window) {
        this.dataService = dataService;
        this.window = window;
        this.waitPromise = this.dataService.shortcuts.then((result) => {
            this.shortcuts = result;
        });
    }
    /**
     * determines the platform aware shortcut string for an event for display purposes
     * @param eventString The exact event string of the keycode you require (e.g event.toggleMessagePane)
     */
    stringCodeFor(eventString) {
        const self = this;
        if (this.shortcuts) {
            return Promise.resolve(this.stringCodeForInternal(eventString));
        }
        else {
            return new Promise((resolve, reject) => {
                self.waitPromise.then(() => {
                    resolve(self.stringCodeForInternal(eventString));
                });
            });
        }
    }
    stringCodeForInternal(eventString) {
        let keyString = this.shortcuts[eventString];
        if (keyString) {
            let platString = this.window.navigator.platform;
            // find the current platform
            if (platString.match(/win/i)) {
                // iterate through the display replacement that are defined
                for (let key in displayCodes['windows']) {
                    if (displayCodes['windows'].hasOwnProperty(key)) {
                        keyString = keyString.replace(key, displayCodes['windows'][key]);
                    }
                }
            }
            else if (platString.match(/linux/i)) {
                for (let key in displayCodes['linux']) {
                    if (displayCodes['linux'].hasOwnProperty(key)) {
                        keyString = keyString.replace(key, displayCodes['linux'][key]);
                    }
                }
            }
            else if (platString.match(/mac/i)) {
                for (let key in displayCodes['mac']) {
                    if (displayCodes['mac'].hasOwnProperty(key)) {
                        keyString = keyString.replace(key, displayCodes['mac'][key]);
                    }
                }
            }
            return keyString;
        }
    }
    getEvent(shortcut) {
        const self = this;
        if (this.shortcuts) {
            return Promise.resolve(this.getEventInternal(shortcut));
        }
        else {
            return new Promise((resolve, reject) => {
                self.waitPromise.then(() => {
                    resolve(self.getEventInternal(shortcut));
                });
            });
        }
    }
    getEventInternal(shortcut) {
        for (let event in this.shortcuts) {
            if (this.shortcuts.hasOwnProperty(event)) {
                if (this.shortcuts[event] === shortcut) {
                    return event;
                }
            }
        }
        return undefined;
    }
    /**
     * Builds a event string of ctrl, shift, alt, and a-z + up, down, left, right
     * based on a passed Jquery event object, i.e 'ctrl+alt+t'
     * @param e The Jquery event object to build the string from
     */
    buildEventString(e) {
        let resString = '';
        resString += (e.ctrlKey || e.metaKey) ? 'ctrl+' : '';
        resString += e.altKey ? 'alt+' : '';
        resString += e.shiftKey ? 'shift+' : '';
        resString += e.which >= 65 && e.which <= 90 ? String.fromCharCode(e.which) : keycodes[e.which];
        return resString;
    }
};
ShortcutService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(core_1.forwardRef(() => data_service_1.DataService))),
    __param(1, core_1.Inject(core_1.forwardRef(() => Window))),
    __metadata("design:paramtypes", [data_service_1.DataService,
        Window])
], ShortcutService);
exports.ShortcutService = ShortcutService;

//# sourceMappingURL=shortcuts.service.js.map
