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
var AppComponent_1;
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const core_1 = require("@angular/core");
const angular2_slickgrid_1 = require("angular2-slickgrid");
const interfaces_1 = require("../../../../../models/interfaces");
const data_service_1 = require("./../services/data.service");
const shortcuts_service_1 = require("./../services/shortcuts.service");
const contextmenu_component_1 = require("./contextmenu.component");
const messagescontextmenu_component_1 = require("./messagescontextmenu.component");
const Constants = require("./../constants");
const Utils = require("./../utils");
/** enableProdMode */
const core_2 = require("@angular/core");
core_2.enableProdMode();
// tslint:disable:max-line-length
const template = `
<div class="fullsize vertBox">
    <div *ngIf="dataSets.length > 0" id="resultspane" class="boxRow header collapsible" [class.collapsed]="!resultActive" (click)="toggleResultsPane()">
        <span> {{Constants.resultPaneLabel}} </span>
        <span class="shortCut"> {{resultShortcut}} </span>
    </div>
    <div id="results" *ngIf="renderedDataSets.length > 0" class="results vertBox scrollable"
         (onScroll)="onScroll($event)" [scrollEnabled]="scrollEnabled" [class.hidden]="!resultActive">
        <div class="boxRow content horzBox slickgrid" *ngFor="let dataSet of renderedDataSets; let i = index"
            [style.max-height]="renderedDataSets.length > 1 ? dataSet.maxHeight + 'px' : 'inherit'"
            [style.min-height]="renderedDataSets.length > 1 ? dataSet.minHeight + 'px' : 'inherit'"
            [style.font-size]="resultsFontSize + 'px'">
            <slick-grid tabindex="0" #slickgrid id="slickgrid_{{i}}" [columnDefinitions]="dataSet.columnDefinitions"
                        [ngClass]="i === activeGrid ? 'active' : ''"
                        [dataRows]="dataSet.dataRows"
                        (contextMenu)="openContextMenu($event, dataSet.batchId, dataSet.resultId, i)"
                        enableAsyncPostRender="true"
                        showDataTypeIcon="false"
                        showHeader="true"
                        [resized]="dataSet.resized"
                        (mousedown)="navigateToGrid(i)"
                        [selectionModel]="selectionModel"
                        [plugins]="slickgridPlugins"
                        class="boxCol content vertBox slickgrid">
            </slick-grid>
            <span class="boxCol content vertBox">
                <div class="boxRow content maxHeight" *ngFor="let icon of dataIcons">
                    <div *ngIf="icon.showCondition()" class="gridIcon">
                        <a class="icon" href="#"
                        (click)="icon.functionality(dataSet.batchId, dataSet.resultId, i)"
                        [title]="icon.hoverText()" [ngClass]="icon.icon()">
                        </a>
                    </div>
                </div>
            </span>
        </div>
    </div>
    <context-menu #contextmenu (clickEvent)="handleContextClick($event)"></context-menu>
    <msg-context-menu #messagescontextmenu (clickEvent)="handleMessagesContextClick($event)"></msg-context-menu>
    <div id="messagepane" class="boxRow header collapsible" [class.collapsed]="!messageActive" (click)="toggleMessagesPane()" style="position: relative">
        <div id="messageResizeHandle" class="resizableHandle"></div>
        <span> {{Constants.messagePaneLabel}} </span>
        <span class="shortCut"> {{messageShortcut}} </span>
    </div>
    <div id="messages" class="scrollable messages" [class.hidden]="!messageActive && dataSets.length !== 0"
        (contextmenu)="openMessagesContextMenu($event)">
        <br>
        <table id="messageTable">
            <colgroup>
                <col span="1" class="wide">
            </colgroup>
            <tbody>
                <template ngFor let-message [ngForOf]="messages">
                    <tr class='messageRow'>
                        <td><span *ngIf="!Utils.isNumber(message.batchId)">[{{message.time}}]</span></td>
                        <td class="messageValue" [class.errorMessage]="message.isError" [class.batchMessage]="Utils.isNumber(message.batchId)">{{message.message}} <a *ngIf="message.link" href="#" (click)="sendGetRequest(message.selection)">{{message.link.text}}</a>
                        </td>
                    </tr>
                </template>
                <tr id='executionSpinner' *ngIf="!complete">
                    <td><span *ngIf="messages.length === 0">[{{startString}}]</span></td>
                    <td>
                        <img src="views/htmlcontent/src/images/progress_36x_animation.gif" height="18px" />
                        <span style="vertical-align: bottom">{{Constants.executeQueryLabel}}</span>
                    </td>
                </tr>
                <tr *ngIf="complete">
                    <td></td>
                    <td>{{Utils.formatString(Constants.elapsedTimeLabel, totalElapsedTimeSpan)}}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div id="resizeHandle" [class.hidden]="!resizing" [style.top.px]="resizeHandleTop"></div>
</div>
`;
// tslint:enable:max-line-length
/**
 * Top level app component which runs and controls the SlickGrid implementation
 */
