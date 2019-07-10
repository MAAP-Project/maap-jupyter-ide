// Copyright (c) Flynn Platt
// Distributed under the terms of the Modified BSD License.

import { Application, IPlugin } from '@phosphor/application';

import { Widget } from '@phosphor/widgets';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import { INotebookTracker } from '@jupyterlab/notebook';

import * as widgetExports from './widget';

import { MODULE_NAME, MODULE_VERSION } from './version';

const EXTENSION_ID = 'ipycmc:plugin';

/**
 * The example plugin.
 */
const ipycmcPlugin: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry, INotebookTracker],
    activate: activateWidgetExtension,
    autoStart: true,
};

export default ipycmcPlugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
    app: Application<Widget>,
    registry: IJupyterWidgetRegistry,
    notebooks: INotebookTracker,
): void {
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: widgetExports,
    });

    // Use a very hacky hack to attach the notebook tracker somewhere the widget can see
    if (notebooks) {
        notebooks.currentChanged.connect(() => {
            // @ts-ignore: object may be null and `_tracker` doesn't exist
            notebooks.currentWidget.context._tracker = notebooks;
            // @ts-ignore: `_app` doesn't exist
            notebooks.currentWidget.context._app = app;
        });
    }
}
