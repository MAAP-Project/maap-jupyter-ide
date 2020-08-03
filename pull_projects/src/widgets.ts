import {Widget} from "@lumino/widgets";
import {getUserInfo} from "./getKeycloak";
import {request, RequestResult} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";
import {INotification} from "jupyterlab_toastify";

export class ProjectsPull extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    // Get gitlab token from keycloak
    getUserInfo(function(profile: any) {
        console.log(profile);
        let gitlab_token = (typeof profile['gitlab_access_token'] !== "undefined") ? profile['gitlab_access_token'] : '';

        // Make request to pull all projects
        request('get', PageConfig.getBaseUrl() + "pull_projects/getAllProjects", {"gitlab_token": gitlab_token}).then((res: RequestResult) => {
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

    super({ node: body });
  }

}

export class ProjectsList extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    request('get', PageConfig.getBaseUrl() + "pull_projects/list").then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        let message = json_response['result'];
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }

}