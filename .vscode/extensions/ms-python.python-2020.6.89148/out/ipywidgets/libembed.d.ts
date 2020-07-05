import '@jupyter-widgets/controls/css/widgets.css';
import '@phosphor/widgets/style/index.css';
import { WidgetManager } from './manager';
/**
 * Render the inline widgets inside a DOM element.
 *
 * @param managerFactory A function that returns a new WidgetManager
 * @param element (default document.documentElement) The document element in which to process for widget state.
 */
export declare function renderWidgets(managerFactory: () => WidgetManager, element?: HTMLElement): Promise<void>;
