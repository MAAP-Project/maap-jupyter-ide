import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { INotification } from 'jupyterlab_toastify';
import { getUserInfo } from './getKeycloak';
import { request, RequestResult } from './request';
import { InputWidget, RegisterWidget } from './widgets';
import { getAlgorithms, getDefaultValues, inputRequest } from './funcs';
import { popup, popupResult } from "./dialogs";

// popup helper for register to select project
export class ProjectSelector extends Widget {
  type: string;
  _fields: string[];
  _username:string;
  public selection:string;
  _dropdown:HTMLSelectElement;

  constructor(type,fields,uname) {
    super();
    this._fields = fields;
    this._username = uname;
    this.selection = '';
    this.type = type;

    this._dropdown = <HTMLSelectElement>document.createElement("SELECT");
    this._dropdown.id = "project-dropdown";
    this._dropdown.setAttribute("style", "font-size:20px;");

    if (type == 'register') {
      this.getProjects().then((projectList) => {
        // console.log(projectList);
        var opt:HTMLOptionElement;
        var txt:string;
        for (var file of projectList) {
          var lang = '';
          if (file.indexOf('.py') > -1 || file.indexOf('.ipynb') > -1) {
            lang = 'python';
          } else if (file.indexOf('.sh') > -1) {
            lang = 'bash';
          } else if (file.indexOf('.jl') > -1) {
            lang = 'julia';
          } else {
            lang = 'unknown';
            console.log('language unknown');
          }
          console.log('lang is '+lang);

          opt = <HTMLOptionElement>document.createElement("option");
          opt.setAttribute("id",file);
          txt = file+' (' + lang +')';
          opt.setAttribute("label",txt);
          opt.appendChild(document.createTextNode(txt));
          this._dropdown.appendChild(opt);
        }
        this.node.appendChild(this._dropdown);
      });
    } else if (['describeProcess','publishAlgorithm','executeInputs','deleteAlgorithm'].includes(type)) {
      let me = this;
      getAlgorithms().then((algo_lst:{[k:string]:Array<string>}) => {
        if (Object.keys(algo_lst).length == 0) {
          me.selection = "No algorithms available";
        }
        var opt:HTMLOptionElement;
        var txt:string;
        // console.log(algo_lst);
        for (var algo in algo_lst) {
          for (var ver of algo_lst[algo]) {
            txt = algo+':'+ver;
            opt = <HTMLOptionElement>document.createElement("option");
            opt.setAttribute("id",txt);
            opt.setAttribute("label",txt);
            opt.appendChild(document.createTextNode(txt));
            this._dropdown.appendChild(opt);
          }
        }
        this.node.appendChild(this._dropdown)
      });
    }
  }

  getProjects() {
    var me = this;
    return new Promise<Array<string>>((resolve, reject) => {
      var projectList: Array<string> = []

      // get list of projects to give dropdown menu
      var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'pull_projects/listFiles');
      console.log(settingsAPIUrl.href);
      request('get',settingsAPIUrl.href).then((res: RequestResult) => {
        console.log(res);
        if (res.ok) {
          var json_response:any = res.json();
          console.log(json_response);
          var projects = json_response['project_files'];
          if (projects.length == 0) {
            me.selection = "No open notebooks";
            return;
          } else {
            projectList = projects;
          }
        resolve(projectList);
        }
      });
    });
  }

  loadUserProxyTicket() {
    return new Promise(function(resolve, reject) {
        getUserInfo(function(profile:any) {
          if (profile['proxyGrantingTicket'] !== undefined) {
            console.log(`Loaded proxy ticket ${profile['proxyGrantingTicket']}`);
            resolve(profile['proxyGrantingTicket']);
          } else {
            reject(new Error('Error retrieving proxy ticket'));
          }
        });
    });
  }

  // overrides resolution of popup dialog
  getValue() {
    // var ind = this._dropdown.selectedIndex;
    let opt:string = this._dropdown.value;
    let ind = opt.indexOf('(');
    if (ind > -1) {
      opt = opt.substr(0,ind).trim();
    }
    console.log(opt);
    var that = this;

    this.loadUserProxyTicket().then(
      function(proxy_ticket) {
        // guarantee RegisterWidget is passed a value
        if (opt == null || opt == '') {
          console.log('no option selected');
          popupResult("No Option Selected","Select Failed");

        // these calls all require just params algo_id, version
        } else if (['describeProcess','publishAlgorithm','executeInputs','deleteAlgorithm'].includes(that.type)) {
          let lst = opt.split(':');
          let algo_id = lst[0];
          let version = lst[1];

          if (that.type == 'executeInputs'){
            let me = that;
            // define function callback to be run after evaluation of selection
            let fn = function(resp:{[k:string]:(string|string[]|{[k:string]:string})}) {
              console.log('resp');
              var new_fields = resp['ins'] as string[];
              var predefined_fields = resp['old'] as {[k:string]:string};
              console.log(predefined_fields);
              var exec = new InputWidget('execute',new_fields,me._username,{});
              exec.setPredefinedFields(predefined_fields);
              exec.popupTitle = algo_id+':'+version;
              popup(exec);
            }
            inputRequest(that.type, algo_id, {'algo_id': algo_id, 'version': version, 'proxy-ticket': String(proxy_ticket)}, fn);

            // no additional user action required after selection
          } else if (that.type == 'describeProcess' || that.type == 'publishAlgorithm') {
            inputRequest(that.type, algo_id, {'algo_id': algo_id, 'version': version, 'proxy-ticket': String(proxy_ticket)});
          } else {
            inputRequest(that.type, algo_id, {'algo_id': algo_id, 'version': version, 'proxy-ticket': String(proxy_ticket)});
          }

        } else if (that.type == 'register') {
          getDefaultValues(opt).then((defaultValues) => {
            console.log(defaultValues);
            console.log('create register');
            let w = new RegisterWidget(that._fields,that._username,defaultValues);
            w.setPredefinedFields(defaultValues);
            console.log(w);
            popup(w);
          });
        }
      },
      error => INotification.error("Error retrieving proxy ticket") 
    );

    return;
  }
}
