"use strict";
class SelectionModel {
    constructor(_rowSelectionModel, _handler, _onSelectedRangesChanged, _slickRangeFactory) {
        this._rowSelectionModel = _rowSelectionModel;
        this._handler = _handler;
        this._onSelectedRangesChanged = _onSelectedRangesChanged;
        this._slickRangeFactory = _slickRangeFactory;
        this._ranges = [];
        this._lastSelectedColumnIndexSequence = [];
    }
    get range() {
        return this._ranges;
    }
    get onSelectedRangesChanged() {
        return this._onSelectedRangesChanged;
    }
    init(grid) {
        this._grid = grid;
        this._rowSelectionModel.init(grid);
        this._handler.subscribe(this._rowSelectionModel.onSelectedRangesChanged, (e, ranges) => {
            this.updateSelectedRanges(ranges);
        });
    }
    destroy() {
        this._handler.unsubscribeAll();
        this._rowSelectionModel.destroy();
    }
    setSelectedRanges(ranges) {
        this._rowSelectionModel.setSelectedRanges(ranges);
    }
    getSelectedRanges() {
        return this._rowSelectionModel.getSelectedRanges();
    }
    changeSelectedRanges(selections) {
        let slickRange = (selections || []).map(s => this._slickRangeFactory(s.startRow, s.startColumn, s.endRow - 1, s.endColumn - 1));
        this.updateSelectedRanges(slickRange);
    }
    toggleSingleColumnSelection(columnId) {
        let newRanges = [this.getColumnRange(columnId)];
        if (SelectionModel.areRangesIdentical(newRanges, this._ranges)) {
            this.clearSelection();
        }
        else {
            this.setSingleColumnSelection(columnId);
        }
    }
    setSingleColumnSelection(columnId) {
        this._lastSelectedColumnIndexSequence = [this._grid.getColumnIndex(columnId)];
        this._grid.resetActiveCell();
        this.updateSelectedRanges([this.getColumnRange(columnId)]);
    }
    toggleMultiColumnSelection(columnId) {
        if (this.isColumnSelectionCurrently === false) {
            return this.toggleSingleColumnSelection(columnId);
        }
        let columnIndex = this._grid.getColumnIndex(columnId);
        let columnRange = this.getColumnRangeByIndex(columnIndex);
        let columnInRange = false;
        let newRanges = this._ranges.filter((value, index) => {
            if (value.fromCell === columnRange.fromCell && value.toCell === columnRange.toCell) {
                columnInRange = true;
                return false;
            }
            return true;
        });
        this._lastSelectedColumnIndexSequence = this._lastSelectedColumnIndexSequence.filter(value => value !== columnIndex);
        if (columnInRange === false) {
            newRanges.push(columnRange);
            this._lastSelectedColumnIndexSequence.push(this._grid.getColumnIndex(columnId));
        }
        this._grid.resetActiveCell();
        this.updateSelectedRanges(newRanges);
    }
    extendMultiColumnSelection(columnId) {
        if (this.isColumnSelectionCurrently === false
            || !this._lastSelectedColumnIndexSequence
            || this._lastSelectedColumnIndexSequence.length === 0) {
            return this.toggleSingleColumnSelection(columnId);
        }
        let columnIndex = this._grid.getColumnIndex(columnId);
        let lastSelectedColumnIndex = this._lastSelectedColumnIndexSequence[this._lastSelectedColumnIndexSequence.length - 1];
        let start = Math.min(columnIndex, lastSelectedColumnIndex);
        let end = Math.max(columnIndex, lastSelectedColumnIndex);
        let newRanges = [];
        this._lastSelectedColumnIndexSequence = [];
        for (let i = start; i <= end; i++) {
            newRanges.push(this.getColumnRangeByIndex(i));
            if (i !== lastSelectedColumnIndex) {
                this._lastSelectedColumnIndexSequence.push(i);
            }
        }
        this._lastSelectedColumnIndexSequence.push(lastSelectedColumnIndex);
        this._grid.resetActiveCell();
        this.updateSelectedRanges(newRanges);
    }
    clearSelection() {
        this._lastSelectedColumnIndexSequence = [];
        this._grid.resetActiveCell();
        this._rowSelectionModel.setSelectedRanges([]);
    }
    static areRangesIdentical(lhs, rhs) {
        if (lhs && rhs && (lhs !== rhs) && lhs.length === rhs.length) {
            for (let i = 0; i < lhs.length; ++i) {
                if (lhs[i].fromRow !== rhs[i].fromRow
                    || lhs[i].toRow !== rhs[i].toRow
                    || lhs[i].fromCell !== rhs[i].fromCell
                    || lhs[i].toCell !== rhs[i].toCell) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    getColumnRange(columnId) {
        let columnIndex = this._grid.getColumnIndex(columnId);
        return this.getColumnRangeByIndex(columnIndex);
    }
    getColumnRangeByIndex(columnIndex) {
        let rowCount = this._grid.getDataLength();
        let lastRowToSelect = rowCount === 0 ? 0 : rowCount - 1;
        return this._slickRangeFactory(0, columnIndex, lastRowToSelect, columnIndex);
    }
    get isColumnSelectionCurrently() {
        return this._ranges
            && this._ranges.length > 0
            && this._ranges.find(r => {
                let startAtFirstRow = r.fromRow === 0;
                let endAtLastRow = r.toRow === Math.max(0, this._grid.getDataLength() - 1);
                return !startAtFirstRow || !endAtLastRow || r.fromCell !== r.toCell;
            }) === undefined;
    }
    updateSelectedRanges(ranges) {
        // Set focus to this grid if it's not already somewhere inside it.
        if (ranges && ranges.length !== 0 && this._grid && this._grid.getCanvasNode() && !this._grid.getCanvasNode().contains(document.activeElement)) {
            this._grid.focus();
        }
        if (SelectionModel.areRangesIdentical(ranges, this._ranges)) {
            return;
        }
        this._ranges = ranges;
        this.onSelectedRangesChanged.notify(this._ranges);
    }
}
exports.SelectionModel = SelectionModel;
