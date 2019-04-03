import { ICellTools, INotebookTracker } from "@jupyterlab/notebook";


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
    }).error(function() {
      console.log('Failed to load profile.');
    });
  }
}

/**
 * Initialization data for the jupyterlab_rmotr_solutions extension.
 */
const activate = (app) => {

  new InjectSSH();


  console.log('>>> JupyterLab extension jupyterlab_rmotr_solutions (beta) is activated!');

};

const extension = {
  id: "jupyterlab_rmotr_solutions",
  autoStart: true,
  requires: [],
  activate: activate
};

export default extension;