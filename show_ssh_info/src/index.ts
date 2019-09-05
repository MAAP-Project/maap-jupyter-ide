import { ICommandPalette, showDialog, Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { Widget } from '@phosphor/widgets';
import { request, RequestResult } from './request';
import { INotification } from "jupyterlab_toastify";

import { getUserInfo } from "./getKeycloak";
import '../style/index.css';

var bucket_name = 'maap-mount-dev';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'display_ssh_info',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate
};

const extensionUser: JupyterFrontEndPlugin<void> = {
  id: 'display_user_info',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    const open_command = 'sshinfo:user';

    app.commands.addCommand(open_command, {
      label: 'Display User Info',
      isEnabled: () => true,
      execute: args => {
        checkUserInfo();
      }
    });

    palette.addItem({command:open_command,category:'User'});
    console.log('display user info ext activated');

    // add as button
    // let rightAreaofTopPanel = new Widget();
    // rightAreaofTopPanel.id = 'jp-topPanel-rightArea';

    // let displayBtn = document.createElement('button');
    // displayBtn.id = 'userinfo';
    // displayBtn.className = 'btn';
    // displayBtn.innerHTML = 'Display User Info';
    // displayBtn.addEventListener('click', checkUserInfo, false);
    // rightAreaofTopPanel.node.appendChild(displayBtn);
    // app.shell.add(rightAreaofTopPanel,'top');
  }
}

const extensionMount: JupyterFrontEndPlugin<void> = {
  id: 'mount-s3-folder',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    const open_command = 'sshinfo:mount';

    app.commands.addCommand(open_command, {
      label: 'User Workspace Mount',
      isEnabled: () => true,
      execute: args => {
        mountUserFolder();
      }
    })
    palette.addItem({command:open_command,category:'User'});
    console.log('Mount ext activated');
    mountUserFolder();
  }
}

const extensionPreSigneds3Url: JupyterFrontEndPlugin<void> = {
  activate: activateGetPresignedUrl,
  id: 'share-s3-url',
  requires: [ICommandPalette, IFileBrowserFactory],
  autoStart: true
};

export
class SshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    request('get', PageConfig.getBaseUrl() + "show_ssh_info/get").then((res: RequestResult) => {
      if(res.ok){
        let json_results:any = res.json();
        let ip = json_results['ip'];
        let port = json_results['port'];
        let message = "ssh root@" + ip + " -p " + port;
        // let message = "ssh -i <path_to_your_key> root@" + ip + " -p " + port;
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }
}

export
class InstallSshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let message = "SSH has not been enabled in your workspace. In order to enable SSH navigate to your workspace admin page. Under the tab Installers, turn on SSH and EXEC and click apply. NOTE: This will restart your workspace and take a few minutes.";
    let contents = document.createTextNode(message);
    body.appendChild(contents);
    super({ node: body });
  }
}

class InjectSSH {
  constructor() {

    getUserInfo(function(profile: any) {
        console.log(profile);

        if (profile['public_ssh_keys'] === undefined) {
            INotification.error("Injecting user's SSH key failed - SSH Key undefined.");
            return;
        }
        let key = profile['public_ssh_keys'];

        let getUrl = new URL(PageConfig.getBaseUrl() + "show_ssh_info/inject_public_key");
        getUrl.searchParams.append("key", key);

        // Make call to back end
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            console.log("SSH Key injected");
        };
        xhr.open("GET", getUrl.href, true);
        xhr.send(null);
    });
    // if (profile == "error") {
    //     INotification.error("Injecting user's SSH key failed - Keycloak profile not found.");
    //     return;
    // }

  }
}

export 
class UserInfoWidget extends Widget {
  constructor(username:string,email:string,org:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let user_node = document.createTextNode('Username: '+username);
    body.appendChild(user_node);
    body.appendChild(document.createElement('br'));
    let email_node = document.createTextNode('Email: '+email);
    body.appendChild(email_node);
    body.appendChild(document.createElement('br'));
    let org_node = document.createTextNode('Organization: '+org);
    body.appendChild(org_node);
    super({node: body});
  }
}

export
function checkSSH(): void {
    //
    // Check if SSH and Exec Installers have been activated
    //
    request('get', PageConfig.getBaseUrl() + "show_ssh_info/checkInstallers")
        .then((res: RequestResult) => {
            if(res.ok){
                let json_results:any = res.json();
                let status = json_results['status'];

                //
                // If installers have been activated, show ssh info
                //
                if (status) {
                    showDialog({
                        title: 'SSH Info:',
                        body: new SshWidget(),
                        focusNodeSelector: 'input',
                        buttons: [Dialog.okButton({ label: 'Ok' })]
                    });
                }

                //
                // Otherwise, ask the user if they want to enable the installers
                //
                else {
                    showDialog({
                        title: 'SSH Info:',
                        body: new InstallSshWidget(),
                        focusNodeSelector: 'input',
                        buttons: [Dialog.okButton({ label: 'Ok' }),]
                        // buttons: [Dialog.okButton({ label: 'Activate SSH' }), Dialog.cancelButton()]
                    }).then(result => {
                        if (result.button.label === 'Activate SSH') {
                            // Make Call To Activate
                            request('get', PageConfig.getBaseUrl() + "show_ssh_info/install")
                            // Restart workspace???
                        }
                        // User does not want to activate installers
                        else {
                            return;
                        }
                    });
                }

            }
        });
}

