import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
// import { INotification } from "jupyterlab_toastify";
// import { getUserInfo } from "./getKeycloak";
import { JobCache, HySDSWidget, popup, popupResult } from './hysds';
import { ProjectSelector } from './register';
// import * as $ from "jquery";
// import { format } from "xml-formatter";
import * as data from './fields.json';

const registerFields = data.register;
const deleteAlgorithmFields = data.deleteAlgorithm;
const getCapabilitiesFields = data.getCapabilities;
const listAlgorithmsFields = data.listAlgorithms;
const executeInputsFields = data.executeInputs;
const getStatusFields = data.getStatus;
const getResultFields = data.getResult;
const dismissFields = data.dismiss;
const deleteFields = data.delete;
const describeProcessFields = data.describeProcess;

// I really don't like these hacks
// ------------------------------------------------------------
// reference to jobsPanel passed through each submit_job widget
const jobsPanel = new JobCache();
// ------------------------------------------------------------

function activateRegister(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: register';

  app.commands.addCommand(open_command, {
    label: 'Register Algorithm',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('register',registerFields,username,jobsPanel),"Select a Project");
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Register Algorithm is activated!');
}
function activateGetCapabilities(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-capabilities';

  app.commands.addCommand(open_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      var w = new HySDSWidget('getCapabilities',getCapabilitiesFields,username,jobsPanel,{});
      w.getValue();
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Capabilities is activated!');
}
function activateGetStatus(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{  
  const open_command = 'hysds: get-status';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Status',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getStatus',getStatusFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Status is activated!');
}
function activateGetResult(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-result';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Result',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getResult',getResultFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Result is activated!');
}
function activateExecute(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: execute-job';

  app.commands.addCommand(open_command, {
    label: 'Execute DPS Job',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('executeInputs',executeInputsFields,username,jobsPanel),"Select an Algorithm");
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
 
  console.log('HySDS Execute Job is activated!');
}
function activateDismiss(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: dismiss-job';

  app.commands.addCommand(open_command, {
    label: 'Dismiss DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('dismiss',dismissFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Dismiss Job is activated!');
}
function activateDelete(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: delete-job';

  app.commands.addCommand(open_command, {
    label: 'Delete DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('delete',deleteFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Delete Job is activated!');
}
function activateDescribe(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: describe-job';

  app.commands.addCommand(open_command, {
    label: 'Describe Algorithm',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('describeProcess',describeProcessFields,username,jobsPanel),"Select an Algorithm");
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}
function activateList(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: list-algorithms';

  app.commands.addCommand(open_command, {
    label: 'List Algorithms',
    isEnabled: () => true,
    execute: args => {
      var w = new HySDSWidget('listAlgorithms',listAlgorithmsFields,username,jobsPanel,{});
      w.getValue();
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}
function activateDeleteAlgorithm(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: delete-algorithm';

  app.commands.addCommand(open_command, {
    label: 'Delete Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('deleteAlgorithm',deleteAlgorithmFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}

function activateJobCache(app: JupyterFrontEnd,
                          palette: ICommandPalette): void{

  var infoPanel = jobsPanel;
  infoPanel.id = 'job-cache-display';
  infoPanel.title.label = 'Jobs';
  infoPanel.title.caption = 'jobs sent to DPS';

  // app.shell.addToLeftArea(infoPanel, {rank:300});
  app.shell.add(infoPanel, 'left', {rank: 300});

  const open_command = 'jobs: list';

  app.commands.addCommand(open_command, {
    label: 'Refresh Job List',
    isEnabled: () => true,
    execute: args => {
      jobsPanel.updateDisplay();
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  jobsPanel.updateDisplay();
  console.log('HySDS JobList is activated!');
}

const extensionRegister: JupyterFrontEndPlugin<void> = {
  id: 'dps-register',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateRegister
};
const extensionCapabilities: JupyterFrontEndPlugin<void> = {
  id: 'dps-capabilities',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetCapabilities
};
const extensionStatus: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-status',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetStatus
};
const extensionResult: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-result',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetResult
};
const extensionExecute: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-execute',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateExecute
};
const extensionDismiss: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-dismiss',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDismiss
};
const extensionDelete: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-delete',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDelete
};
const extensionDescribe: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-describe',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDescribe
};
const extensionList: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-list',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateList
};
const extensionDeleteAlgorithm: JupyterFrontEndPlugin<void> = {
  id: 'dps-algo-delete',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDeleteAlgorithm
};

const cacheExtension: JupyterFrontEndPlugin<void> = {
  id: 'job-cache-panel',
  autoStart:true,
  requires: [ICommandPalette],
  activate: activateJobCache
};

export default [extensionDeleteAlgorithm,extensionRegister,extensionCapabilities,extensionStatus,extensionResult,extensionExecute,extensionDismiss,extensionDelete,extensionDescribe,extensionList, cacheExtension];
