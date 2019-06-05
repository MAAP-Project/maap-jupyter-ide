import { Widget } from '@phosphor/widgets';
import { Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
// import { INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
// import * as $ from "jquery";
// import { format } from "xml-formatter";

// primitive text panel for storing submitted job information
export class JobCache extends Widget {
  public response_text: string[];
  public opt:string;

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
    this.response_text.unshift(job);
    this.updateDisplay();
  }
}

// -----------------------
// HySDS stuff
// -----------------------
const nonXML: string[] = ['deleteAlgorithm','listAlgorithms','registerAuto','getResult','executeInputs','getStatus','execute','describeProcess','getCapabilities','register'];
const notImplemented: string[] = ['dismiss'];
export class HySDSWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public readonly popup_title: string;
  public response_text: string;
  public old_fields: {[k:string]:string}; // for execute
  public readonly fields: string[];       // user inputs
  public readonly get_inputs: boolean;    // for execute
  jobs_panel: JobCache;    // for execute
  ins_dict: {[k:string]:string};          // for execute

  constructor(req:string, method_fields:string[],panel:JobCache, defaultValues:{[k:string]:string}) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    super({node: body});
    // const el = document.getElementById('jupyter-config-data');
    // console.log(PageConfig.getOption('');
    // console.log(el);

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
      // case 'registerAuto':
      //   this.popup_title = "Register Algorithm";
      //   console.log('registerAuto');
      //   break;
      case 'deleteAlgorithm':
        this.popup_title = "Delete Algorithm";
        console.log('deleteAlgorithm');
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
        break;
      case 'listAlgorithms':
        this.popup_title = "List Algorithms";
        console.log('listAlgorithms');
        break;
    }
    // console.log(this.fields);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);

    // if (this.popup_title == "registerAuto") {
    //   var msg = document.createElement("Label");
    //   msg.innerHTML = "Your Docker container must have cloned the repository in the following path: /app";
    //   this.node.appendChild(msg);
    // }

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // TODO enforce input types
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
          // set default values
          if (field in defaultValues) {
            fieldInput.value = defaultValues[field];
          }
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
        var fieldName = field[0];
        var fieldLabel = document.createElement("Label");
        fieldLabel.innerHTML = fieldName;
        this.node.appendChild(fieldLabel);

        fieldName = fieldName.toLowerCase();
        var fieldInput = document.createElement('input');
        fieldInput.id = (fieldName + '-input');
        fieldInput.classList.add(fieldName);
        this.node.appendChild(fieldInput);
      
        // newline
        var br = document.createElement("BR");
        this.node.appendChild(br);

        // add button
        var fieldAdd = document.createElement('button');
        fieldAdd.innerHTML = 'Add Run Input';
        fieldAdd.id = (fieldName + '-add');
        fieldAdd.name = fieldName;
        fieldAdd.addEventListener('click', (e:Event) => this.insertField(e), false);
        this.node.appendChild(fieldAdd);

        // newline
        var br = document.createElement("BR");
        this.node.appendChild(br);
      }
    }
    // console.log('done constructing');
  }

  // insertField(fieldName:string) {
  insertField(e:Event) {
    console.log('adding field '+fieldName);
    var fieldName = (<HTMLButtonElement>e.currentTarget).name;
    fieldName = fieldName.toLowerCase();
    var addbtn = document.getElementById(fieldName+'-add');
    var fieldInput = document.createElement('input');
    fieldInput.id = (fieldName + '-input');
    fieldInput.classList.add(fieldName);

     // insert newline & new input field before add button
    addbtn.parentNode.insertBefore(document.createElement("BR"),addbtn.previousSibling);
    addbtn.parentNode.insertBefore(fieldInput,addbtn.previousSibling);
    return;
  }

  setOldFields(old:{[k:string]:string}): void {
    console.log('setting fields');
    this.old_fields = old;
    // TODO enforce input types
  }

  // TODO: add jobs to response text
  updateJobCache(){
    // console.log(this.fields);
    if (this.req == 'execute') {
      this.jobs_panel.addJob('------------------------------');
      this.jobs_panel.addJob(this.response_text);
      for (var e of this.fields) {
        var fieldName = e[0].toLowerCase();
        console.log(fieldName);
        if (!['timestamp'].includes(fieldName)){
          var fieldText = this.ins_dict[fieldName];
          console.log(fieldText);
          this.jobs_panel.addJob("\t" + fieldName + " : " + fieldText);
        }
      }
      this.jobs_panel.addJob("inputs: ");
      this.jobs_panel.addJob("algo: " + this.old_fields["algo_id"]);
    }
  }

  updateSearchResults(): void {
    var me = this;
    // document.getElementById('search-text').innerHTML = this.response_text;
    // console.log(this.response_text);

    if (document.getElementById('result-text') != null){
      // console.log('using textarea');
      (<HTMLDivElement>document.getElementById('result-text')).innerHTML = "<pre>" + this.response_text + "</pre>";
    } else {
      // console.log('create textarea');
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
        // console.log(textarea);
      } else {
        var xml = "<root><content><p>"+this.response_text+"</p></content></root>";
        var options = {indentation: '  ', stripComments: true, collapseContent: false};
        var formattedXML = format(xml,options); 
        textarea.innerHTML = formattedXML;
        // console.log(formattedXML);
      }

      body.appendChild(textarea);
      popupResult(new WidgetResult(body,this),"Results");
    }
  }

  // helper to deepcopy aka rebuild URL because deepcopy is a pain rn
  buildCopyUrl(fieldName:string,fieldValue:string): URL {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);
    // only call when execute
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
        if (fieldName == field){
          getUrl.searchParams.append(field.toLowerCase(), fieldValue);
        } else {
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          this.ins_dict[field] = fieldText;
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }
      }
      getUrl.searchParams.append("inputs",new_input_list);
    }
    return getUrl;
  }

  buildRequestUrl() {
    var me:HySDSWidget = this;
    return new Promise<Array<URL>>((resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
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
        var range = false;
        var rangeField = "";
        var rangeFieldValue:string[] = [];

        for (var e of this.fields) {
          var field = e[0].toLowerCase();
          new_input_list = new_input_list.concat(field,',');
          // console.log(field);
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          // console.log(fieldText);

          // check for range in inputs
          // currently only support INTEGER range in SINGLE input field
          // expected format "range:1:10"
          if (fieldText.includes("range:")) {
            range = true;
            rangeField = field;
            rangeFieldValue = fieldText.split("range:")[1].split(":");
          }
          this.ins_dict[field] = fieldText;
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }
        console.log(new_input_list);
        getUrl.searchParams.append("inputs",new_input_list);

        if (range) {
          var start = Number(rangeFieldValue[0]);
          var last = Number(rangeFieldValue[1]);
          console.log(rangeFieldValue);
          // var len = last - start + 1;
          for (var i = start; i <= last; i++) {
            var multiUrl = this.buildCopyUrl(rangeField,String(i));
            // console.log(multiUrl);
            // const build = new Promise<void>((resolve, reject) => { getUrl.searchParams.set(rangeField,String(i)); resolve(); });
            // build.then(() => {
            // multiUrl.searchParams.set(rangeField,String(i))
            console.log(multiUrl.href);
            urllst.push(multiUrl);
            // });
          }
          resolve(urllst);
        } else {
          urllst.push(getUrl);
          resolve(urllst);
        }

      // for getting notebook info with auto register
      } else if (me.req == 'registerAuto') {
        resolve(urllst);

      // Get Notebook information to pass to Register Handler
      } else if (me.req == 'register') {
        resolve(urllst);

      // for all other requests
      } else {
        // console.log(this.req+'!!!!');
        for (var field of this.fields) {
          if (field == "inputs") {
            var fieldText = (<HTMLTextAreaElement>document.getElementById(field.toLowerCase()+'-input')).value;
            // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
            getUrl.searchParams.append(field.toLowerCase(), fieldText);
          } else {
            var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
            // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
            getUrl.searchParams.append(field.toLowerCase(), fieldText);
          }
        }
        urllst.push(getUrl);
        resolve(urllst);
      }

    });
  }

  sendRequest(urllst:Array<URL>) {
    this.response_text = '';
    for (var ind in urllst){
      var getUrl = urllst[ind];
      console.log('sending');
      console.log(getUrl.href);
      var me:HySDSWidget = this;
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
              var exec = new HySDSWidget('execute',new_fields, me.jobs_panel,{});
              exec.setOldFields(old_fields);
              popup(exec);
              // console.log('post-popup');
            } else {
              me.response_text = json_response['result'];
              me.updateSearchResults();
              // console.log("updating");
            }
          } else {
            me.response_text = "Error Getting Inputs Required.";
            me.updateSearchResults();
            // console.log("updating");
          }
        });
      // if set result text to response
      } else if ( !(notImplemented.includes(me.req) )){
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            me.response_text = me.response_text + '\n' + json_response['result'];
          } else {
            me.response_text = "Error Sending Request.";
          }
          console.log("updating");
          me.updateSearchResults();
        });
      } else {
        console.log("not implemented yet");
      }
    }
    return;
  }

  // submit the job
  // overrides the resolution of popup dialog
  getValue(): void {
    this.buildRequestUrl().then((url) => {
      // console.log('then');
      console.log(url);
      this.sendRequest(url);
    });
  }
}

class WidgetResult extends Widget {
  // pass HySDSWidget which contains info panel
  public parentWidget: HySDSWidget;

  constructor(b: any,parent:HySDSWidget) {
    super({node: b});
    this.parentWidget = parent;
  }

  // update panel text on resolution of result popup
  getValue() {
    this.parentWidget.updateJobCache();
  }
}

class DialogEnter<T> extends Dialog<T> {
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

function showDialog<T>(
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
    popupResult("Not Implemented yet","Not Implemented yet")
  }
}

export function popupResult(b:any,popup_title:string): void {
  showDialog({
    title: popup_title,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}
