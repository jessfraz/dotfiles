"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const interfaces_1 = require('./interfaces');
class LoadCancellationToken {
}
class DataWindow {
    constructor(dataSourceLength, loadFunction, placeholderItemGenerator, loadCompleteCallback) {
        this._length = 0;
        this._offsetFromDataSource = -1;
        this._dataSourceLength = dataSourceLength;
        this.loadFunction = loadFunction;
        this.placeholderItemGenerator = placeholderItemGenerator;
        this.loadCompleteCallback = loadCompleteCallback;
    }
    getStartIndex() {
        return this._offsetFromDataSource;
    }
    getEndIndex() {
        return this._offsetFromDataSource + this._length;
    }
    contains(dataSourceIndex) {
        return dataSourceIndex >= this.getStartIndex() && dataSourceIndex < this.getEndIndex();
    }
    getItem(index) {
        if (!this._data) {
            return this.placeholderItemGenerator(index);
        }
        return this._data[index - this._offsetFromDataSource];
    }
    positionWindow(offset, length) {
        this._offsetFromDataSource = offset;
        this._length = length;
        this._data = undefined;
        if (this.lastLoadCancellationToken) {
            this.lastLoadCancellationToken.isCancelled = true;
        }
        if (length === 0) {
            return;
        }
        let cancellationToken = new LoadCancellationToken();
        this.lastLoadCancellationToken = cancellationToken;
        this.loadFunction(offset, length).then(data => {
            if (!cancellationToken.isCancelled) {
                this._data = data;
                this.loadCompleteCallback(this._offsetFromDataSource, this._offsetFromDataSource + this._length);
            }
        });
    }
}
class VirtualizedCollection {
    constructor(windowSize, length, loadFn, _placeHolderGenerator) {
        this._placeHolderGenerator = _placeHolderGenerator;
        this._windowSize = windowSize;
        this._length = length;
        let loadCompleteCallback = (start, end) => {
            if (this.collectionChangedCallback) {
                this.collectionChangedCallback(interfaces_1.CollectionChange.ItemsReplaced, start, end - start);
            }
        };
        this._bufferWindowBefore = new DataWindow(length, loadFn, _placeHolderGenerator, loadCompleteCallback);
        this._window = new DataWindow(length, loadFn, _placeHolderGenerator, loadCompleteCallback);
        this._bufferWindowAfter = new DataWindow(length, loadFn, _placeHolderGenerator, loadCompleteCallback);
    }
    setCollectionChangedCallback(callback) {
        this.collectionChangedCallback = callback;
    }
    getLength() {
        return this._length;
    }
    at(index) {
        return this.getRange(index, index + 1)[0];
    }
    getRange(start, end) {
        // current data may contain placeholders
        let currentData = this.getRangeFromCurrent(start, end);
        // only shift window and make promise of refreshed data in following condition:
        if (start < this._bufferWindowBefore.getStartIndex() || end > this._bufferWindowAfter.getEndIndex()) {
            // jump, reset
            this.resetWindowsAroundIndex(start);
        }
        else if (end <= this._bufferWindowBefore.getEndIndex()) {
            // scroll up, shift up
            let windowToRecycle = this._bufferWindowAfter;
            this._bufferWindowAfter = this._window;
            this._window = this._bufferWindowBefore;
            this._bufferWindowBefore = windowToRecycle;
            let newWindowOffset = Math.max(0, this._window.getStartIndex() - this._windowSize);
            this._bufferWindowBefore.positionWindow(newWindowOffset, this._window.getStartIndex() - newWindowOffset);
        }
        else if (start >= this._bufferWindowAfter.getStartIndex()) {
            // scroll down, shift down
            let windowToRecycle = this._bufferWindowBefore;
            this._bufferWindowBefore = this._window;
            this._window = this._bufferWindowAfter;
            this._bufferWindowAfter = windowToRecycle;
            let newWindowOffset = Math.min(this._window.getStartIndex() + this._windowSize, this._length);
            let newWindowLength = Math.min(this._length - newWindowOffset, this._windowSize);
            this._bufferWindowAfter.positionWindow(newWindowOffset, newWindowLength);
        }
        return currentData;
    }
    getRangeFromCurrent(start, end) {
        let currentData = [];
        for (let i = 0; i < end - start; i++) {
            currentData.push(this.getDataFromCurrent(start + i));
        }
        return currentData;
    }
    getDataFromCurrent(index) {
        if (this._bufferWindowBefore.contains(index)) {
            return this._bufferWindowBefore.getItem(index);
        }
        else if (this._bufferWindowAfter.contains(index)) {
            return this._bufferWindowAfter.getItem(index);
        }
        else if (this._window.contains(index)) {
            return this._window.getItem(index);
        }
        return this._placeHolderGenerator(index);
    }
    resetWindowsAroundIndex(index) {
        let bufferWindowBeforeStart = Math.max(0, index - this._windowSize * 1.5);
        let bufferWindowBeforeEnd = Math.max(0, index - this._windowSize / 2);
        this._bufferWindowBefore.positionWindow(bufferWindowBeforeStart, bufferWindowBeforeEnd - bufferWindowBeforeStart);
        let mainWindowStart = bufferWindowBeforeEnd;
        let mainWindowEnd = Math.min(mainWindowStart + this._windowSize, this._length);
        this._window.positionWindow(mainWindowStart, mainWindowEnd - mainWindowStart);
        let bufferWindowAfterStart = mainWindowEnd;
        let bufferWindowAfterEnd = Math.min(bufferWindowAfterStart + this._windowSize, this._length);
        this._bufferWindowAfter.positionWindow(bufferWindowAfterStart, bufferWindowAfterEnd - bufferWindowAfterStart);
    }
}
exports.VirtualizedCollection = VirtualizedCollection;
