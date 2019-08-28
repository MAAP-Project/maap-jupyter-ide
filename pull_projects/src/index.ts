import { ICommandPalette, Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { Widget } from '@phosphor/widgets';
import { INotification } from "jupyterlab_toastify";
import { request, RequestResult } from './request';
import { getUserInfo } from "./getKeycloak";

export class ProjectsPull extends Widget {

  
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    // Get gitlab token from keycloak
    getUserInfo(function(profile: any) {
        console.log(profile);
        let gitlab_token = (typeof profile['gitlab_access_token'] !== "undefined") ? profile['gitlab_access_token'] : '';

        // Make request to pull all projects
        request('get', PageConfig.getBaseUrl() + "pull_projects/getAllProjects", {"gitlab_token": gitlab_token}).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            let message = json_response['status'];

            if (message == "project import failed") {
              INotification.error(message);
            }
            else {
              INotification.success(message);
            }

            let contents = document.createTextNode(message);
            body.appendChild(contents);
          }
        });
    });

    super({ node: body });
  }

}

export class ProjectsList extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    request('get', PageConfig.getBaseUrl() + "pull_projects/list").then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        let message = json_response['result'];
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
