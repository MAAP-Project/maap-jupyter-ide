import {Widget} from "@phosphor/widgets";
import {request, RequestResult} from "./request";
import {PageConfig} from "@jupyterlab/coreutils";
import {getUserInfo} from "./getKeycloak";
import {INotification} from "jupyterlab_toastify";

export
class SshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    request('get', PageConfig.getBaseUrl() + "show_ssh_info/get").then((res: RequestResult) => {
      if(res.ok){
        let json_results:any = res.json();
        let ip = json_results['ip'];
        let port = json_results['port'];
        let message = "ssh root@" + ip + " -p " + port;
        // let message = "ssh -i <path_to_your_key> root@" + ip + " -p " + port;
        let contents = document.createTextNode(message);
        body.appendChild(contents);
      }
    });
    super({ node: body });
  }
}

export
class InstallSshWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let message = "SSH has not been enabled in your workspace. In order to enable SSH navigate to your workspace admin page. Under the tab Installers, turn on SSH and EXEC and click apply. NOTE: This will restart your workspace and take a few minutes.";
    let contents = document.createTextNode(message);
    body.appendChild(contents);
    super({ node: body });
  }
}

export
class UserInfoWidget extends Widget {
  constructor(username:string,email:string,org:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    let user_node = document.createTextNode('Username: '+username);
    body.appendChild(user_node);
    body.appendChild(document.createElement('br'));
    let email_node = document.createTextNode('Email: '+email);
    body.appendChild(email_node);
    body.appendChild(document.createElement('br'));
    let org_node = document.createTextNode('Organization: '+org);
    body.appendChild(org_node);
    super({node: body});
  }
}

export class InjectSSH {
  constructor() {

    getUserInfo(function(profile: any) {

        if (profile['public_ssh_keys'] === undefined) {
            INotification.error("Injecting user's SSH key failed - SSH Key undefined.");
            return;
        }
        let key = profile['public_ssh_keys'];

        let getUrl = new URL(PageConfig.getBaseUrl() + "show_ssh_info/inject_public_key");
        getUrl.searchParams.append("key", key);

        if (profile['proxyGrantingTicket'] !== undefined) {
            getUrl.searchParams.append("proxyGrantingTicket", profile['proxyGrantingTicket']);
        }

        // Make call to back end
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            console.log("SSH Key injected");
        };
        xhr.open("GET", getUrl.href, true);
        xhr.send(null);
    });
  }
}
