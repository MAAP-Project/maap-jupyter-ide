import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { Widget } from '@phosphor/widgets';
import { request, RequestResult } from './request';
import getKeycloak = require('./getKeycloak');


declare global {
    interface Window {
        _keycloak: any;
    }
}

export class InjectSSH extends Widget {
  constructor() {

    // let key = "err";
    // console.log((<any> window));
    // console.log((<any> window)._keycloak);
    // (<any> window)._keycloak.loadUserInfo().success(function(profile:any) {
    //   console.log(profile);
    //   key = profile['public_ssh_keys'];
    // }).error(function() {
    //   console.log('Failed to load profile.');
    // });
    let profile:any = getKeycloak();
    let key = "error";
    if (profile != "error") {
      key = profile['public_ssh_keys'];
    }

    // let token = Window._keycloak.token;
    // console.log(token)

    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    console.log("going to call backend in key injection");
    request('get', PageConfig.getBaseUrl() + "inject_ssh/inject_public_key", {"key": key})
        .then((res: RequestResult) => {
      if(res.ok){
        console.log("SSH Key injected")
        // let json_response:any = res.json();
        // let message = json_response['status'];
        // let contents = document.createTextNode(message);
        // body.appendChild(contents);
      }
    });
    super({ node: body });
  }
}


// export function showDialog<T>(
//   options: Partial<Dialog.IOptions<T>> = {}
// ): void {
//   let dialog = new Dialog(options);
//   dialog.launch();
//   setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
//   return;
// }
//
// export function popup(b:any): void {
//   showDialog({
//     title: 'Pull All Projects:',
//     body: b,
//     focusNodeSelector: 'input',
//     buttons: [Dialog.okButton({ label: 'Ok' })]
//   });
// }

function activate_inject(app: JupyterLab,
                  palette: ICommandPalette,
                  launcher: ILauncher | null) {

   // Add an application command
  const open_command = 'inject_ssh:inject';

  app.commands.addCommand(open_command, {
    label: 'Inject User SSH Key',
    isEnabled: () => true,
    execute: args => {
      new InjectSSH();
    }
  });

  palette.addItem({command: open_command, category: 'SSH'});
  new InjectSSH();
  console.log('JupyterLab inject ssh is activated!');
};


const inject_extension: JupyterLabPlugin<void> = {
  id: 'inject_ssh',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate_inject
};

export default [inject_extension];
