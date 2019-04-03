import { ICellTools, INotebookTracker } from "@jupyterlab/notebook";


class InjectSSH {
  constructor() {

    let key = "err";
    console.log(window);
    //console.log(_keycloak);
    console.log(window._keycloak);
    window._keycloak.loadUserInfo().success(function(profile) {
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