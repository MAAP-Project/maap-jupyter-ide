import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { ILauncher } from '@jupyterlab/launcher';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { request, RequestResult } from './request';
import { ProjectSelector } from './selector';
import { InputWidget, popupResultText } from './widgets';
import { JobCache } from './panel';
import { popup, popupResult } from "./dialogs";
import * as data from './fields.json';

const registerFields = data.register;
const deleteAlgorithmFields = data.deleteAlgorithm;
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
  palette.addItem({command: open_command, category: 'DPS/MAS'});
  console.log('HySDS Register Algorithm is activated!');
}

export function activateRegisterAlgorithm(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
): void {
  const { commands } = app;
  const { tracker } = factory;

  // matches all filebrowser items
  const selectorItem = '.jp-DirListing-item[data-isdir]';
  const open_command = 'hysds: register2';

  commands.addCommand(open_command, {
    execute: () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      const item = widget.selectedItems().next();
      if (!item) {
        return;
      }

      let path = item.path;
      console.log(path);
      // TODO
      // send request to defaultvalueshandler
      // popup read-only default values
      // ok -> call registeralgorithmhandler
      // cancel -> edit template at algorithm_config.yaml (config_path)
    },
    isVisible: () =>
      tracker.currentWidget &&
      tracker.currentWidget.selectedItems().next !== undefined,
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Register as MAS Algorithm'
  });

  app.contextMenu.addItem({
    command: open_command,
    selector: selectorItem,
    rank: 10
  });
}

export function activateGetCapabilities(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-capabilities';

  app.commands.addCommand(open_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      // var w = new InputWidget('getCapabilities',getCapabilitiesFields,username,jobsPanel,{});
      // w.getValue();
      noInputRequest('getCapabilities','Capabilities');
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
      popup(new InputWidget('getStatus',getStatusFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
      popup(new InputWidget('getResult',getResultFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
  palette.addItem({command: open_command, category: 'DPS/MAS'});
 
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
      popup(new InputWidget('dismiss',dismissFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
      popup(new InputWidget('delete',deleteFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
      // var w = new InputWidget('listAlgorithms',listAlgorithmsFields,username,jobsPanel,{});
      // w.getValue();
      noInputRequest('listAlgorithms', 'List Algorithms');
    }
  });
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
  palette.addItem({command: open_command, category: 'DPS/MAS'});
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
  palette.addItem({command: open_command, category: 'DPS/MAS'});
  jobsPanel.updateDisplay();
  console.log('HySDS JobList is activated!');
}

export function getAlgorithms() {
  return new Promise<{[k:string]:Array<string>}>((resolve, reject) => {
    var algoSet: { [key: string]: Array<string>} = {}

    // get list of projects to give dropdown menu
    var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
    console.log(settingsAPIUrl.href);
    request('get',settingsAPIUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        var algos = json_response['algo_set'];
        // console.log(json_response);
        // console.log(algos);
        algoSet = algos;
        resolve(algoSet);
      }
    });
  });
}

export function getDefaultValues(code_path) {
  return new Promise<{[k:string]:string}>((resolve, reject) => {
    var defaultValues:{[k:string]:string}  = {}

    // get list of projects to give dropdown menu
    var valuesUrl = new URL(PageConfig.getBaseUrl() + 'hysds/defaultValues');
    valuesUrl.searchParams.append('code_path', code_path);
    console.log(valuesUrl.href);
    request('get',valuesUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        var values = json_response['default_values'];
        defaultValues = values;
      resolve(defaultValues);
      } else {
        resolve({});
      }
    });
  });
}

export function inputRequest(endpt:string,title:string,inputs:{[k:string]:string},fn?:any) {
  var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + endpt);
  // add params
  for (let key in inputs) {
    var fieldValue = inputs[key].toLowerCase();
    requestUrl.searchParams.append(key.toLowerCase(), fieldValue);
  }

  // send request
  request('get',requestUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      var json_response:any = res.json();
      if (fn == undefined) {
        popupResultText(json_response['result'],jobsPanel,false,title);
      } else {
        fn(json_response);
      }
    }
  }); 
}

function noInputRequest(endpt:string,title:string) {
  inputRequest(endpt,title,{});
}
