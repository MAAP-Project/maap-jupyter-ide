import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import { JobCache, HySDSWidget, popup } from './hysds';

// popup helper for register to select project
export class ProjectSelector extends Widget {
  public readonly registerFields: string[];
  jobsPanel: JobCache;
  automate: boolean;
  public selection:string;
  dropdown:HTMLSelectElement;

  constructor(automate,fields,jobs_panel) {
    super();
    this.registerFields = fields;
    this.jobsPanel = jobs_panel;
    this.automate = automate;
    this.selection = '';
    // this.popup_title = "Select Project";

    this.dropdown = <HTMLSelectElement>document.createElement("SELECT");
    this.dropdown.id = "project-dropdown";
    this.getProjects().then((serverList) => {
      // console.log(serverList);
      var opt:HTMLOptionElement;
      var txt:string;
      for (var tab of serverList) {
        // console.log(tab);
        opt = <HTMLOptionElement>document.createElement("option");
        opt.setAttribute("id",tab['path']);
        txt = tab['path']+' - '+tab['kernel']['name'];
        opt.setAttribute("label",txt);
        opt.appendChild(document.createTextNode(txt));
        this.dropdown.appendChild(opt);
      }
      this.node.appendChild(this.dropdown);
    });
  }

  getProjects() {
    var me = this;
    return new Promise<Array<string>>((resolve, reject) => {
      var serverList: Array<string> = []

      // get list of projects to give dropdown menu
      var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'api/sessions');
      request('get',settingsAPIUrl.href).then((res: RequestResult) => {
        if (res.ok) {
          var json_response:any = res.json();
          var servers = json_response;
          // console.log(servers);
          // console.log(servers.length);
          if (servers.length == 0) {
            me.selection = "No open notebooks";
            return;
          } else {
            serverList = servers;
          }
        resolve(serverList);
        }
      });
    });
  }

  getValue() {
    // var ind = this.dropdown.selected​Index;
    var opt:string = this.dropdown.value;
    console.log(opt);
    // this.selection = opt.label;
    if (this.automate) {
      console.log('create registerAuto');
      popup(new RegisterWidget('registerAuto',this.registerFields,this.jobsPanel,opt));
    } else {
      console.log('create register');
      // popup(new HySDSWidget('register',this.registerFields,this.jobsPanel));
    }
  }
}

export class RegisterWidget extends HySDSWidget {

  // TODO: protect instance vars
  // public readonly req: string;
  // public readonly popup_title: string;
  public readonly auto:boolean;
  git_url:string;

  constructor(req:string, method_fields:string[],panel:JobCache,git_loc:string) {
    super(req, method_fields, panel);
    this.auto = (req == 'registerAuto');
    this.git_url = git_loc;

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);
  }

  buildRequestUrl() {
    var me:RegisterWidget = this;
    return new Promise<Array<URL>>((resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // Pull notebook name and language for automatic register
      if (me.auto) {
        // add user-defined fields
        for (var field of this.fields) {
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
          console.log(field+' input is '+fieldText);
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }

        var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'api/sessions');
        request('get',settingsAPIUrl.href).then((res: RequestResult) => {
          if (res.ok) {
            var json_response:any = res.json();
            var servers = json_response;
            console.log(servers);
            console.log(servers.length);

            // TODO: find active tab instead of grabbing 1st one
            // Get Notebook information to pass to RegisterAuto Handler
            var tab:any = {};
            var nb_name:string = '';
            var algo_name:string = '';
            var lang:string = '';
            console.log(tab);
            if (servers.length > 0) {
              tab = servers[0];
              nb_name = tab["path"];      // undefined if no notebook open
              if (tab["type"] == "console") {
                nb_name = tab["path"].split('/console')[0]
              }
              algo_name = tab["name"];
              lang = tab["kernel"]["name"];
            }
            if (servers.length == 0 || tab == {} || [nb_name,algo_name,lang].includes('')) {
              console.log("no notebook open");
              me.response_text = "No notebook open";
              me.updateSearchResults();
              return;
            }
            if (nb_name == '' || nb_name.indexOf("/console") == 0) {
              console.log("Not in a project!");
              me.response_text = "Not in a project";
              me.updateSearchResults();
              return;
            }
            console.log(nb_name);
            console.log(algo_name);
            console.log(lang);
            getUrl.searchParams.append('nb_name', nb_name);
            getUrl.searchParams.append('algo_name', algo_name);
            getUrl.searchParams.append('lang', lang);
            console.log(getUrl.href);
          }
          console.log('done setting url');
          urllst.push(getUrl);
          resolve(urllst);
        });

      // // Get Notebook information to pass to Register Handler
      } else {
        // add user-defined fields
        for (var field of this.fields) {
          console.log('checking '+field);
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }

        var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'api/sessions');
        // get notebook path to check if user committed
        request('get',settingsAPIUrl.href).then((res: RequestResult) => {
          if (res.ok) {
            var json_response:any = res.json();
            var servers = json_response;
            console.log(servers);
            // console.log(servers.length);

            // nothing open
            if (servers.length == 0) {
              console.log("no notebook open");
              me.response_text = "No notebook open";
              me.updateSearchResults();
              return;
            }

            // TODO: find active tab instead of grabbing 1st one
            var tab:any = servers[0];
            console.log(tab);
            var nb_name:any = tab["path"];      // undefined if no notebook open
            if (tab["type"] == "console") {
              nb_name = tab["path"].split('/console')[0]
            }
            if (typeof nb_name == 'undefined') {
              nb_name = ''
            }
            if (nb_name == '' || nb_name.indexOf("/console") == 0) {
              console.log("Not in a project!");
              me.response_text = "Not in a project";
              me.updateSearchResults();
              return;
            }
            console.log(nb_name);
            getUrl.searchParams.append('nb_name', nb_name);
            console.log(getUrl.href);
            urllst.push(getUrl);
            resolve(urllst);
            console.log('done setting url');
          }
        });
      }
    });
  }
}


