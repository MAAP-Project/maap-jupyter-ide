// Copyright (c) Flynn Platt
// Distributed under the terms of the Modified BSD License.

import { Application, IPlugin } from '@lumino/application';

import { Widget } from '@lumino/widgets';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';

import * as widgetExports from './widget';

import { MODULE_NAME, MODULE_VERSION } from './version';

const EXTENSION_ID = 'ipycmc:plugin';

/**
 * The example plugin.
 */
const examplePlugin: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry, INotebookTracker],
    activate: activateWidgetExtension,
    autoStart: true
};

export default examplePlugin;

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


    const appendCellWithContent = (content: string) => {
        if(notebooks) {
            const current = notebooks.currentWidget;
            if (current) {
                // @ts-ignore: activateById doesn't exist in app.shell
                app.shell.activateById(current.id);
                NotebookActions.insertBelow(current.content);
                NotebookActions.paste(current.content);
                current.content.mode = 'edit';
                // @ts-ignore: could be null
                current.content.activeCell.model.value.text = content;
            }
        }
    };

    // Use a very hacky hack to attach the notebook tracker somewhere the widget can see
    if (notebooks) {
        notebooks.currentChanged.connect(() => {
            // @ts-ignore: missing keys
            const context = notebooks.currentWidget.context;
            // @ts-ignore: missing keys
            if(!context._appendCellWithContent) {
            // @ts-ignore: missing keys
                context._appendCellWithContent = appendCellWithContent;
            }
        });
    }
}
