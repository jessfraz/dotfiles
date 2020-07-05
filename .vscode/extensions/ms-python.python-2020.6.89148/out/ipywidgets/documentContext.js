// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
import { NotebookModel } from '@jupyterlab/notebook/lib';
import { Signal } from './signal';
// tslint:disable: no-any
export class DocumentContext {
    constructor(kernel) {
        // We are the session.
        this.kernel = kernel;
        this.pathChanged = new Signal();
        this.fileChanged = new Signal();
        this.saveState = new Signal();
        this.disposed = new Signal();
        this.session = this;
        this.terminated = new Signal();
        this.kernelChanged = new Signal();
        this.statusChanged = new Signal();
        this.iopubMessage = new Signal();
        this.unhandledMessage = new Signal();
        this.propertyChanged = new Signal();
        // Generate a dummy notebook model
        this.model = new NotebookModel();
    }
    changeKernel(_options) {
        throw new Error('Method not implemented.');
    }
    shutdown() {
        throw new Error('Method not implemented.');
    }
    selectKernel() {
        throw new Error('Method not implemented.');
    }
    restart() {
        throw new Error('Method not implemented.');
    }
    setPath(_path) {
        throw new Error('Method not implemented.');
    }
    setName(_name) {
        throw new Error('Method not implemented.');
    }
    setType(_type) {
        throw new Error('Method not implemented.');
    }
    addSibling(_widget, _options) {
        throw new Error('Method not implemented.');
    }
    save() {
        throw new Error('Method not implemented.');
    }
    saveAs() {
        throw new Error('Method not implemented.');
    }
    revert() {
        throw new Error('Method not implemented.');
    }
    createCheckpoint() {
        throw new Error('Method not implemented.');
    }
    deleteCheckpoint(_checkpointID) {
        throw new Error('Method not implemented.');
    }
    restoreCheckpoint(_checkpointID) {
        throw new Error('Method not implemented.');
    }
    listCheckpoints() {
        throw new Error('Method not implemented.');
    }
    dispose() {
        throw new Error('Method not implemented.');
    }
}
//# sourceMappingURL=documentContext.js.map