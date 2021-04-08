import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';

import { checkUserInfo, checkSSH, activateGetPresignedUrl } from './funcs'
import { InjectSSH } from './widgets'
import { updateKeycloakToken } from "./getKeycloak";
import '../style/index.css';

///////////////////////////////////////////////////////////////
//
// Display/inject ssh info extension
//
///////////////////////////////////////////////////////////////
const extensionSsh: JupyterFrontEndPlugin<void> = {
  id: 'display_ssh_info',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateSSH
};

function activateSSH(app: JupyterFrontEnd,
  palette: ICommandPalette) {

      new InjectSSH();

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



///////////////////////////////////////////////////////////////
//
// Display user info extension
//
///////////////////////////////////////////////////////////////
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
  }
};


///////////////////////////////////////////////////////////////
//
// Presigned URL extension
//
///////////////////////////////////////////////////////////////
const extensionPreSigneds3Url: JupyterFrontEndPlugin<void> = {
  id: 'share-s3-url',
  requires: [ICommandPalette, IFileBrowserFactory, IStateDB],
  autoStart: true,
  activate: activateGetPresignedUrl
};



///////////////////////////////////////////////////////////////
//
// Refresh token extension
//
// This plugin refreshes the users keycloak token on set time interval
// to extend the time a user can functionally use a workspace before
// having to manually refresh the page
//
///////////////////////////////////////////////////////////////
const extensionRefreshToken: JupyterFrontEndPlugin<void> = {
  id: 'refresh_token',
  autoStart: true,
  requires: [],
  optional: [],
  activate: () => {

    // Refresh just under every 5 min, make token last for 5 min
    setInterval(() => updateKeycloakToken(300), 299000);
  }
};

export default [extensionSsh, extensionUser, extensionPreSigneds3Url, extensionRefreshToken];
