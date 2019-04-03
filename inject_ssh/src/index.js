import { ICellTools, INotebookTracker } from "@jupyterlab/notebook";
import { PageConfig } from '@jupyterlab/coreutils'

class InjectSSH {
  constructor() {

    let key = "err";
    console.log(window.parent);
    //console.log(_keycloak);
    console.log(window.parent._keycloak);
    window.parent._keycloak.loadUserInfo().success(function(profile) {
      
      console.log(profile);
      key = profile['public_ssh_keys'];
      console.log(key)

      var getUrl = new URL(PageConfig.getBaseUrl() + "inject_ssh/inject_public_key");
      getUrl.searchParams.append("key", key);

      // Make call to back end
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        console.log("SSH Key injected")
      };
      xhr.open("GET", getUrl.href, true);
      xhr.send(null);

    }).error(function() {
      console.log('Failed to load profile.');
    });

  }
}

/**
 * Initialization for the inject_ssh extension - creates instance of inject SSH that injects the key.
 */
const activate = (app) => {

  new InjectSSH();
  console.log('>>> JupyterLab extension inject_ssh (beta) is activated!');

};

const extension = {
  id: "inject_ssh",
  autoStart: true,
  requires: [],
  activate: activate
};

export default extension;