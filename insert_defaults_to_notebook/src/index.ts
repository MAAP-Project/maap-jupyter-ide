import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookActions, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { ElementExt } from '@lumino/domutils';
import { INotification } from "jupyterlab_toastify";
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import '../style/index.css';

let DEFAULT_CODE = 'from maap.maap import MAAP\n' +
                     'maap = MAAP()\n\n' +
                     'import ipycmc\n' +
                     'w = ipycmc.MapCMC()\n' +
                     'w';

let api_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/environment');

request('get', valuesUrl.href).then((res: RequestResult) => {
  if (res.ok) {
    let environment = JSON.parse(res.data);
    api_server = environment['api_server'];
    DEFAULT_CODE = 'from maap.maap import MAAP\n' +
                     'maap = MAAP(maap_host=\'' + api_server + '\')\n\n' +
                     'import ipycmc\n' +
                     'w = ipycmc.MapCMC()\n' +
                     'w';
  }
}); 

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
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
            iconClass: 'jp-MaapIcon foo jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon',
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
function activateNbDefaults(app: JupyterFrontEnd) {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
    console.log("insert defaults to notebook extension activated");
};

function hidePanels() {
    const leftPanelParent = document.querySelector('.p-TabBar-content');
    const tabsPanel = leftPanelParent.querySelector('li[title="Open Tabs"]');
    console.log('leftPanelParent');
    console.log(leftPanelParent);
    console.log('tabsPanel');
    console.log(tabsPanel);
    if (tabsPanel != null){
        leftPanelParent.removeChild(tabsPanel);
    }
    console.log('removing panel!');
}

/**
 * Initialization data for the insert_defaults_to_notebook extension.
 */
const extensionNbDefaults: JupyterFrontEndPlugin<void> = {
    id: 'insert_defaults_to_notebook',
    autoStart: true,
    activate: activateNbDefaults
};

const extensionHidePanels: JupyterFrontEndPlugin<void> = {
    id: 'hide_unused_panels',
    autoStart: true,
    requires: [ICommandPalette],
    activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
        const open_command = 'defaults:removePanel';
    
        app.commands.addCommand(open_command, {
          label: 'Hide Tabs',
          isEnabled: () => true,
          execute: args => {
            hidePanels();
          }
        });
    
        palette.addItem({command:open_command,category:'User'});
        hidePanels();   // automatically call function at startup
        console.log('remove panels activated');
      }
};

export default [extensionNbDefaults, extensionHidePanels];
