import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import { JobCache, HySDSWidget, popup, popupResult } from './hysds';

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

  getValue() {
    // var ind = this.dropdown.selected​Index;
    var opt:string = this.dropdown.value;
    var ind = opt.indexOf('(');
    if (ind > -1) {
      opt = opt.substr(0,ind).trim();
    }
    console.log(opt);
    
    // guarantee RegisterWidget is passed a value
    if (opt == null || opt == '') {
      console.log('no option selected');
      popupResult("No Option Selected","Select Failed");
    } else {
      this.getDefaultValues(opt).then((defaultValues) => {
        console.log(defaultValues);
        if (this.automate) {
          console.log('create registerAuto');
          popup(new RegisterWidget('registerAuto',this.registerFields,this.jobsPanel,opt,defaultValues));
        } else {
          console.log('create register');
          popup(new RegisterWidget('register',this.registerFields,this.jobsPanel,opt,defaultValues));
        }
      });
    }
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
        }
      });
    });
  }
}

export class RegisterWidget extends HySDSWidget {

  // TODO: protect instance vars
  // public readonly req: string;
  // public readonly popup_title: string;
  public readonly auto:boolean;
  name_lang:string;

  constructor(req:string, method_fields:string[],panel:JobCache,selected:string,defaultValues:{[k:string]:string}) {
    super(req, method_fields, panel,defaultValues);
    this.auto = (req == 'registerAuto');
    this.name_lang = selected;

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
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // add user-defined fields
      for (var field of this.fields) {
        var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
        // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
        console.log(field+' input is '+fieldText);
        getUrl.searchParams.append(field.toLowerCase(), fieldText);
      }

      console.log(getUrl.href);
      console.log('done setting url');
      urllst.push(getUrl);
      resolve(urllst);
    });
  }
}
