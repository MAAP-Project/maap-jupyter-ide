
import {
  ICommandPalette, showDialog, Dialog
} from '@jupyterlab/apputils';

import {
  PageConfig
} from '@jupyterlab/coreutils'


import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  ILauncher
} from '@jupyterlab/launcher';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  Widget
} from '@phosphor/widgets';

import {
  request, RequestResult
} from './request';

import '../style/index.css';

const extension: JupyterLabPlugin<void> = {
  id: 'display_ssh_info',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, IFileBrowserFactory],
  optional: [ILauncher],
  activate: activate
};


export
class SshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    // let type = document.createElement('select');

    request('get', PageConfig.getBaseUrl() + "show_ssh_info/get").then((res: RequestResult) => {
      if(res.ok){
        let json_results:any = res.json();
        let ip = json_results['ip'];
        let port = json_results['port'];
        let message = "ssh -i <path_to_your_key> root@" + ip + " -p " + port;
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    // type.style.marginBottom = '15px';
    // type.style.minHeight = '25px';
    // body.appendChild(type);

    super({ node: body });
  }

}

export
class InputKeyWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    let textarea = document.createElement("TEXTAREA");
    textarea.id = 'public-key-text';
    console.log((<HTMLTextAreaElement>textarea).value)
    body.appendChild(textarea)

    // let type = document.createElement('select');

    // type.style.marginBottom = '15px';
    // type.style.minHeight = '25px';
    // body.appendChild(type);

    super({ node: body });
  }

}

export
function autoversion(): void {
    showDialog({
        title: 'SSH Info:',
        body: new SshWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Upload Public Key' }), Dialog.okButton({ label: 'Ok' })]
    }).then(result => {
        if (result.button.label === 'Upload Public Key') {

            showDialog({
                title: 'Upload Public Key:',
                body: new InputKeyWidget(),
                focusNodeSelector: 'input',
                buttons: [Dialog.okButton({ label: 'Ok' })]
            }).then(result => {
                console.log(result.value)
                console.log("take in input here");
                let test = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDOBk5VU/BPAwsQjBnoMFGRptPR0vB1A2nWgc9Fz0BbgCRYFwdhPJM2IgiV4xmj6On3wcvr+RQ7i64gBCNM2UxZiGeX9b/bVfoMLJMQBCHAW/UH9Oxssa0wBHoCfhVrl3LoC+Esy3hSU05g95VwFMxxqN6tF20JpA6lDCYJtTrpCodlDVVt5ESl/BQcYy6YqSV8INITiLB9aN/SU/Ns9FxIoTu7o/pZrcOZVZfNVLAwkCwNmika05vJJCpCMe/f4PK81QN/WNJZAVbMq7HISg6SNxaz5uFX9Umhpgnb9RXYSUImS08/JTnk+Z3JpD1Q3V9jUs3PLhimzkrqcVgk0Rhn"
                request('get', PageConfig.getBaseUrl() + "show_ssh_info/addKey", {'public_key': test})
                    .then((res: RequestResult) => {
                        if (res.ok) {
                            console.log("added the key!")
                        }
                    });
            });
        }
    });

}



function activate(app: JupyterLab,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  browser: IFileBrowserFactory,
                  launcher: ILauncher | null) {


  // let widget: SshWidget;

   // Add an application command
  const open_command = 'sshinfo:open';

  app.commands.addCommand(open_command, {
    label: 'Display SSH Info',
    isEnabled: () => true,
    execute: args => {
      autoversion();
    }
  });

  palette.addItem({command: open_command, category: 'SSH'});

  console.log('JupyterLab ssh is activated!');
};


export default extension;
export {activate as _activate};
