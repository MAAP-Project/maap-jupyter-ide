import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IDisposable, DisposableDelegate } from '@phosphor/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookActions, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { ElementExt } from '@phosphor/domutils';
import { INotification } from "jupyterlab_toastify";
import '../style/index.css';

const DEFAULT_CODE = 'from maap.maap import MAAP\n' +
                     'maap = MAAP()\n\n' +
                     'import ipycmc\n' +
                     'w = ipycmc.MapCMC()\n' +
                     'w';

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

      // Select the first cell of the notebook
      panel.content.activeCellIndex = 0;
      panel.content.deselectAll();
      ElementExt.scrollIntoViewIfNeeded(
          panel.content.node,
          panel.content.activeCell.node
      );

      // Check if already there
      if (panel.content.activeCell.model.value.text == DEFAULT_CODE) {
        INotification.error("MAAP defaults already imported to notebook.");
      }
      else {
        // Insert code above selected first cell
        NotebookActions.insertAbove(panel.content);
        panel.content.activeCell.model.value.text = DEFAULT_CODE;
      }

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
function activate(app: JupyterFrontEnd) {
  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
};


/**
 * Initialization data for the insert_defaults_to_notebook extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'insert_defaults_to_notebook',
  autoStart: true,
  activate: activate
};

export default extension;
