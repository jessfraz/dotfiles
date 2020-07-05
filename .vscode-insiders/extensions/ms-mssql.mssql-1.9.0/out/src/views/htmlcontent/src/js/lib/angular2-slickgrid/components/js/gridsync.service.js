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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const core_1 = require('@angular/core');
const Rx_1 = require('rxjs/Rx');
const selectionmodel_1 = require('./selectionmodel');
let GridSyncService = class GridSyncService {
    constructor() {
        this.columnMinWidthPX = 30;
        this._scrollLeftPX = 0;
        this._scrollBarWidthPX = 0;
        this._columnWidthPXs = [];
        this._updated = new Rx_1.Subject();
        this._typeDropdownOffset = new Rx_1.Subject();
        this._initialColumnWidthPXsOnResize = [];
        this._isGridReadOnly = false;
    }
    initialColumnResize() {
        this._initialColumnWidthPXsOnResize = this._columnWidthPXs.slice(0);
    }
    resizeColumn(index, deltaWidthPX) {
        this._columnWidthPXs = this._initialColumnWidthPXsOnResize.slice(0);
        let newWidthPX = this._columnWidthPXs[index] + deltaWidthPX;
        this.setColumnWidthPX(index, newWidthPX);
        this.notifyUpdates('columnWidthPXs');
    }
    openTypeDropdown(columnIndex) {
        let offset = this._rowNumberColumnWidthPX + this._columnWidthPXs.slice(0, columnIndex).reduce((x, y) => x + y, 0) - this.scrollLeftPX;
        this._typeDropdownOffset.next([columnIndex, offset]);
    }
    setColumnWidthPX(index, widthPX) {
        if (index < 0 || index >= this._columnWidthPXs.length) {
            return;
        }
        if (widthPX >= this.columnMinWidthPX) {
            this._columnWidthPXs[index] = widthPX;
        }
        else {
            this._columnWidthPXs[index] = this.columnMinWidthPX;
            if (index > 0) {
                let leftShrink = this.columnMinWidthPX - widthPX;
                this.setColumnWidthPX(index - 1, this._columnWidthPXs[index - 1] - leftShrink);
            }
        }
    }
    set underlyingSelectionModel(selectionModel) {
        this._selectionModel = new selectionmodel_1.SelectionModel(selectionModel, new Slick.EventHandler(), new Slick.Event(), (fromRow, fromCell, toRow, toCell) => new Slick.Range(fromRow, fromCell, toRow, toCell));
    }
    get updated() {
        return this._updated;
    }
    get typeDropdownOffset() {
        return this._typeDropdownOffset;
    }
    set scrollLeftPX(value) {
        this._scrollLeftPX = value;
        this.notifyUpdates('scrollLeftPX');
    }
    get scrollLeftPX() {
        return this._scrollLeftPX;
    }
    set scrollBarWidthPX(value) {
        this._scrollBarWidthPX = value;
        this.notifyUpdates('scrollBarWidthPX');
    }
    get scrollBarWidthPX() {
        return this._scrollBarWidthPX;
    }
    set columnWidthPXs(value) {
        this._columnWidthPXs = value;
        this.notifyUpdates('columnWidthPXs');
    }
    get columnWidthPXs() {
        return this._columnWidthPXs;
    }
    set rowNumberColumnWidthPX(value) {
        this._rowNumberColumnWidthPX = value;
        this.notifyUpdates('rowNumberColumnWidthPX');
    }
    get rowNumberColumnWidthPX() {
        return this._rowNumberColumnWidthPX;
    }
    get selectionModel() {
        return this._selectionModel;
    }
    set isGridReadOnly(value) {
        this._isGridReadOnly = value;
        this.notifyUpdates('isGridReadOnly');
    }
    get isGridReadOnly() {
        return this._isGridReadOnly;
    }
    notifyUpdates(propertyName) {
        this._updated.next(propertyName);
    }
};
GridSyncService = __decorate([
    core_1.Injectable(), 
    __metadata('design:paramtypes', [])
], GridSyncService);
exports.GridSyncService = GridSyncService;
