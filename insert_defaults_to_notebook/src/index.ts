import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';


import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  NotebookActions, NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

import {
    ElementExt
} from '@phosphor/domutils';

import '../style/index.css';



/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export
class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    let callback = () => {


      panel.content.activeCellIndex = 0;
      panel.content.deselectAll();
      ElementExt.scrollIntoViewIfNeeded(
          panel.content.node,
          panel.content.activeCell.node
      );

      let default_code = 'from maap.maap import MAAP\n' +
                         'maap = MAAP()\n\n' +
                         'import ipycmc\n' +
                         'w = ipycmc.MapCMC()';

      NotebookActions.insertAbove(panel.content);
      panel.content.activeCell.model.value.text = default_code;
    };
    let button = new ToolbarButton({
      className: 'myButton',
      iconClassName: 'jp-MaapIcon foo jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon',
      onClick: callback,
      tooltip: 'Import MAAP Libraries'
    });

    panel.toolbar.insertItem(0,'insertDefaults', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

/**
 * Activate the extension.
 */
function activate(app: JupyterLab) {
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
};


/**
 * Initialization data for the insert_defaults_to_notebook extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'insert_defaults_to_notebook',
  autoStart: true,
  activate: activate
};

export default extension;
