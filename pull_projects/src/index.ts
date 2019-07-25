import { ICommandPalette, Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { Widget } from '@phosphor/widgets';
import { INotification } from "jupyterlab_toastify";
import { request, RequestResult } from './request';

export class ProjectsPull extends Widget {

  pull_result: string;
  
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column'

    request('get', PageConfig.getBaseUrl() + "pull_projects/getAllProjects").then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        let message = json_response['status'];
        this.pull_result = message;
	INotification.success(this.pull_result);
	let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }

  get_pull_result_message() {
    console.log("pull request message is: " + this.pull_result);
    return this.pull_result;
  }
}

export class ProjectsList extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column'

    request('get', PageConfig.getBaseUrl() + "pull_projects/list").then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        // let status_code:any = json_response['status_code'];
        let message = json_response['result'];
        // if (status_code != 200){
        //  message = toString(status_code)+" failed"
        // }
        // let message = json_response['']
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }

}

export function showDialog<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new Dialog(options);
  dialog.launch();
  setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:any, title:string): void {
  showDialog({
    title: title,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}


function activate_pull(app: JupyterFrontEnd,
                  palette: ICommandPalette,
                  launcher: ILauncher | null) {

   // Add an application command
  const open_command = 'pull_projects:pull';

  app.commands.addCommand(open_command, {
    label: 'Pull All Projects',
    isEnabled: () => true,
    execute: args => {
      new ProjectsPull();
    }
  });

  palette.addItem({command: open_command, category: 'Projects'});

  console.log('JupyterFrontEnd pull is activated!');
  new ProjectsPull();
  console.log('Autopulled projects');
};

function activate_list(app: JupyterFrontEnd,
                  palette: ICommandPalette,
                  launcher: ILauncher | null) {

   // Add an application command
  const open_command = 'pull_projects:list';

  app.commands.addCommand(open_command, {
    label: 'List All Projects',
    isEnabled: () => true,
    execute: args => {
      popup(new ProjectsList(), "List All Projects");
    }
  });

  palette.addItem({command: open_command, category: 'Projects'});

  console.log('JupyterFrontEnd list is activated!');
};

const pull_extension: JupyterFrontEndPlugin<void> = {
  id: 'pull_projects',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate_pull
};

const get_extension: JupyterFrontEndPlugin<void> = {
  id: 'list_projects',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate_list
};

export default [pull_extension,get_extension];
