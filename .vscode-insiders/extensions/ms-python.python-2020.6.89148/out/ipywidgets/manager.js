// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
import { shims } from '@jupyter-widgets/base';
import * as jupyterlab from '@jupyter-widgets/jupyterlab-manager';
import { RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { Widget } from '@phosphor/widgets';
import { DocumentContext } from './documentContext';
import { requireLoader } from './widgetLoader';
export const WIDGET_MIMETYPE = 'application/vnd.jupyter.widget-view+json';
// tslint:disable: no-any
// Source borrowed from https://github.com/jupyter-widgets/ipywidgets/blob/master/examples/web3/src/manager.ts
// These widgets can always be loaded from requirejs (as it is bundled).
const widgetsRegisteredInRequireJs = ['@jupyter-widgets/controls', '@jupyter-widgets/base', '@jupyter-widgets/output'];
export class WidgetManager extends jupyterlab.WidgetManager {
    constructor(kernel, el, scriptLoader) {
        super(new DocumentContext(kernel), new RenderMimeRegistry({
            initialFactories: standardRendererFactories
        }), { saveState: false });
        this.scriptLoader = scriptLoader;
        this.kernel = kernel;
        this.el = el;
        this.rendermime.addFactory({
            safe: false,
            mimeTypes: [WIDGET_MIMETYPE],
            createRenderer: (options) => new jupyterlab.WidgetRenderer(options, this)
        }, 0);
        kernel.registerCommTarget(this.comm_target_name, async (comm, msg) => {
            const oldComm = new shims.services.Comm(comm);
            return this.handle_comm_open(oldComm, msg);
        });
    }
    /**
     * Create a comm.
     */
    async _create_comm(target_name, model_id, data, metadata) {
        const comm = this.kernel.connectToComm(target_name, model_id);
        if (data || metadata) {
            comm.open(data, metadata);
        }
        return Promise.resolve(new shims.services.Comm(comm));
    }
    /**
     * Get the currently-registered comms.
     */
    _get_comm_info() {
        return this.kernel
            .requestCommInfo({ target: this.comm_target_name })
            .then((reply) => reply.content.comms);
    }
    async display_view(msg, view, options) {
        const widget = await super.display_view(msg, view, options);
        const element = options.node ? options.node : this.el;
        // When do we detach?
        if (element) {
            Widget.attach(widget, element);
        }
        return widget;
    }
    async restoreWidgets() {
        // Disabled for now.
        // This throws errors if enabled, can be added later.
    }
    get onUnhandledIOPubMessage() {
        return super.onUnhandledIOPubMessage;
    }
    async loadClass(className, moduleName, moduleVersion) {
        // Call the base class to try and load. If that fails, look locally
        window.console.log(`WidgetManager: Loading class ${className}:${moduleName}:${moduleVersion}`);
        // tslint:disable-next-line: no-unnecessary-local-variable
        const result = await super
            .loadClass(className, moduleName, moduleVersion)
            .then((r) => {
            this.sendSuccess(className, moduleName, moduleVersion);
            return r;
        })
            .catch(async (originalException) => {
            try {
                const loadModuleFromRequirejs = widgetsRegisteredInRequireJs.includes(moduleName) ||
                    this.scriptLoader.widgetsRegisteredInRequireJs.has(moduleName);
                if (!loadModuleFromRequirejs) {
                    // If not loading from requirejs, then check if we can.
                    // Notify the script loader that we need to load the widget module.
                    // If possible the loader will locate and register that in requirejs for things to start working.
                    await this.scriptLoader.loadWidgetScript(moduleName, moduleVersion);
                }
                const m = await requireLoader(moduleName);
                if (m && m[className]) {
                    this.sendSuccess(className, moduleName, moduleVersion);
                    return m[className];
                }
                throw originalException;
            }
            catch (ex) {
                this.sendError(className, moduleName, moduleVersion, originalException);
                throw originalException;
            }
        });
        return result;
    }
    sendSuccess(className, moduleName, moduleVersion) {
        try {
            this.scriptLoader.successHandler(className, moduleName, moduleVersion);
        }
        catch (_a) {
            // Don't let script loader failures cause a break
        }
    }
    sendError(className, moduleName, moduleVersion, originalException) {
        try {
            this.scriptLoader.errorHandler(className, moduleName, moduleVersion, originalException);
        }
        catch (_a) {
            // Don't let script loader failures cause a break
        }
    }
}
//# sourceMappingURL=manager.js.map