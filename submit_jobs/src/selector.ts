import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import { HySDSWidget, RegisterWidget } from './widgets';
import { getAlgorithms, getDefaultValues } from './funcs';
import { JobCache } from './panel';
import { popup, popupResult } from "./dialogs";

// popup helper for register to select project
export class ProjectSelector extends Widget {
  public readonly fields: string[];
  username:string;
  jobsPanel: JobCache;
  public selection:string;
  type: string;
  dropdown:HTMLSelectElement;
  popup_title: string;

  constructor(type,fields,uname,jobs_panel) {
    super();
    this.fields = fields;
    this.username = uname;
    this.jobsPanel = jobs_panel;
    this.selection = '';
    this.type = type;
    this.popup_title = "";

    if (['describeProcess','executeInputs','deleteAlgorithm'].includes(this.type)) {
      this.popup_title = "Select Algorithm";
    } else {
      this.popup_title = "Select Project";
    }

    this.dropdown = <HTMLSelectElement>document.createElement("SELECT");
    this.dropdown.id = "project-dropdown";
    this.dropdown.setAttribute("style", "font-size:20px;");

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
          this.dropdown.appendChild(opt);
        }
        this.node.appendChild(this.dropdown);
      });
    } else if (type == 'describeProcess' || type == 'executeInputs' || type == 'deleteAlgorithm') {
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
            this.dropdown.appendChild(opt);
          }
        }
        this.node.appendChild(this.dropdown)
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
        if (res.ok) {
          var json_response:any = res.json();
          var projects = json_response['project_files'];
          // console.log(servers);
          // console.log(servers.length);
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

  // overrides resolution of popup dialog
  getValue() {
    // var ind = this.dropdown.selectedIndex;
    let opt:string = this.dropdown.value;
    let ind = opt.indexOf('(');
    if (ind > -1) {
      opt = opt.substr(0,ind).trim();
    }
    console.log(opt);
    
    // guarantee RegisterWidget is passed a value
    if (opt == null || opt == '') {
      console.log('no option selected');
      popupResult("No Option Selected","Select Failed");
    } else if (this.type == 'describeProcess' || this.type == 'executeInputs' || this.type == 'deleteAlgorithm') {
      let lst = opt.split(':');
      let selection = {};
      selection['algo_id'] = lst[0];
      selection['version'] = lst[1];
      let w = new HySDSWidget(this.type,[],this.username,this.jobsPanel,{});
      w.setOldFields(selection);
      w.getValue();
    } else if (this.type == 'register') {
      getDefaultValues(opt).then((defaultValues) => {
        console.log(defaultValues);
        console.log('create register');
        let w = new RegisterWidget('register',this.fields,this.username,this.jobsPanel,defaultValues);
        w.setOldFields(defaultValues);
        console.log(w);
        popup(w);
      });
    }
    return;
  }
}


