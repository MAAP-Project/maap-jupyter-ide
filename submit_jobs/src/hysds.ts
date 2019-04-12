import { Widget } from '@phosphor/widgets';
import { Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
// import { INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
// import * as $ from "jquery";
// import { format } from "xml-formatter";

export class JobCache extends Widget {
  public response_text: string[];

  constructor() {
    super();
    this.response_text = [];
  }

  updateDisplay(): void {
    // document.getElementById('search-text').innerHTML = this.response_text;
    var catted = this.response_text.join("\n");
    if (document.getElementById('job-cache') != null){
      (<HTMLTextAreaElement>document.getElementById('job-cache')).value = catted;
    } else {
      var textarea = document.createElement("TEXTAREA");
      textarea.id = 'job-cache';
      (<HTMLTextAreaElement>textarea).readOnly = true;
      (<HTMLTextAreaElement>textarea).cols = 40;
      (<HTMLTextAreaElement>textarea).rows = 50;
      (<HTMLTextAreaElement>textarea).value = catted;
      this.node.appendChild(textarea);
    }
  }
  addJob(job:string): void {
    this.response_text.push(job);
    this.updateDisplay();
  }
}

// -----------------------
// HySDS stuff
// -----------------------
const nonXML: string[] = ['listAlgorithms','registerAuto','getResult','executeInputs','getStatus','execute','describeProcess','getCapabilities','register'];
const notImplemented: string[] = ['dismiss'];
export class HySDSWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public readonly popup_title: string;
  public response_text: string;
  public old_fields: {[k:string]:string}; // for execute
  public readonly fields: string[];       // for execute
  public readonly get_inputs: boolean;    // for execute
  jobs_panel: JobCache;    // for execute
  ins_dict: {[k:string]:string};          // for execute

  constructor(req:string, method_fields:string[],panel:JobCache) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    super({node: body});

     // Default text
    this.req = req;
    this.response_text = "";
    this.old_fields = {};
    this.fields = method_fields;
    this.get_inputs = false;
    this.jobs_panel = panel;
    this.ins_dict = {};

    switch (req) {
      case 'register':
        this.popup_title = "Register Algorithm";
        console.log('register');
        break;
      case 'registerAuto':
        this.popup_title = "Register Algorithm";
        console.log('registerAuto');
        break;
      case 'getCapabilities':
        this.popup_title = "Get List of Capabilities";
        console.log('getCapabilities');
        break;
      case 'getStatus':
        this.popup_title = "Get Job Status";
        console.log('getStatus');
        break;
      case 'getResult':
        this.popup_title = "Get Job Result";
        console.log('getResult');
        break;
      case 'executeInputs':
        this.popup_title = "Execute Job";
        console.log('executeInputs');
        break;
      case 'execute':
        this.popup_title = "Execute Job - Provide Inputs";
        this.get_inputs = true;
        console.log('execute');
        break;
      case 'dismiss':
        this.popup_title = "Dismiss Job";
        console.log('dismiss');
        break;
      case 'describeProcess':
        this.popup_title = "Describe Process";
        console.log('describeProcess');
      case 'listAlgorithms':
        this.popup_title = "List Algorithms";
        console.log('listAlgorithms');
    }
    // console.log(this.fields);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);

    // console.log('making title');
    // list all the fields of the job
    var title = document.createElement('div');
    title.innerHTML = this.popup_title+"\n";
    this.node.appendChild(title);

    if (this.popup_title == "registerAuto") {
      var msg = document.createElement("Label");
      msg.innerHTML = "Your Docker container must have cloned the repository in the following path: /app";
      this.node.appendChild(msg);
    }

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // TODO enforce input types
    // console.log('making fields');
    // Construct labels and inputs for fields
    if (! this.get_inputs) {
      for (var field of this.fields) {
        
        // textarea for inputs field in register
        if (field == "inputs") {
          var fieldLabel = document.createElement("Label");
          fieldLabel.innerHTML = field;
          this.node.appendChild(fieldLabel);

          var fieldInputs = document.createElement('textarea');
          fieldInputs.id = (field.toLowerCase() + '-input');
          (<HTMLTextAreaElement>fieldInputs).cols = 40;
          (<HTMLTextAreaElement>fieldInputs).rows = 6;
          this.node.appendChild(fieldInputs);
        
          // BREAK
          var x = document.createElement("BR");
          this.node.appendChild(x)

        // for all other fields
        } else {
          var fieldLabel = document.createElement("Label");
          fieldLabel.innerHTML = field;
          this.node.appendChild(fieldLabel);

          var fieldInput = document.createElement('input');
          fieldInput.id = (field.toLowerCase() + '-input');
          this.node.appendChild(fieldInput);
        
          // BREAK
          var x = document.createElement("BR");
          this.node.appendChild(x)
        }
      }

    // user fill out inputs for execute 2nd popup
    } else {
      // console.log("new");
      for (var field of this.fields) {
        // console.log('printing fields');
        var field_name = field[0];
        // console.log(field_name);
        var fieldLabel = document.createElement("Label");
        fieldLabel.innerHTML = field_name;
        this.node.appendChild(fieldLabel);

        var fieldInput = document.createElement('input');
        fieldInput.id = (field_name.toLowerCase() + '-input');
        this.node.appendChild(fieldInput);
      
        // BREAK
        var x = document.createElement("BR");
        this.node.appendChild(x)
        // console.log(field_name);
      }
    }
    // console.log('done constructing');
  }

  setOldFields(old:{[k:string]:string}): void {
    console.log('setting fields');
    this.old_fields = old;
    // TODO enforce input types
  }

  // TODO: add jobs to response text
  updateJobCache(){
    console.log(this.fields);
    if (this.req == 'execute') {
      this.jobs_panel.addJob("algo: " + this.old_fields["algo_id"]);
      this.jobs_panel.addJob("inputs: ");
      for (var e of this.fields) {
        var fieldName = e[0].toLowerCase();
        console.log(fieldName);
        if (!['timestamp'].includes(fieldName)){
          var fieldText = this.ins_dict[fieldName];
          console.log(fieldText);
          this.jobs_panel.addJob("\t" + fieldName + " : " + fieldText);
        }
      }
      this.jobs_panel.addJob(this.response_text);
      this.jobs_panel.addJob('------------------------------');
    }
  }

  updateSearchResults(): void {
    var me = this;
    // document.getElementById('search-text').innerHTML = this.response_text;
    // console.log(this.response_text);

    if (document.getElementById('result-text') != null){
      console.log('using textarea');
      (<HTMLDivElement>document.getElementById('result-text')).innerHTML = "<pre>" + this.response_text + "</pre>";
    } else {
      console.log('create textarea');
      let body = document.createElement('div');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';

      var textarea = document.createElement("div");
      textarea.id = 'result-text';
      textarea.style.display = 'flex';
      textarea.style.flexDirection = 'column';
      var format = require('xml-formatter');
      // var xml = "<pre>" + this.response_text + "</pre>";

      if ( nonXML.includes(me.req) ){ 
        textarea.innerHTML = "<pre>" + this.response_text + "</pre>";
        console.log(textarea);
      } else {
        var xml = this.response_text;
        var options = {indentation: '  ', stripComments: true, collapseContent: false};
        var formattedXML = format(xml,options); 
        textarea.innerText = formattedXML;
        console.log(textarea);
      }

      body.appendChild(textarea);
      // this.node.appendChild(textarea);
      // this.node = body;
      me.updateJobCache();
      popupResult(new WidgetResult(body));
    }
  }

  buildRequestUrl() {
    var me = this;
    return new Promise<URL>((resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // for calling execute after getting user inputs
      if (this.get_inputs) {
        // filling out algo info (id, version)
        for (let key in this.old_fields) {
          var fieldText = this.old_fields[key].toLowerCase();
          getUrl.searchParams.append(key.toLowerCase(), fieldText);
        }
        // filling out algo inputs
        var new_input_list = "";
        for (var e of this.fields) {
          var field = e[0].toLowerCase();
          new_input_list = new_input_list.concat(field,',');
          // console.log(field);
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          // console.log(fieldText);
          this.ins_dict[field] = fieldText;
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }
        console.log(new_input_list);
        getUrl.searchParams.append("inputs",new_input_list);
        resolve(getUrl);

      // for getting notebook info with auto register
      } else if (me.req == 'registerAuto') {
        var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'api/sessions');
        request('get',settingsAPIUrl.href).then((res: RequestResult) => {
          if (res.ok) {
            var json_response:any = res.json();
            var servers = json_response;
            console.log(servers);
            console.log(servers.length);

            // TODO: find active tab instead of grabbing 1st one
            // Get Notebook information to pass to RegisterAuto Handler
            var tab:any = servers[0];
            console.log(tab);
            var nb_name:any = tab["path"];
            var algo_name:any = tab["notebook"]["path"];
            var lang:any = tab["kernel"]["name"];
            console.log(nb_name);
            console.log(algo_name);
            console.log(lang);
            getUrl.searchParams.append('nb_name', nb_name);
            getUrl.searchParams.append('algo_name', algo_name);
            getUrl.searchParams.append('lang', lang);
            console.log(getUrl.href);
          }
          console.log('done setting url');
          resolve(getUrl);
        })

      // for all other requests
      } else {
        for (var field of this.fields) {
          if (field == "inputs") {
            var fieldText = (<HTMLTextAreaElement>document.getElementById(field.toLowerCase()+'-input')).value;
            if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
          } else {
            var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
            if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
          }
        }
        resolve(getUrl);
      }

    });
  }

  sendRequest(getUrl:URL) {
    console.log('sending');
    console.log(getUrl.href);
    var me = this;
    // Send Job as Request
    // if just got inputs for execute, new popup to fill out input fields
    if (me.req == 'executeInputs') {
      request('get', getUrl.href).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          // console.log(json_response['status_code']);
          console.log(json_response['result']);

          if (json_response['status_code'] == 200){
            // console.log(json_response['ins']);
            // var new_fields = [...executeInputsFields, ...json_response['ins']];
            var new_fields = json_response['ins'];
            var old_fields = json_response['old'];
            // console.log(new_fields);
            // console.log('pre-popup');
            var exec = new HySDSWidget('execute',new_fields, me.jobs_panel);
            exec.setOldFields(old_fields);
            popup(exec);
            // console.log('post-popup');
          } else {
            me.response_text = json_response['result'];
            me.updateSearchResults();
            console.log("updating");
          }
        } else {
          me.response_text = "Error Getting Inputs Required.";
          me.updateSearchResults();
          console.log("updating");
        }
      });
    // if set result text to response
    } else if ( !(notImplemented.includes(me.req) )){
      request('get', getUrl.href).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          me.response_text = json_response['result'];
        } else {
          me.response_text = "Error Sending Request.";
        }
        console.log("updating");
        me.updateSearchResults();
      });
    } else {
      console.log("not implemented yet");
    }
    return;
  }

  // submit the job
  // overrides the resolution of popup dialog
  getValue() {
    this.buildRequestUrl().then((url) => {
      // console.log('then');
      console.log(url);
      this.sendRequest(url);
    });
  }
}

