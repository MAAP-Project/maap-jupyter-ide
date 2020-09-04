import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';

import { checkUserInfo, mountUserFolder, checkSSH, activateGetPresignedUrl, mountOrgFolders} from './funcs'
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
  requires: [ICommandPalette, IStateDB],
  optional: [ILauncher],
  activate: activateSSH
};

function activateSSH(app: JupyterFrontEnd,
  state: IStateDB,
  palette: ICommandPalette) {

      new InjectSSH();

      // Add an application command
      const open_command = 'sshinfo:open';

      app.commands.addCommand(open_command, {
        label: 'Display SSH Info',
        isEnabled: () => true,
        execute: args => {
          checkSSH(state);
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
// Mount user workspace extension
//
///////////////////////////////////////////////////////////////
const extensionMount: JupyterFrontEndPlugin<void> = {
  id: 'mount-s3-folder',
  autoStart: true,
  requires: [ICommandPalette, IStateDB],
  optional: [],
  activate: (app: JupyterFrontEnd, state: IStateDB, palette: ICommandPalette) => {
    const open_command = 'sshinfo:mount';

    app.commands.addCommand(open_command, {
      label: 'User Workspace Mount',
      isEnabled: () => true,
      execute: args => {
        mountUserFolder(state);
      }
    });
    palette.addItem({command:open_command,category:'User'});
    mountUserFolder(state); // automatically mount user folder on load
  }
};

///////////////////////////////////////////////////////////////
//
// Mount org buckets extension
//
///////////////////////////////////////////////////////////////
const extensionMountOrgBuckets: JupyterFrontEndPlugin<void> = {
  id: 'mount-che-org-buckets',
  requires: [ICommandPalette, IStateDB],
  autoStart: true,
  activate: (app: JupyterFrontEnd, state: IStateDB, palette: ICommandPalette) => {
    const open_command = 'sshinfo:orgs';
    app.commands.addCommand(open_command, {
      label: 'Che Org Workspace Mount',
      isEnabled: () => true,
      execute: args => {
        mountOrgFolders(state);
      }
    });
    palette.addItem({command:open_command,category:'User'});
    mountOrgFolders(state);
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




export default [extensionSsh, extensionUser, extensionMount, extensionPreSigneds3Url, extensionRefreshToken, extensionMountOrgBuckets];
