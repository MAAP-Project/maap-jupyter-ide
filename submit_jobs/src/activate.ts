import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { IStateDB } from '@jupyterlab/statedb';
import { ILauncher } from '@jupyterlab/launcher';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { InputWidget, RegisterWidget, popupText } from './widgets';
import { ProjectSelector } from './selector';
import { popup, popupResult } from './dialogs';
import { getUsernameToken, noInputRequest, inputRequest, algorithmExists } from './funcs';
import * as data from './fields.json';

const registerFields = data.register;
const describeProcessFields = data.describeProcess;
const publishAlgorithmFields = data.publishAlgorithm;
const executeInputsFields = data.executeInputs;
// const listJobsFields = data.listJobs;
const getStatusFields = data.getStatus;
const getMetricsFields = data.getMetrics;
const getResultFields = data.getResult;
const dismissFields = data.dismiss;
const deleteFields = data.delete;
const deleteAlgorithmFields = data.deleteAlgorithm;
// ------------------------------------------------------------
const capabilities_command = 'dps: get-capabilities';
const registerAlgorithm_command = 'mas: algorithm-register';
const listAlgorithm_command = 'mas: algorithm-list';
const publishAlgorithm_command = 'mas: algorithm-publish';
const describeAlgorithm_command = 'mas: algorithm-describe';
const executeJob_command = 'dps: job-execute';
const listJob_command = 'dps: job-list';
const statusJob_command = 'dps: job-status';
const metricsJob_command = 'dps: job-metrics';
const resultJob_command = 'dps: job-result';
const dismissJob_comand = 'dps: job-dismiss';
const deleteJob_command = 'dps: job-delete';
const deleteAlgorithm_command = 'mas: algorithm-delete';

const profileId = 'maapsec-extension:IMaapProfile';

export function activateRegisterAlgorithm(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  state: IStateDB,
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

      // get full path, not just relative path of script to register
      let path = PageConfig.getOption('serverRoot') + '/' + item.path;
      console.log(path);

      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        // send request to defaultvalueshandler
        let getValuesFn = function(resp:Object) {
          console.log('getValuesFn');
          if (resp['status_code'] != 200) {
            popupText(resp['reason'],resp['status_code']+" Error");
            return;
          }

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
            let w = new RegisterWidget(registerFields,uname,ticket,defaultValues,subtext,configPath);
            w.setPredefinedFields(defaultValues);
            console.log(w);
            popup(w);
          }

          // check if algorithm already exists
          // ok -> call registeralgorithmhandler
          // cancel -> edit template at algorithm_config.yaml (config_path)
          algorithmExists(defaultValues['algo_name'],defaultValues['version'],defaultValues['environment'],ticket).then((algoExists) => {
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
      });
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
  // console.log('Register Algorithm is activated');
}

export function activateGetCapabilities(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  app.commands.addCommand(capabilities_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      noInputRequest('getCapabilities','Capabilities');
    }
  });
  palette.addItem({command: capabilities_command, category: 'DPS/MAS'});
  // console.log('HySDS Get Capabilities is activated!');
}
export function activateList(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(listAlgorithm_command, {
    label: 'List Algorithms',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        inputRequest('listAlgorithms','List Algorithms',{'username':uname,'proxy-ticket':ticket});
      });
    }
  });
  palette.addItem({command: listAlgorithm_command, category: 'DPS/MAS'});
  // console.log('HySDS Describe Job is activated!');
}
export function activatePublishAlgorithm(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(publishAlgorithm_command, {
    label: 'Publish Algorithm',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popupResult(new ProjectSelector('publishAlgorithm',publishAlgorithmFields,uname,ticket),"Select an Algorithm");
      })
    }
  });
  palette.addItem({command: publishAlgorithm_command, category: 'DPS/MAS'});
  // console.log('HySDS Publish Algorithm is activated!');
}
export function activateDescribe(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(describeAlgorithm_command, {
    label: 'Describe Algorithm',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popupResult(new ProjectSelector('describeProcess',describeProcessFields,uname,ticket),"Select an Algorithm");
      });
    }
  });
  palette.addItem({command: describeAlgorithm_command, category: 'DPS/MAS'});
  // console.log('HySDS Describe Job is activated!');
}
export function activateExecute(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(executeJob_command, {
    label: 'Execute DPS Job',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popupResult(new ProjectSelector('executeInputs',executeInputsFields,uname,ticket),"Select an Algorithm");
      });
    }
  });
  palette.addItem({command: executeJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Execute Job is activated!');
}
export function activateGetJobList(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{  
  app.commands.addCommand(listJob_command, {
    label: 'Get DPS Job List',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        inputRequest('listJobs','List Submitted Jobs',{'username':uname,'proxy-ticket':ticket});
        // popup(new InputWidget('listJobs',listJobsFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: statusJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Job List is activated!');
}
export function activateGetStatus(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{  
  app.commands.addCommand(statusJob_command, {
    label: 'Get DPS Job Status',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popup(new InputWidget('getStatus',getStatusFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: statusJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Get Job Status is activated!');
}
export function activateGetMetrics(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{  
  app.commands.addCommand(metricsJob_command, {
    label: 'Get DPS Job Metrics',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popup(new InputWidget('getMetrics',getMetricsFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: metricsJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Get Job Metrics is activated!');
}
export function activateGetResult(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(resultJob_command, {
    label: 'Get DPS Job Result',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popup(new InputWidget('getResult',getResultFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: resultJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Get Job Result is activated!');
}
export function activateDismiss(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(dismissJob_comand, {
    label: 'Dismiss DPS Job',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popup(new InputWidget('dismiss',dismissFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: dismissJob_comand, category: 'DPS/MAS'});
  // console.log('HySDS Dismiss Job is activated!');
}
export function activateDelete(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(deleteJob_command, {
    label: 'Delete DPS Job',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popup(new InputWidget('delete',deleteFields,uname,ticket,{}));
      });
    }
  });
  palette.addItem({command: deleteJob_command, category: 'DPS/MAS'});
  // console.log('HySDS Delete Job is activated!');
}
export function activateDeleteAlgorithm(app: JupyterFrontEnd, 
                        palette: ICommandPalette, 
                        state: IStateDB,
                        restorer: ILauncher | null): void{
  app.commands.addCommand(deleteAlgorithm_command, {
    label: 'Delete Algorithm',
    isEnabled: () => true,
    execute: args => {
      getUsernameToken(state,profileId,function(uname:string,ticket:string) {
        popupResult(new ProjectSelector('deleteAlgorithm',deleteAlgorithmFields,uname,ticket),"Select an Algorithm to Delete");
      });
    }
  });
  palette.addItem({command: deleteAlgorithm_command, category: 'DPS/MAS'});
  // console.log('HySDS Describe Job is activated!');
}

// add DPS options to Menu dropdown
export function activateMenuOptions(app: JupyterFrontEnd, mainMenu: IMainMenu) {
  const { commands } = app;
  let dpsMenu = new Menu({ commands });
  dpsMenu.id = 'dps-mas-operations';
  dpsMenu.title.label = 'DPS/MAS Operations';
  [
    capabilities_command,
    listAlgorithm_command,
    publishAlgorithm_command,
    describeAlgorithm_command,
    executeJob_command,
    listJob_command,
    statusJob_command,
    metricsJob_command,
    resultJob_command,
    dismissJob_comand,
    deleteJob_command,
    deleteAlgorithm_command,
  ].forEach(command => {
    dpsMenu.addItem({ command });
  });
  mainMenu.addMenu(dpsMenu, { rank: 101 });

  console.log('MAAP submit jobs extension activated');
}
