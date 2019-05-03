import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
// import { Widget } from '@phosphor/widgets';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { JobCache, HySDSWidget, popup, popupResult } from './hysds';
import { ProjectSelector } from './subwidgets';
// import { INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
// import * as $ from "jquery";
// import { format } from "xml-formatter";
import * as data from './fields.json';

const registerFields = data.register;
const registerAutoFields = data.registerAuto;
const deleteAlgorithmFields = data.deleteAlgorithm;
const getCapabilitiesFields = data.getCapabilities;
const listAlgorithmsFields = data.listAlgorithms;
const executeInputsFields = data.executeInputs;
// const executeFields = data.execute;
const getStatusFields = data.getStatus;
const getResultFields = data.getResult;
const dismissFields = data.dismiss;
const describeProcessFields = data.describeProcess;
// const resultFields: string[] = ['status_code', 'result'];

// I really don't like this hack
const jobsPanel = new JobCache();

function activateRegister(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: register';

  app.commands.addCommand(open_command, {
    label: 'Register Algorithm',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector(false,registerFields,jobsPanel),"Select a Project");
      // popup(new HySDSWidget('register',registerFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Register Algorithm is activated!');
}
function activateGetCapabilities(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-capabilities';

  app.commands.addCommand(open_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getCapabilities',getCapabilitiesFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Capabilities is activated!');
}
function activateGetStatus(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{  
  const open_command = 'hysds: get-status';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Status',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getStatus',getStatusFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Status is activated!');
}
function activateGetResult(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-result';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Result',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getResult',getResultFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Result is activated!');
}
function activateExecute(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: execute-job';

  app.commands.addCommand(open_command, {
    label: 'Execute DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('executeInputs',executeInputsFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
 
  console.log('HySDS Execute Job is activated!');
}
function activateDismiss(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: dismiss-job';

  app.commands.addCommand(open_command, {
    label: 'Dismiss DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('dismiss',dismissFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Dismiss Job is activated!');
}
function activateDescribe(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: describe-job';

  app.commands.addCommand(open_command, {
    label: 'Describe Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('describeProcess',describeProcessFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}
function activateList(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: list-algorithms';

  app.commands.addCommand(open_command, {
    label: 'List Algorithms',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('listAlgorithms',listAlgorithmsFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}
function activateDelete(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: delete-algorithm';

  app.commands.addCommand(open_command, {
    label: 'Delete Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('deleteAlgorithm',deleteAlgorithmFields,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}
function activateRegisterAuto(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: register-auto';

  app.commands.addCommand(open_command, {
    label: 'Register Algorithm Automatically',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector(true,registerAutoFields,jobsPanel),"Select a Project");
      // popupResult(new HySDSWidget('registerAuto',registerAutoFields,jobsPanel);
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Register Algorithm is activated!');
}

function activateJobCache(app: JupyterLab): void{

  var infoPanel = jobsPanel;
  infoPanel.id = 'job-cache-display';
  infoPanel.title.label = 'Submitted Jobs';
  infoPanel.title.caption = 'jobs sent to DPS';

  app.shell.addToLeftArea(infoPanel, {rank:300});
}

// export extensions
const extensionRegisterAuto: JupyterLabPlugin<void> = {
  id: 'dps-register-auto',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateRegisterAuto
};
const extensionRegister: JupyterLabPlugin<void> = {
  id: 'dps-register',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateRegister
};
const extensionCapabilities: JupyterLabPlugin<void> = {
  id: 'dps-capabilities',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetCapabilities
};
const extensionStatus: JupyterLabPlugin<void> = {
  id: 'dps-job-status',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetStatus
};
const extensionResult: JupyterLabPlugin<void> = {
  id: 'dps-job-result',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetResult
};
const extensionExecute: JupyterLabPlugin<void> = {
  id: 'dps-job-execute',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateExecute
};
const extensionDismiss: JupyterLabPlugin<void> = {
  id: 'dps-job-dismiss',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDismiss
};
const extensionDescribe: JupyterLabPlugin<void> = {
  id: 'dps-job-describe',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDescribe
};
const extensionList: JupyterLabPlugin<void> = {
  id: 'dps-job-list',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateList
};
const extensionDelete: JupyterLabPlugin<void> = {
  id: 'dps-algo-delete',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDelete
};

const extensionJobCache: JupyterLabPlugin<void> = {
  requires: [],
  id: 'job-cache-panel',
  autoStart:true,
  activate: activateJobCache
};

export default [extensionDelete,extensionRegisterAuto,extensionRegister,extensionCapabilities,extensionStatus,extensionResult,extensionExecute,extensionDismiss,extensionDescribe,extensionList,extensionJobCache];
