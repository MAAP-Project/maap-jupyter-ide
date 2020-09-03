import {Widget} from "@lumino/widgets";
import {getUserInfo} from "./getKeycloak";
import {request, RequestResult, DEFAULT_REQUEST_OPTIONS} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";
import {INotification} from "jupyterlab_toastify";
import { IStateDB } from '@jupyterlab/statedb';

const idMaapEnvironment = 'maapsec-extension:IMaapEnvironment';

export class ProjectsPull extends Widget {
  _state: IStateDB;

  constructor(state: IStateDB) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    // Get gitlab token from keycloak
    getUserInfo(function(profile: any) {
        console.log(profile);
        let gitlab_token = (typeof profile['gitlab_access_token'] !== "undefined") ? profile['gitlab_access_token'] : '';

        getRequestOptions(state).then((res) => {
          // Make request to pull all projects
          request('get', PageConfig.getBaseUrl() + "pull_projects/getAllProjects", {"gitlab_token": gitlab_token}, {}, res).then((res: RequestResult) => {
            if(res.ok){
              let json_response:any = res.json();
              let message = json_response['status'];

              if (message.includes("project import failed")) {
                INotification.error(message);
              }
              else {
                INotification.success(message);
              }

              let contents = document.createTextNode(message);
              body.appendChild(contents);
            }
          });
        });
    });

    super({ node: body });
    this._state = state;
  }

}

export class ProjectsList extends Widget {
  _state: IStateDB;

  constructor(state: IStateDB) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    getRequestOptions(state).then((res) => {
      request('get', PageConfig.getBaseUrl() + "pull_projects/list", {}, {}, res).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          let message = json_response['result'];
          let contents = document.createTextNode(message);
          body.appendChild(contents);
        }
      });
    });

    super({ node: body });
    this._state = state;
  }

}

async function getRequestOptions(state: IStateDB) {
  return state.fetch(idMaapEnvironment).then((maapEnv) => {
    let maapEnvObj = JSON.parse(JSON.stringify(maapEnv));
    let opts = DEFAULT_REQUEST_OPTIONS;

    opts.headers.maap_env = maapEnvObj.environment;
    opts.headers.maap_ade_server = maapEnvObj.ade_server;
    opts.headers.maap_api_server = maapEnvObj.api_server;
    opts.headers.maap_auth_server = maapEnvObj.auth_server;
    opts.headers.maap_mas_server = maapEnvObj.mas_server;

    return opts;

  }).catch((error) => {
      console.error('Error retrieving MAAP environment from maapsec extension!');
      console.error(error);
      return DEFAULT_REQUEST_OPTIONS;
  });
}