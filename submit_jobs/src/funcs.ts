import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { ILauncher } from '@jupyterlab/launcher';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@phosphor/widgets';
import { request, RequestResult } from './request';
import { ProjectSelector } from './selector';
import { InputWidget, RegisterWidget, popupResultText, popupText } from './widgets';
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
const registerAlgorithm2_command = 'hysds: register';
const registerAlgorithm_command = 'hysds: register2';
const capabilities_command = 'hysds: get-capabilities';
const statusJob_command = 'hysds: get-status';
const resultJob_command = 'hysds: get-result';
const executeJob_command = 'hysds: execute-job';
const dismissJob_comand = 'hysds: dismiss-job';
const deleteJob_command = 'hysds: delete-job';
const describeAlgorithm_command = 'hysds: describe-job';
const listAlgorithm_command = 'hysds: list-algorithms';
const deleteAlgorithm_command = 'hysds: delete-algorithm';
const jobCache_update_command = 'jobs: list';

export function activateRegister(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(registerAlgorithm2_command, {
    label: 'Register Algorithm',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('register',registerFields,username,jobsPanel),"Select a Project");
    }
  });
  palette.addItem({command: registerAlgorithm2_command, category: 'DPS/MAS'});
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

  commands.addCommand(registerAlgorithm_command, {
    execute: () => {

      // get filebrowser item
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
      
      // send request to defaultvalueshandler
      let getValuesFn = function(resp:Object) {
        console.log('getValuesFn');
        let configPath = resp['config_path'] as string;
        let defaultValues = resp['default_values'] as Object;
        let prevConfig = resp['previous_config'] as boolean;

        if (defaultValues['inputs'] == undefined) {
          defaultValues['inputs'] = [];
        }
        if (defaultValues['description'] == undefined) {
          defaultValues['description'] = '';
        }

        console.log(defaultValues);

        let subtext = 'Auto-generated algorithm configuration:';
        if (prevConfig) {
          subtext = 'Current algorithm configuration:';
        }

        // register function to be called
        // popup read-only default values
        let registerfn = function() {
          console.log('registerfn testing');
          let w = new RegisterWidget(registerFields,username,jobsPanel,defaultValues,subtext,configPath);
          w.setPredefinedFields(defaultValues);
          console.log(w);
          popup(w);
        }

        // check if algorithm already exists
        // ok -> call registeralgorithmhandler
        // cancel -> edit template at algorithm_config.yaml (config_path)
        algorithmExists(defaultValues['algo_name'],defaultValues['version'],defaultValues['environment']).then((algoExists) => {
          console.log('algo Exists');
          console.log(algoExists);
          if (algoExists != undefined && algoExists) {
            popupText('WARNING Algorithm name and version already exists.  \n If you continue, the previously registered algorithm \nwill be LOST','Overwrite Algorithm?',registerfn);
            // ask user if they want to continue
          } else {
            registerfn()
          }
        });
      };
      inputRequest('defaultValues','Register Algorithm',{'code_path':path},getValuesFn);
    },
    isVisible: () =>
      tracker.currentWidget &&
      tracker.currentWidget.selectedItems().next !== undefined,
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Register as MAS Algorithm'
  });

  app.contextMenu.addItem({
    command: registerAlgorithm_command,
    selector: selectorItem,
    rank: 10
  });
}

