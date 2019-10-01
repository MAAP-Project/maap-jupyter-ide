import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import { HySDSWidget } from './widgets';
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
      this.getAlgorithms().then((algo_lst:{[k:string]:Array<string>}) => {
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

  getAlgorithms() {
    var me = this;
    return new Promise<{[k:string]:Array<string>}>((resolve, reject) => {
      var algoSet: { [key: string]: Array<string>} = {}

      // get list of projects to give dropdown menu
      var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
      console.log(settingsAPIUrl.href);
      request('get',settingsAPIUrl.href).then((res: RequestResult) => {
        if (res.ok) {
          var json_response:any = res.json();
          var algos = json_response['algo_set'];
          // console.log(json_response);
          // console.log(algos);
          if (algos.length == 0) {
            me.selection = "No algorithms available";
            return;
          } else {
            algoSet = algos;
          }
        resolve(algoSet);
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
      this.getDefaultValues(opt).then((defaultValues) => {
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

  getDefaultValues(code_path) {
    return new Promise<{[k:string]:string}>((resolve, reject) => {
      var defaultValues:{[k:string]:string}  = {}

      // get list of projects to give dropdown menu
      var valuesUrl = new URL(PageConfig.getBaseUrl() + 'hysds/defaultValues');
      valuesUrl.searchParams.append('code_path', code_path);
      console.log(valuesUrl.href);
      request('get',valuesUrl.href).then((res: RequestResult) => {
        if (res.ok) {
          var json_response:any = res.json();
          var values = json_response['default_values'];
          defaultValues = values;
        resolve(defaultValues);
        } else {
          resolve({});
        }
      });
    });
  }
}

export class RegisterWidget extends HySDSWidget {

  // TODO: protect instance vars
  // public readonly req: string;
  // public readonly popup_title: string;

  constructor(req:string, method_fields:string[],uname:string,panel:JobCache,defaultValues:{[k:string]:string}) {
    super(req, method_fields,uname,panel,defaultValues);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);
  }

  buildRequestUrl() {
    // var me:RegisterWidget = this;
    return new Promise<Array<URL>>((resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);

      // default values not exposed to user set here,  along with algo name and version
      for (let key in this.old_fields) {
        if (! (key in this.fields)) {
          var fieldText = this.old_fields[key].toLowerCase();
          getUrl.searchParams.append(key.toLowerCase(), fieldText);
        }
      }
      console.log('old fields done');
      console.log(getUrl.href);

      // add user-defined fields
      for (var field of this.fields) {
        let fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
        // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
        console.log(field+' input is '+fieldText);
        getUrl.searchParams.append(field.toLowerCase(), fieldText);
        console.log(getUrl.href);
      }

      console.log(getUrl.href);
      console.log('done setting url');
      urllst.push(getUrl);
      resolve(urllst);
    });
  }
}