let AppComponent = AppComponent_1 = class AppComponent {
    constructor(dataService, shortcuts, _el, cd) {
        this.dataService = dataService;
        this.shortcuts = shortcuts;
        this._el = _el;
        this.cd = cd;
        // CONSTANTS
        this.scrollTimeOutTime = 200;
        this.windowSize = 50;
        this.maxScrollGrids = 8;
        this.selectionModel = 'DragRowSelectionModel';
        this.slickgridPlugins = ['AutoColumnSize'];
        this._rowHeight = 29;
        this._resultsPaneBoundary = 22;
        this._defaultNumShowingRows = 8;
        this.Constants = Constants;
        this.Utils = Utils;
        // the function implementations of keyboard available events
        this.shortcutfunc = {
            'event.focusResultsGrid': () => {
                this.slickgrids.toArray()[this.activeGrid]._grid.setActiveCell(0, 1);
            },
            'event.toggleResultPane': () => {
                this.resultActive = !this.resultActive;
            },
            'event.toggleMessagePane': () => {
                this.toggleMessagesPane();
            },
            'event.nextGrid': () => {
                this.navigateToGrid(this.activeGrid + 1);
            },
            'event.prevGrid': () => {
                this.navigateToGrid(this.activeGrid - 1);
            },
            'event.copySelection': () => {
                let range = this.getSelectedRangeUnderMessages();
                let messageText = range ? range.text() : '';
                if (messageText.length > 0) {
                    this.executeCopy(messageText);
                }
                else {
                    let activeGrid = this.activeGrid;
                    let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
                    selection = this.tryCombineSelections(selection);
                    this.dataService.copyResults(selection, this.renderedDataSets[activeGrid].batchId, this.renderedDataSets[activeGrid].resultId);
                }
            },
            'event.copyWithHeaders': () => {
                let activeGrid = this.activeGrid;
                let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
                selection = this.tryCombineSelections(selection);
                this.dataService.copyResults(selection, this.renderedDataSets[activeGrid].batchId, this.renderedDataSets[activeGrid].resultId, true);
            },
            'event.maximizeGrid': () => {
                this.magnify(this.activeGrid);
            },
            'event.selectAll': () => {
                this.slickgrids.toArray()[this.activeGrid].selection = true;
            },
            'event.saveAsCSV': () => {
                this.sendSaveRequest('csv');
            },
            'event.saveAsJSON': () => {
                this.sendSaveRequest('json');
            },
            'event.saveAsExcel': () => {
                this.sendSaveRequest('excel');
            }
        };
        this.dataIcons = [
            {
                showCondition: () => { return this.dataSets.length > 1; },
                icon: () => {
                    return this.renderedDataSets.length === 1
                        ? 'exitFullScreen'
                        : 'extendFullScreen';
                },
                hoverText: () => {
                    return this.renderedDataSets.length === 1
                        ? Constants.restoreLabel
                        : Constants.maximizeLabel;
                },
                functionality: (batchId, resultId, index) => {
                    this.magnify(index);
                }
            },
            {
                showCondition: () => { return true; },
                icon: () => { return 'saveCsv'; },
                hoverText: () => { return Constants.saveCSVLabel; },
                functionality: (batchId, resultId, index) => {
                    let selection = this.slickgrids.toArray()[index].getSelectedRanges();
                    selection = this.tryCombineSelections(selection);
                    if (selection.length <= 1) {
                        this.handleContextClick({ type: 'savecsv', batchId: batchId, resultId: resultId, index: index, selection: selection });
                    }
                    else {
                        this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
                    }
                }
            },
            {
                showCondition: () => { return true; },
                icon: () => { return 'saveJson'; },
                hoverText: () => { return Constants.saveJSONLabel; },
                functionality: (batchId, resultId, index) => {
                    let selection = this.slickgrids.toArray()[index].getSelectedRanges();
                    selection = this.tryCombineSelections(selection);
                    if (selection.length <= 1) {
                        this.handleContextClick({ type: 'savejson', batchId: batchId, resultId: resultId, index: index, selection: selection });
                    }
                    else {
                        this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
                    }
                }
            },
            {
                showCondition: () => { return true; },
                icon: () => { return 'saveExcel'; },
                hoverText: () => { return Constants.saveExcelLabel; },
                functionality: (batchId, resultId, index) => {
                    let selection = this.slickgrids.toArray()[index].getSelectedRanges();
                    selection = this.tryCombineSelections(selection);
                    if (selection.length <= 1) {
                        this.handleContextClick({ type: 'saveexcel', batchId: batchId, resultId: resultId, index: index, selection: selection });
                    }
                    else {
                        this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
                    }
                }
            }
        ];
        this.startString = new Date().toLocaleTimeString();
        // FIELDS
        // All datasets
        this.dataSets = [];
        // Place holder data sets to buffer between data sets and rendered data sets
        this.placeHolderDataSets = [];
        // Datasets currently being rendered on the DOM
        this.renderedDataSets = this.placeHolderDataSets;
        this.messages = [];
        this.messagesAdded = false;
        this.resizing = false;
        this.resizeHandleTop = 0;
        this.scrollEnabled = true;
        this.resultActive = true;
        this._messageActive = true;
        this.firstRender = true;
        this.resultsScrollTop = 0;
        this.activeGrid = 0;
        this.complete = false;
        this.hasRunQuery = false;
        /**
         * Add handler for clicking on xml link
         */
        this.xmlLinkHandler = (cellRef, row, dataContext, colDef) => {
            this.handleLink(cellRef, row, dataContext, colDef, 'xml');
        };
        /**
         * Add handler for clicking on json link
         */
        this.jsonLinkHandler = (cellRef, row, dataContext, colDef) => {
            this.handleLink(cellRef, row, dataContext, colDef, 'json');
        };
    }
    set messageActive(input) {
        this._messageActive = input;
        if (this.resultActive) {
            this.resizeGrids();
        }
    }
    get messageActive() {
        return this._messageActive;
    }
    /**
     * Called by Angular when the component is initialized
     */
    ngOnInit() {
        const self = this;
        this.setupResizeBind();
        this.dataService.config.then((config) => {
            this.config = config;
            self._messageActive = self.config.messagesDefaultOpen;
            self.resultsFontSize = self.config.resultsFontSize;
            this.shortcuts.stringCodeFor('event.toggleMessagePane').then((result) => {
                self.messageShortcut = result;
            });
            this.shortcuts.stringCodeFor('event.toggleResultPane').then((result) => {
                self.resultShortcut = result;
            });
        });
        this.dataService.dataEventObs.subscribe(event => {
            switch (event.type) {
                case 'start':
                    self.uri = event.data;
                    // Empty the data set if the query is run
                    // again on the same panel
                    if (self.hasRunQuery) {
                        self.dataSets = [];
                        self.placeHolderDataSets = [];
                        self.renderedDataSets = self.placeHolderDataSets;
                        self.messages = [];
                        self.complete = false;
                        self.messagesAdded = false;
                        self.hasRunQuery = false;
                    }
                    break;
                case 'complete':
                    self.totalElapsedTimeSpan = event.data;
                    self.complete = true;
                    self.messagesAdded = true;
                    self.hasRunQuery = true;
                    break;
                case 'message':
                    self.messages.push(event.data);
                    break;
                case 'resultSet':
                    let resultSet = event.data;
                    // Setup a function for generating a promise to lookup result subsets
                    let loadDataFunction = (offset, count) => {
                        return self.dataService.getRows(offset, count, resultSet.batchId, resultSet.id).then(rows => {
                            let gridData = [];
                            for (let row = 0; row < rows.rows.length; row++) {
                                // Push row values onto end of gridData for slickgrid
                                gridData.push({
                                    values: rows.rows[row]
                                });
                            }
                            return gridData;
                        });
                    };
                    // Precalculate the max height and min height
                    let maxHeight = resultSet.rowCount < self._defaultNumShowingRows
                        ? Math.max((resultSet.rowCount + 1) * self._rowHeight, self.dataIcons.length * 30) + 10
                        : 'inherit';
                    let minHeight = resultSet.rowCount >= self._defaultNumShowingRows
                        ? (self._defaultNumShowingRows + 1) * self._rowHeight + 10
                        : maxHeight;
                    // Store the result set from the event)
                    let dataSet = {
                        resized: undefined,
                        batchId: resultSet.batchId,
                        resultId: resultSet.id,
                        totalRows: resultSet.rowCount,
                        maxHeight: maxHeight,
                        minHeight: minHeight,
                        dataRows: new angular2_slickgrid_1.VirtualizedCollection(self.windowSize, resultSet.rowCount, loadDataFunction, index => { return { values: [] }; }),
                        columnDefinitions: resultSet.columnInfo.map((c, i) => {
                            let isLinked = c.isXml || c.isJson;
                            let linkType = c.isXml ? 'xml' : 'json';
                            return {
                                id: i.toString(),
                                name: c.columnName === 'Microsoft SQL Server 2005 XML Showplan'
                                    ? 'XML Showplan'
                                    : Utils.htmlEntities(c.columnName),
                                type: self.stringToFieldType('string'),
                                formatter: isLinked ? self.hyperLinkFormatter : AppComponent_1.textFormatter,
                                asyncPostRender: isLinked ? self.linkHandler(linkType) : undefined
                            };
                        })
                    };
                    self.dataSets.push(dataSet);
                    // Create a dataSet to render without rows to reduce DOM size
                    let undefinedDataSet = JSON.parse(JSON.stringify(dataSet));
                    undefinedDataSet.columnDefinitions = dataSet.columnDefinitions;
                    undefinedDataSet.dataRows = undefined;
                    undefinedDataSet.resized = new core_1.EventEmitter();
                    self.placeHolderDataSets.push(undefinedDataSet);
                    self.messagesAdded = true;
                    self.onScroll(0);
                    break;
                default:
                    console.error('Unexpected web socket event type "' + event.type + '" sent');
                    break;
            }
        });
        this.dataService.sendReadyEvent(this.uri);
    }
    ngAfterViewChecked() {
        if (this.messagesAdded) {
            this.messagesAdded = false;
            this.scrollMessages();
        }
    }
    /**
     * Used to convert the string to a enum compatible with SlickGrid
     */
    stringToFieldType(input) {
        let fieldtype;
        switch (input) {
            case 'string':
                fieldtype = interfaces_1.FieldType.String;
                break;
            default:
                fieldtype = interfaces_1.FieldType.String;
                break;
        }
        return fieldtype;
    }
    /**
     * Toggle the messages pane
     */
    toggleMessagesPane() {
        this.messageActive = !this.messageActive;
        if (this.messageActive) {
            this.resizeResults();
        }
    }
    /**
     * Toggle the results pane
     */
    toggleResultsPane() {
        this.resultActive = !this.resultActive;
        this.resizeResults();
    }
    /**
     * Send save result set request to service
     */
    handleContextClick(event) {
        switch (event.type) {
            case 'savecsv':
                this.dataService.sendSaveRequest(event.batchId, event.resultId, 'csv', event.selection);
                break;
            case 'savejson':
                this.dataService.sendSaveRequest(event.batchId, event.resultId, 'json', event.selection);
                break;
            case 'saveexcel':
                this.dataService.sendSaveRequest(event.batchId, event.resultId, 'excel', event.selection);
                break;
            case 'selectall':
                this.activeGrid = event.index;
                this.shortcutfunc['event.selectAll']();
                break;
            case 'copySelection':
                this.dataService.copyResults(event.selection, event.batchId, event.resultId);
                break;
            case 'copyWithHeaders':
                this.dataService.copyResults(event.selection, event.batchId, event.resultId, true);
                break;
            case 'copyAllHeaders':
                this.dataService.copyResults(undefined, event.batchId, event.resultId, true);
                break;
            default:
                break;
        }
    }
    openContextMenu(event, batchId, resultId, index) {
        let selection = this.slickgrids.toArray()[index].getSelectedRanges();
        selection = this.tryCombineSelections(selection);
        this.contextMenu.show(event.x, event.y, batchId, resultId, index, selection);
    }
    tryCombineSelections(selections) {
        if (!selections || selections.length === 0 || selections.length === 1) {
            return selections;
        }
        // If the selections combine into a single continuous selection, this will be the selection
        let unifiedSelection = {
            fromCell: selections.map(range => range.fromCell).reduce((min, next) => next < min ? next : min),
            fromRow: selections.map(range => range.fromRow).reduce((min, next) => next < min ? next : min),
            toCell: selections.map(range => range.toCell).reduce((max, next) => next > max ? next : max),
            toRow: selections.map(range => range.toRow).reduce((max, next) => next > max ? next : max)
        };
        // Verify whether all cells in the combined selection have actually been selected
        let verifiers = [];
        selections.forEach(range => {
            verifiers.push((cell) => {
                return cell[0] >= range.fromRow && cell[0] <= range.toRow && cell[1] >= range.fromCell && cell[1] <= range.toCell;
            });
        });
        for (let row = unifiedSelection.fromRow; row <= unifiedSelection.toRow; row++) {
            for (let column = unifiedSelection.fromCell; column <= unifiedSelection.toCell; column++) {
                // If some cell in the combined selection isn't actually selected, return the original selections
                if (!verifiers.some(verifier => verifier([row, column]))) {
                    return selections;
                }
            }
        }
        return [unifiedSelection];
    }
    sendSaveRequest(format) {
        let activeGrid = this.activeGrid;
        let batchId = this.renderedDataSets[activeGrid].batchId;
        let resultId = this.renderedDataSets[activeGrid].resultId;
        let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
        selection = this.tryCombineSelections(selection);
        this.dataService.sendSaveRequest(batchId, resultId, format, selection);
    }
    /**
     * Perform copy and do other actions for context menu on the messages component
     */
    handleMessagesContextClick(event) {
        switch (event.type) {
            case 'copySelection':
                let selectedText = event.selectedRange.text();
                this.executeCopy(selectedText);
                break;
            default:
                break;
        }
    }
    openMessagesContextMenu(event) {
        event.preventDefault();
        let selectedRange = this.getSelectedRangeUnderMessages();
        this.messagesContextMenu.show(event.clientX, event.clientY, selectedRange);
    }
    getSelectedRangeUnderMessages() {
        let selectedRange = undefined;
        let msgEl = this._el.nativeElement.querySelector('#messages');
        if (msgEl) {
            selectedRange = this.getSelectedRangeWithin(msgEl);
        }
        return selectedRange;
    }
    getSelectedRangeWithin(el) {
        let selectedRange = undefined;
        let sel = rangy.getSelection();
        let elRange = rangy.createRange();
        elRange.selectNodeContents(el);
        if (sel.rangeCount) {
            selectedRange = sel.getRangeAt(0).intersection(elRange);
        }
        elRange.detach();
        return selectedRange;
    }
    // Copy text as text
    executeCopy(text) {
        let input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = text;
        input.style.position = 'absolute';
        input.style.bottom = '100%';
        input.focus();
        input.select();
        document.execCommand('copy');
        input.remove();
    }
    handleLink(cellRef, row, dataContext, colDef, linkType) {
        const self = this;
        let value = self.getCellValueString(dataContext, colDef);
        $(cellRef).children('.xmlLink').click(function () {
            self.dataService.openLink(value, colDef.name, linkType);
        });
    }
    getCellValueString(dataContext, colDef) {
        let returnVal = '';
        if (!dataContext) {
            return returnVal;
        }
        let value = dataContext[colDef.field];
        if (Utils.isDbCellValue(value)) {
            returnVal = value.displayValue;
        }
        else if (typeof value === 'string') {
            returnVal = value;
        }
        return returnVal;
    }
    /**
     * Return asyncPostRender handler based on type
     */
    linkHandler(type) {
        if (type === 'xml') {
            return this.xmlLinkHandler;
        }
        else if (type === 'json') {
            return this.jsonLinkHandler;
        }
    }
    /**
     * Format xml field into a hyperlink and performs HTML entity encoding
     */
    hyperLinkFormatter(row, cell, value, columnDef, dataContext) {
        let cellClasses = 'grid-cell-value-container';
        let valueToDisplay;
        if (Utils.isDbCellValue(value)) {
            // Show NULL values as text
            if (Utils.isNullValueCell(value)) {
                return AppComponent_1.textFormatter(row, cell, value, columnDef, dataContext);
            }
            cellClasses += ' xmlLink';
            valueToDisplay = Utils.htmlEntities(value.displayValue);
            return `<a class="${cellClasses}" href="#" >${valueToDisplay}</a>`;
        }
        // If we make it to here, we don't have a DbCellValue
        cellClasses += ' missing-value';
        return `<span class="${cellClasses}"></span>`;
    }
    /**
     * Format all text to replace all new lines with spaces and performs HTML entity encoding
     */
    static textFormatter(row, cell, value, columnDef, dataContext) {
        let cellClasses = 'grid-cell-value-container';
        let valueToDisplay;
        if (Utils.isDbCellValue(value)) {
            valueToDisplay = Utils.htmlEntities(value.displayValue.replace(/(\r\n|\n|\r)/g, ' '));
            if (value.isNull) {
                cellClasses += ' missing-value';
            }
        }
        else {
            valueToDisplay = '';
        }
        return `<span title="${valueToDisplay}" class="${cellClasses}">${valueToDisplay}</span>`;
    }
    /**
     * Handles rendering the results to the DOM that are currently being shown
     * and destroying any results that have moved out of view
     * @param scrollTop The scrolltop value, if not called by the scroll event should be 0
     */
    onScroll(scrollTop) {
        const self = this;
        clearTimeout(self.scrollTimeOut);
        this.scrollTimeOut = setTimeout(() => {
            if (self.dataSets.length < self.maxScrollGrids) {
                self.scrollEnabled = false;
                for (let i = 0; i < self.placeHolderDataSets.length; i++) {
                    self.placeHolderDataSets[i].dataRows = self.dataSets[i].dataRows;
                    self.placeHolderDataSets[i].resized.emit();
                }
            }
            else {
                self.scrollEnabled = true;
                let gridHeight = self._el.nativeElement.getElementsByTagName('slick-grid')[0].offsetHeight;
                let tabHeight = self._el.nativeElement.querySelector('#results').offsetHeight;
                let numOfVisibleGrids = Math.ceil((tabHeight / gridHeight)
                    + ((scrollTop % gridHeight) / gridHeight));
                let min = Math.floor(scrollTop / gridHeight);
                let max = min + numOfVisibleGrids;
                for (let i = 0; i < self.placeHolderDataSets.length; i++) {
                    if (i >= min && i < max) {
                        if (self.placeHolderDataSets[i].dataRows === undefined) {
                            self.placeHolderDataSets[i].dataRows = self.dataSets[i].dataRows;
                            self.placeHolderDataSets[i].resized.emit();
                        }
                    }
                    else if (self.placeHolderDataSets[i].dataRows !== undefined) {
                        self.placeHolderDataSets[i].dataRows = undefined;
                    }
                }
            }
            if (self.firstRender) {
                self.firstRender = false;
                setTimeout(() => {
                    self.slickgrids.toArray()[0].setActive();
                });
            }
        }, self.scrollTimeOutTime);
    }
    /**
     * Sends a get request to the provided uri without changing the active page
     * @param uri The URI to send a get request to
     */
    sendGetRequest(selectionData) {
        this.dataService.setEditorSelection(selectionData);
    }
    /**
     * Sets up the resize for the messages/results panes bar
     */
    setupResizeBind() {
        const self = this;
        let $resizeHandle = $(self._el.nativeElement.querySelector('#messageResizeHandle'));
        let $messagePane = $(self._el.nativeElement.querySelector('#messages'));
        $resizeHandle.bind('dragstart', (e) => {
            self.resizing = true;
            self.resizeHandleTop = e.pageY;
            this._messagesPaneHeight = $('#messages').get(0).clientHeight;
            return true;
        });
        $resizeHandle.bind('drag', (e) => {
            self.resizeHandleTop = e.pageY;
        });
        $resizeHandle.bind('dragend', (e) => {
            self.resizing = false;
            // redefine the min size for the messages based on the final position
            $messagePane.css('min-height', $(window).height() - (e.pageY + 22));
            this.resizeResults();
        });
    }
    /**
     * Ensures the messages tab is scrolled to the bottom
     */
    scrollMessages() {
        let messagesDiv = this._el.nativeElement.querySelector('#messages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    /**
     * Makes a resultset take up the full result height if this is not already true
     * Otherwise rerenders the result sets from default
     */
    magnify(index) {
        const self = this;
        if (this.renderedDataSets.length > 1) {
            this.renderedDataSets = [this.placeHolderDataSets[index]];
        }
        else {
            this.renderedDataSets = this.placeHolderDataSets;
            this.onScroll(0);
        }
        setTimeout(() => {
            for (let grid of self.renderedDataSets) {
                grid.resized.emit();
            }
            self.slickgrids.toArray()[0].setActive();
        });
    }
    /**
     *
     */
    keyEvent(e) {
        const self = this;
        let eString = this.shortcuts.buildEventString(e);
        this.shortcuts.getEvent(eString).then((result) => {
            if (result) {
                let eventName = result;
                self.shortcutfunc[eventName]();
                e.stopImmediatePropagation();
            }
        });
    }
    /**
     * Helper to deselect messages when Ctrl + A is pressed
     * inside the grid
    */
    keyUpEvent(e) {
        let eString = this.shortcuts.buildEventString(e);
        this.shortcuts.getEvent(eString).then((result) => {
            if (result) {
                let eventName = result;
                if (eventName === 'event.selectAll') {
                    window.getSelection().empty();
                    rangy.getSelection().removeAllRanges();
                }
                e.stopImmediatePropagation();
            }
        });
    }
    /**
     * Resizes the results pane
     */
    resizeResults() {
        let scrollableHeight = $('.results.vertBox.scrollable').get(0).clientHeight;
        $('.horzBox').get(0).style.height = `${scrollableHeight - this._resultsPaneBoundary}px`;
        this.resizeGrids();
    }
    /**
     * Handles rendering and unrendering necessary resources in order to properly
     * navigate from one grid another. Should be called any time grid navigation is performed
     * @param targetIndex The index in the renderedDataSets to navigate to
     * @returns A boolean representing if the navigation was successful
     */
    navigateToGrid(targetIndex) {
        // check if the target index is valid
        if (targetIndex >= this.renderedDataSets.length || targetIndex < 0) {
            return false;
        }
        // Deselect any text since we are navigating to a new grid
        // Do this even if not switching grids, since this covers clicking on the grid after message selection
        rangy.getSelection().removeAllRanges();
        // check if you are actually trying to change navigation
        if (this.activeGrid === targetIndex) {
            return false;
        }
        this.slickgrids.toArray()[this.activeGrid].selection = false;
        this.slickgrids.toArray()[targetIndex].setActive();
        this.activeGrid = targetIndex;
        // scrolling logic
        let resultsWindow = $('#results');
        let scrollTop = resultsWindow.scrollTop();
        let scrollBottom = scrollTop + resultsWindow.height();
        let gridHeight = $(this._el.nativeElement).find('slick-grid').height();
        if (scrollBottom < gridHeight * (targetIndex + 1)) {
            scrollTop += (gridHeight * (targetIndex + 1)) - scrollBottom;
            resultsWindow.scrollTop(scrollTop);
        }
        if (scrollTop > gridHeight * targetIndex) {
            scrollTop = (gridHeight * targetIndex);
            resultsWindow.scrollTop(scrollTop);
        }
        return true;
    }
    resizeGrids() {
        const self = this;
        setTimeout(() => {
            for (let grid of self.renderedDataSets) {
                grid.resized.emit();
            }
        });
    }
};
__decorate([
    core_1.ViewChild('contextmenu'),
    __metadata("design:type", contextmenu_component_1.ContextMenu)
], AppComponent.prototype, "contextMenu", void 0);
__decorate([
    core_1.ViewChild('messagescontextmenu'),
    __metadata("design:type", messagescontextmenu_component_1.MessagesContextMenu)
], AppComponent.prototype, "messagesContextMenu", void 0);
__decorate([
    core_1.ViewChildren('slickgrid'),
    __metadata("design:type", core_1.QueryList)
], AppComponent.prototype, "slickgrids", void 0);
AppComponent = AppComponent_1 = __decorate([
    core_1.Component({
        selector: 'my-app',
        host: { '(window:keydown)': 'keyEvent($event)',
            '(window:gridnav)': 'keyEvent($event)',
            '(window:keyup)': 'keyUpEvent($event)',
            '(window:resize)': 'resizeResults()'
        },
        template: template,
        providers: [data_service_1.DataService, shortcuts_service_1.ShortcutService],
        styles: [`
    .errorMessage {
        color: var(--color-error);
    }
    .batchMessage {
        padding-left: 20px;
    }
    `]
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => data_service_1.DataService))),
    __param(1, core_1.Inject(core_1.forwardRef(() => shortcuts_service_1.ShortcutService))),
    __param(2, core_1.Inject(core_1.forwardRef(() => core_1.ElementRef))),
    __param(3, core_1.Inject(core_1.forwardRef(() => core_1.ChangeDetectorRef))),
    __metadata("design:paramtypes", [data_service_1.DataService,
        shortcuts_service_1.ShortcutService,
        core_1.ElementRef,
        core_1.ChangeDetectorRef])
], AppComponent);
exports.AppComponent = AppComponent;

//# sourceMappingURL=app.component.js.map