export function activateGetCapabilities(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(capabilities_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      // var w = new InputWidget('getCapabilities',getCapabilitiesFields,username,jobsPanel,{});
      // w.getValue();
      noInputRequest('getCapabilities','Capabilities');
    }
  });
  palette.addItem({command: capabilities_command, category: 'DPS/MAS'});
  console.log('HySDS Get Capabilities is activated!');
}
export function activateGetStatus(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{  
  app.commands.addCommand(statusJob_command, {
    label: 'Get DPS Job Status',
    isEnabled: () => true,
    execute: args => {
      popup(new InputWidget('getStatus',getStatusFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: statusJob_command, category: 'DPS/MAS'});
  console.log('HySDS Get Job Status is activated!');
}
export function activateGetResult(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(resultJob_command, {
    label: 'Get DPS Job Result',
    isEnabled: () => true,
    execute: args => {
      popup(new InputWidget('getResult',getResultFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: resultJob_command, category: 'DPS/MAS'});
  console.log('HySDS Get Job Result is activated!');
}
export function activateExecute(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(executeJob_command, {
    label: 'Execute DPS Job',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('executeInputs',executeInputsFields,username,jobsPanel),"Select an Algorithm");
    }
  });
  palette.addItem({command: executeJob_command, category: 'DPS/MAS'});
 
  console.log('HySDS Execute Job is activated!');
}
export function activateDismiss(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(dismissJob_comand, {
    label: 'Dismiss DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new InputWidget('dismiss',dismissFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: dismissJob_comand, category: 'DPS/MAS'});
  console.log('HySDS Dismiss Job is activated!');
}
export function activateDelete(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(deleteJob_command, {
    label: 'Delete DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new InputWidget('delete',deleteFields,username,jobsPanel,{}));
    }
  });
  palette.addItem({command: deleteJob_command, category: 'DPS/MAS'});
  console.log('HySDS Delete Job is activated!');
}
export function activateDescribe(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(describeAlgorithm_command, {
    label: 'Describe Algorithm',
    isEnabled: () => true,
    execute: args => {
      popupResult(new ProjectSelector('describeProcess',describeProcessFields,username,jobsPanel),"Select an Algorithm");
    }
  });
  palette.addItem({command: describeAlgorithm_command, category: 'DPS/MAS'});
  console.log('HySDS Describe Job is activated!');
}
export function activateList(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(listAlgorithm_command, {
    label: 'List Algorithms',
    isEnabled: () => true,
    execute: args => {
      // var w = new InputWidget('listAlgorithms',listAlgorithmsFields,username,jobsPanel,{});
      // w.getValue();
      noInputRequest('listAlgorithms', 'List Algorithms');
    }
  });
  palette.addItem({command: listAlgorithm_command, category: 'DPS/MAS'});
  console.log('HySDS Describe Job is activated!');
}
export function activateDeleteAlgorithm(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(deleteAlgorithm_command, {
    label: 'Delete Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new ProjectSelector('deleteAlgorithm',deleteAlgorithmFields,username,jobsPanel));
    }
  });
  palette.addItem({command: deleteAlgorithm_command, category: 'DPS/MAS'});
  console.log('HySDS Describe Job is activated!');
}

export function activateJobCache(app: JupyterFrontEnd, palette: ICommandPalette, mainMenu: IMainMenu): void{
  var infoPanel = jobsPanel;
  infoPanel.id = 'job-cache-display';
  infoPanel.title.label = 'Jobs';
  infoPanel.title.caption = 'jobs sent to DPS';

  // app.shell.addToLeftArea(infoPanel, {rank:300});
  app.shell.add(infoPanel, 'left', {rank: 300});

  app.commands.addCommand(jobCache_update_command, {
    label: 'Refresh Job List',
    isEnabled: () => true,
    execute: args => {
      jobsPanel.update();
    }
  });
  palette.addItem({command: jobCache_update_command, category: 'DPS/MAS'});
  // jobsPanel.updateDisplay();
  console.log('HySDS JobList is activated!');

  activateMenuOptions(app,mainMenu);
}

function activateMenuOptions(app: JupyterFrontEnd, mainMenu: IMainMenu) {
  const { commands } = app;
  let dpsMenu = new Menu({ commands });
  dpsMenu.title.label = 'DPS/MAS Operations';
  [
    jobCache_update_command,
    capabilities_command,
    listAlgorithm_command,
    registerAlgorithm2_command,
    registerAlgorithm_command,
    describeAlgorithm_command,
    executeJob_command,
    statusJob_command,
    resultJob_command,
    dismissJob_comand,
    deleteJob_command,
    deleteAlgorithm_command,
  ].forEach(command => {
    dpsMenu.addItem({ command });
  });
  mainMenu.addMenu(dpsMenu, { rank: 101 });
}

//***************** End Activate *********************//

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

// HySDS endpoints that require inputs
export function inputRequest(endpt:string,title:string,inputs:{[k:string]:string},fn?:any) {
  var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + endpt);
  // add params
  for (let key in inputs) {
    var fieldValue = inputs[key].toLowerCase();
    requestUrl.searchParams.append(key.toLowerCase(), fieldValue);
  }
  console.log(requestUrl.href);

  // send request
  request('get',requestUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      var json_response:any = res.json();
      // console.log(json_response['result']);
      // console.log(fn);
      if (fn == undefined) {
        console.log('fn undefined');
        popupResultText(json_response['result'],jobsPanel,false,title);
      } else {
        console.log('fn defined');
        fn(json_response);
      }
    }
  }); 
}

// HySDS endpoints that don't require any inputs
function noInputRequest(endpt:string,title:string) {
  inputRequest(endpt,title,{});
}

function algorithmExists(name:string, ver:string, env:string) {
  var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + 'describeProcess');
  // add params
  requestUrl.searchParams.append('algo_name', name+'_'+env);
  requestUrl.searchParams.append('version', ver);
  console.log(requestUrl.href);

  // send request
  return request('get',requestUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      var json_response:any = res.json();
      console.log(json_response);
      if (json_response.status == 200) {
        return true;
      } else {
        return false;
      }
    } else {
      console.log('describeProcess not ok');
      return false;
    }
  }); 
}