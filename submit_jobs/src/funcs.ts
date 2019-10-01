import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ProjectSelector } from './register';
import { HySDSWidget } from './widgets';
import { JobCache } from './panel';
import { popup, popupResult } from "./dialogs";
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
var username:string;
// reference to jobsPanel passed through each submit_job widget
const jobsPanel = new JobCache();
// ------------------------------------------------------------

export function activateRegister(app: JupyterFrontEnd, 
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
export function activateGetCapabilities(app: JupyterFrontEnd, 
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
export function activateGetStatus(app: JupyterFrontEnd, 
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
export function activateGetResult(app: JupyterFrontEnd, 
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
export function activateExecute(app: JupyterFrontEnd, 
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
export function activateDismiss(app: JupyterFrontEnd, 
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
export function activateDelete(app: JupyterFrontEnd, 
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
export function activateDescribe(app: JupyterFrontEnd, 
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
export function activateList(app: JupyterFrontEnd, 
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
export function activateDeleteAlgorithm(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: delete-algorithm';

  app.commands.addCommand(open_command, {
    label: 'Delete Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new ProjectSelector('deleteAlgorithm',deleteAlgorithmFields,username,jobsPanel));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}

export function activateJobCache(app: JupyterFrontEnd, palette: ICommandPalette): void{
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