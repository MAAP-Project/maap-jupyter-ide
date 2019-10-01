import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';

import '../style/index.css';
import cheControls = require("./cheControls");


function activate(app: JupyterFrontEnd, palette: ICommandPalette) {

  // HIDE
  const hide_command = 'hide_side_panel:hide';
  app.commands.addCommand(hide_command, {
    label: 'Hide Che Side Panel',
    isEnabled: () => true,
    execute: args => {
      cheControls.hideNavbar()
    }
  });
  palette.addItem({command: hide_command, category: 'Che'});

  // SHOW
  const show_command = 'hide_side_panel:show';
  app.commands.addCommand(show_command, {
    label: 'Show Che Side Panel',
    isEnabled: () => true,
    execute: args => {
      cheControls.showNavbar()
    }
  });
  palette.addItem({command: show_command, category: 'Che'});

  console.log('JupyterLab extension hide_side_panel is activated!');
};



/**
 * Initialization data for the hide_side_panel extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'hide_side_panel',
  autoStart: true,
  requires: [ICommandPalette],
  activate: activate
};

export default extension;
