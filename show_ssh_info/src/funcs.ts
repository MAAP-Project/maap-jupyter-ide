import { JupyterFrontEnd } from "@jupyterlab/application";
import { PageConfig } from "@jupyterlab/coreutils";
import { Dialog, ICommandPalette, showDialog } from "@jupyterlab/apputils";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IStateDB } from '@jupyterlab/statedb';
// import { Widget } from "@lumino/widgets";
import { INotification } from "jupyterlab_toastify";
import { getToken, getUserInfo, getUserInfoAsyncWrapper } from "./getKeycloak";
import { SshWidget, InstallSshWidget, UserInfoWidget } from './widgets';
import { DropdownSelector } from './selector';
import { popupResult } from './dialogs';
import { request, RequestResult } from './request';

const profileId = 'maapsec-extension:IMaapProfile';

export async function checkSSH() {
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

export function checkUserInfo(): void {
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

export async function mountUserFolder(state: IStateDB) {

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

export async function mountOrgFolders(state: IStateDB) {
  // do something
  let token = getToken();
  var getUrl = new URL(PageConfig.getBaseUrl() + 'show_ssh_info/getOrgs');
  getUrl.searchParams.append('token',token);
  request('get', getUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      let data:any = JSON.parse(res.data);
      if (data.status_code == 200) {
        console.log(data);
        INotification.success('Successfully mounted organization and sub-organization folders')
      } else {
        INotification.error('Failed to get user\'s Che orgs');
      }
    } else {
      INotification.error('Failed to get user\'s Che orgs');
    }
  });
}

export async function getPresignedUrl(state: IStateDB, key:string, duration:string): Promise<string> {
  const profile = await getUsernameToken(state);  

  return new Promise<string>(async (resolve, reject) => {
    let presignedUrl = '';
    let token = getToken();

    var getUrl = new URL(PageConfig.getBaseUrl() + 'show_ssh_info/getSigneds3Url');
    getUrl.searchParams.append('home_path', PageConfig.getOption('serverRoot'));
    getUrl.searchParams.append('key', key);
    getUrl.searchParams.append('username', profile.uname);
    getUrl.searchParams.append('token', token);
    getUrl.searchParams.append('proxy-ticket', profile.ticket);
    getUrl.searchParams.append('duration', duration);
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
          resolve(data.url);
        }
      } else {
        INotification.error('Failed to get presigned s3 url');
        resolve(presignedUrl);
      }
    });
  });
}

export function activateGetPresignedUrl(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  factory: IFileBrowserFactory,
  state: IStateDB
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

      let expirationOptions = ['86400 (24 hours)','604800 (1 week)','2592000 (30 days)'];
      let dropdownSelector = new DropdownSelector(expirationOptions, '86400 (24 hours)', state, path);
      popupResult(dropdownSelector, 'Select an Expiration Duration');
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

let ade_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/environment');

request('get', valuesUrl.href).then((res: RequestResult) => {
  if (res.ok) {
    let environment = JSON.parse(res.data);
    ade_server = environment['ade_server'];
  }
});

export async function getUsernameToken(state: IStateDB) {
  let defResult = {uname: 'anonymous', ticket: ''}

  if ("https://" + ade_server === document.location.origin) {
    let kcProfile = await getUserInfoAsyncWrapper();

    if (kcProfile['cas:username'] === undefined) {
      INotification.error("Get profile failed.");
      return defResult
    } else {
      return {uname: kcProfile['cas:username'], ticket: kcProfile['proxyGrantingTicket']}
    }

  } else {
    return state.fetch(profileId).then((profile) => {
      let profileObj = JSON.parse(JSON.stringify(profile));
      return {uname: profileObj.preferred_username, ticket: profileObj.proxyGrantingTicket}
    }).catch((error) => {
      return defResult
    });
  }
}
