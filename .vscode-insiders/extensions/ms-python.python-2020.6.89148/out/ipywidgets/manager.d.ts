import { shims } from '@jupyter-widgets/base';
import * as jupyterlab from '@jupyter-widgets/jupyterlab-manager';
import { Kernel } from '@jupyterlab/services';
import { Widget } from '@phosphor/widgets';
export declare const WIDGET_MIMETYPE = "application/vnd.jupyter.widget-view+json";
export declare class WidgetManager extends jupyterlab.WidgetManager {
    private readonly scriptLoader;
    kernel: Kernel.IKernelConnection;
    el: HTMLElement;
    constructor(kernel: Kernel.IKernelConnection, el: HTMLElement, scriptLoader: {
        readonly widgetsRegisteredInRequireJs: Readonly<Set<string>>;
        errorHandler(className: string, moduleName: string, moduleVersion: string, error: any): void;
        loadWidgetScript(moduleName: string, moduleVersion: string): Promise<void>;
        successHandler(className: string, moduleName: string, moduleVersion: string): void;
    });
    /**
     * Create a comm.
     */
    _create_comm(target_name: string, model_id: string, data?: any, metadata?: any): Promise<shims.services.Comm>;
    /**
     * Get the currently-registered comms.
     */
    _get_comm_info(): Promise<any>;
    display_view(msg: any, view: Backbone.View<Backbone.Model>, options: any): Promise<Widget>;
    restoreWidgets(): Promise<void>;
    get onUnhandledIOPubMessage(): import("@phosphor/signaling").ISignal<this, import("@jupyterlab/services").KernelMessage.IIOPubMessage<import("@jupyterlab/services").KernelMessage.IOPubMessageType>>;
    protected loadClass(className: string, moduleName: string, moduleVersion: string): Promise<any>;
    private sendSuccess;
    private sendError;
}
