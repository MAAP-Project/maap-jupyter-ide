
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

    request('get', PageConfig.getBaseUrl() + "display_ssh_info/get").then((res: RequestResult) => {
      if(res.ok){
        let contents = document.createTextNode(JSON.stringify(res.json()));
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
function autoversion(): void {
    showDialog({
        title: 'SSH Info:',
        body: new SshWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
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