export
function checkUserInfo(): void {
  getUserInfo(function(profile: any) {
    // console.log(profile);

    if (profile['cas:username'] === undefined) {
        INotification.error("Get user profile failed.");
        return;
    }
    let username = profile['cas:username']
    let email = profile['cas:email']
    let org = profile['organization']

    // popup info
    showDialog({
      title: 'User Information:',
      body: new UserInfoWidget(username,email,org),
      focusNodeSelector: 'input',
      buttons: [Dialog.okButton({label: 'Ok'})]
    });

  });

}

export
function mountUserFolder() : void {
  getUserInfo(function(profile: any) {
    // get username from keycloak
    if (profile['cas:username'] === undefined) {
      INotification.error("Get username failed, did not mount bucket.");
      return;
    }
    // send username to backend to create local mount point and mount s3 bucket
    let username = profile['cas:username']
    var getUrl = new URL(PageConfig.getBaseUrl() + 'show_ssh_info/mountBucket');
    getUrl.searchParams.append('username',username);
    getUrl.searchParams.append('bucket',bucket_name);
    request('get', getUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        let data:any = JSON.parse(res.data);
        if (data.status_code == 200) {
          let user_workspace = data.user_workspace;
          let user_bucket_dir = data.user_bucket_dir;
          INotification.success('Mounted user workspace '+user_workspace+' to '+user_bucket_dir);
        } else {
          INotification.error('Failed to mount user workspace to s3');
        }
      } else {
        INotification.error('Failed to mount user workspace to s3');
      }
    });
  });
}

export
function getPresignedUrl(bucket:string,key:string): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    let presignedUrl = '';

    var getUrl = new URL(PageConfig.getBaseUrl() + 'show_ssh_info/getSigneds3Url');
    getUrl.searchParams.append('bucket',bucket);
    getUrl.searchParams.append('key',key);
    request('get', getUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        let data:any = JSON.parse(res.data);
        console.log(data)
        if (data.status_code == 200) {
          presignedUrl = data.url;
          resolve(presignedUrl);
        } else if (data.status_code == 404) {
          resolve(data.message);
        } else {
          INotification.error('Failed to get presigned s3 url');
          resolve(presignedUrl);
        }
      } else {
        INotification.error('Failed to get presigned s3 url');
        resolve(presignedUrl);
      }
    });
  });
}

function activateGetPresignedUrl(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
): void {
  const { commands } = app;
  const { tracker } = factory;

  // matches all filebrowser items
  const selectorItem = '.jp-DirListing-item[data-isdir]';
  const open_command = 'sshinfo:s3url';

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
      getPresignedUrl(bucket_name,path).then((url) => {
        let display = url;
        if (url.substring(0,5) == 'https'){
          display = '<a href='+url+' target="_blank" style="border-bottom: 1px solid #0000ff; color: #0000ff;">'+url+'</a>';
        }

        let body = document.createElement('div');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';

        var textarea = document.createElement("div");
        textarea.id = 'result-text';
        textarea.style.display = 'flex';
        textarea.style.flexDirection = 'column';
        textarea.innerHTML = "<pre>"+display+"</pre>";

        body.appendChild(textarea);

        showDialog({
          title: 'Presigned Url',
          body: new Widget({node:body}),
          focusNodeSelector: 'input',
          buttons: [Dialog.okButton({label: 'Ok'})]
        });
      });
    },
    isVisible: () =>
      tracker.currentWidget &&
      tracker.currentWidget.selectedItems().next !== undefined,
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Get Presigned S3 Url'
  });

  app.contextMenu.addItem({
    command: open_command,
    selector: selectorItem,
    rank: 11
  });

  // not adding to palette, since nothing to provide path
  // if (palette) {
  //   palette.addItem({command:open_command, category: 'User'});
  // }
}

function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette) {
  new InjectSSH();
  // let widget: SshWidget;
  // Add an application command
  const open_command = 'sshinfo:open';

  app.commands.addCommand(open_command, {
    label: 'Display SSH Info',
    isEnabled: () => true,
    execute: args => {
      checkSSH();
    }
  });

  palette.addItem({command: open_command, category: 'SSH'});

  console.log('JupyterLab ssh is activated!');
};

export function popup(b:Widget,title:string): void {
  showDialog({
    title: title,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({ label : 'Cancel'})]
  });
}


export default [extension,extensionUser,extensionMount,extensionPreSigneds3Url];
export {activate as _activate};
