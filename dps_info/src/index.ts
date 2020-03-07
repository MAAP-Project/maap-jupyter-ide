import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { activateJobPanel, activateJobWidget, activateMenuOptions } from './activate';

/**
 * Initialization data for the dps_info extension.
 */
const cacheExtension: JupyterFrontEndPlugin<void> = {
  id: 'job-cache-panel',
  autoStart:true,
  requires: [ICommandPalette,IMainMenu],
  activate: activateJobPanel
};

const bigJobsPanel: JupyterFrontEndPlugin<void> = {
  id: 'jobs-widget',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu],
  activate: activateJobWidget
};

const DPSMASinterface: JupyterFrontEndPlugin<void> = {
  id: 'dps-mas-interface',
  autoStart: true,
  requires: [IMainMenu],
  activate: activateMenuOptions
};

export default [cacheExtension, bigJobsPanel, DPSMASinterface]