export class WidgetResult extends Widget {
  constructor(b: any) {
    super({node: b});
  }
}

export class DialogEnter<T> extends Dialog<T> {
  /**
   * Create a dialog panel instance.
   *
   * @param options - The dialog setup options.
   */
  constructor(options: Partial<Dialog.IOptions<T>> = {}) {
    super(options);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._evtKeydown(event as KeyboardEvent);
        break;
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'focus':
        this._evtFocus(event as FocusEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
      default:
        break;
    }
  }

  protected _evtKeydown(event: KeyboardEvent): void {
    // Check for escape key
    switch (event.keyCode) {
      case 13: // Enter.
        //event.stopPropagation();
        //event.preventDefault();
        //this.resolve();
        break;
      default:
        super._evtKeydown(event);
        break;
    }
  }
}

export function showDialog<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new DialogEnter(options);
  dialog.launch();
  // setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:HySDSWidget): void {
  if ( !(notImplemented.includes(b.req) )){ 
    showDialog({
      title: b.popup_title,
      body: b,
      focusNodeSelector: 'input',
      buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({ label : 'Cancel'})]
    });
  } else {
    console.log("not implemented yet");
    popupResult("Not Implemented yet")
  }
}

export function popupResult(b:any): void {
  showDialog({
    title: 'Results:',
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}
