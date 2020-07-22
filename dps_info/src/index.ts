import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { JobTable } from './jobinfo';

export const jPanel_update_command = 'jobs: panel-refresh';
/**
 * Initialization data for the dps_info extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'dps_info',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    let jPanel = new JobTable('eyam');
    jPanel.id = 'job-cache-display';

    jPanel.id = 'job-cache-display';
    jPanel.title.label = 'Jobs';
    jPanel.title.caption = 'Jobs sent to DPS';
    app.shell.add(jPanel, 'left', {rank: 300});

    app.commands.addCommand(jPanel_update_command, {
      label: 'Refresh Job List',
      isEnabled: () => true,
      execute: args => {
        jPanel.update();
        console.log('update');
      }
    });

    palette.addItem({command: jPanel_update_command, category: 'DPS/MAS'});
    console.log('JupyterLab extension dps_info is activated!');
  }
};

const extensionDPSUIMenu: JupyterFrontEndPlugin<void> = {
  id: 'dps-ui-menu',
  autoStart: true,
  requires: [IMainMenu],
  activate: (app: JupyterFrontEnd, mainMenu: IMainMenu) => {
    const { commands } = app;
    let uiMenu = new Menu({ commands});
    uiMenu.id = 'dps-ui-operations';
    uiMenu.title.label = 'DPS UI Menu';
    [
      jPanel_update_command
    ].forEach(command => {
      uiMenu.addItem({ command});
    });
    mainMenu.addMenu(uiMenu, {rank: 102 });

    console.log('Added dps UI menu options');
  }
}

export default [extension,extensionDPSUIMenu];
