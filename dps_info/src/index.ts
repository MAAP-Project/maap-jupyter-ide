import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { activateJobPanel, activateJobWidget } from './jobinfo';

/**
 * Initialization data for the dps_info extension.
 */
// const extension: JupyterFrontEndPlugin<void> = {
//   id: 'dps_info',
//   autoStart: true,
//   activate: (app: JupyterFrontEnd) => {
//     console.log('JupyterLab extension dps_info is activated!');
//   }
// };

// export default extension;

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

export default [cacheExtension, bigJobsPanel]