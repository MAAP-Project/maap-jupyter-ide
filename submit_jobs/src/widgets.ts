import { Widget } from '@phosphor/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { INotification } from "jupyterlab_toastify";
import { getUserInfo } from "./getKeycloak";
import { request, RequestResult } from './request';
import { JobCache } from './panel';
import { popupResult } from "./dialogs";
// import * as $ from "jquery";
// import { format } from "xml-formatter";

// -----------------------
// HySDS stuff
// -----------------------
const nonXML: string[] = ['deleteAlgorithm','listAlgorithms','registerAuto','getResult','executeInputs','getStatus','execute','describeProcess','getCapabilities','register', 'delete','dismiss'];
const autoUpdate: string[] = ['execute','delete','dismiss'];
const notImplemented: string[] = [];
export class InputWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public readonly popupTitle: string;
  public responseText: string;
  public predefinedFields: {[k:string]:string}; // store predefined fields
  public readonly fields: string[];       // user inputs
  public readonly getInputs: boolean;    // for getting predefinedFields
  public username: string;                // for execute & listing jobs in case of timeout
  jobsPanel: JobCache;    // for execute
  ins_dict: {[k:string]:string};          // for execute

  constructor(req:string, method_fields:string[],uname:string, panel:JobCache, defaultValues:{[k:string]:string}) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    super({node: body});

    // set username on start
    // callback should finish before users manage to do anything
    // now profile timing out shouldn't be a problem
    let me = this;
    getUserInfo(function(profile: any) {
      if (profile['cas:username'] === undefined) {
        INotification.error("Get username failed.");
        me.username = 'anonymous';
      } else {
        me.username = profile['cas:username'];
        INotification.success("Got username.");
      }
    });

    // Default text
    this.req = req;
    this.responseText = "";
    this.predefinedFields = {};
    this.fields = method_fields;
    this.getInputs = false;
    this.jobsPanel = panel;
    this.ins_dict = {};

    switch (req) {
      case 'register':
        this.popupTitle = "Register Algorithm";
        console.log('register');
        break;
      // case 'deleteAlgorithm':
      //   this.popupTitle = "Delete Algorithm";
      //   this.getInputs = true;
      //   console.log('deleteAlgorithm');
      //   break;
      // case 'describeProcess':
      //   this.popupTitle = "Describe Process";
      //   this.getInputs = true;
      //   console.log('describeProcess');
      //   break;
      // case 'executeInputs':
      //   this.popupTitle = "Execute Job";
      //   this.getInputs = true;
      //   console.log('executeInputs');
      //   break;
      case 'execute':
        this.popupTitle = "Execute Job - Provide Inputs";
        this.getInputs = true;
        console.log('execute');
        break;
      case 'getStatus':
        this.popupTitle = "Get Job Status";
        console.log('getStatus');
        break;
      case 'getResult':
        this.popupTitle = "Get Job Result";
        console.log('getResult');
        break;
      case 'dismiss':
        this.popupTitle = "Dismiss Job";
        console.log('dismiss');
        break;
      case 'delete':
        this.popupTitle = "Delete Job";
        console.log('delete');
        break;
    }
    // console.log(this.fields);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);

    // skip 1st popup if nothing to fill out
    if (this.fields.length == 0) {
      return;
    }

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // TODO enforce input types
    // Construct labels and inputs for fields
    if (! this.getInputs && this.req != 'describeProcess' && this.req != 'deleteAlgorithm') {
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
      
        // // newline
        // var br = document.createElement("BR");
        // this.node.appendChild(br);

        // // add button
        // var fieldAdd = document.createElement('button');
        // fieldAdd.innerHTML = 'Add Run Input';
        // fieldAdd.id = (fieldName + '-add');
        // fieldAdd.name = fieldName;
        // fieldAdd.addEventListener('click', (e:Event) => this.insertField(e), false);
        // this.node.appendChild(fieldAdd);

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
    this.predefinedFields = old;
    // TODO enforce input types
  }

  // TODO: add jobs to response text
  updateJobCache(){
    this.jobsPanel.update();
  }

  updateSearchResults(): void {
    // var me = this;
    // document.getElementById('search-text').innerHTML = this.responseText;
    // console.log(this.responseText);

    if (document.getElementById('result-text') != null){
      // console.log('using textarea');
      (<HTMLDivElement>document.getElementById('result-text')).innerHTML = "<pre>" + this.responseText + "</pre>";
    } else {
      // console.log('create textarea');
      // let body = document.createElement('div');
      // body.style.display = 'flex';
      // body.style.flexDirection = 'column';

      // var textarea = document.createElement("div");
      // textarea.id = 'result-text';
      // textarea.style.display = 'flex';
      // textarea.style.flexDirection = 'column';
      // var format = require('xml-formatter');
      // // var xml = "<pre>" + this.responseText + "</pre>";

      // if ( nonXML.includes(me.req) ){ 
      //   textarea.innerHTML = "<pre>" + this.responseText + "</pre>";
      //   // console.log(textarea);
      // } else {
      //   var xml = "<root><content><p>"+this.responseText+"</p></content></root>";
      //   var options = {indentation: '  ', stripComments: true, collapseContent: false};
      //   var formattedXML = format(xml,options); 
      //   textarea.innerHTML = formattedXML;
      //   // console.log(formattedXML);
      // }

      // body.appendChild(textarea);
      popupResultText(this.responseText,this.jobsPanel,autoUpdate.includes(this.req),"Results",(!nonXML.includes(this.req)));

    }
  }

  // helper to deepcopy aka rebuild URL for execute because deepcopy is a pain rn
  buildCopyUrl(fieldName:string,fieldValue:string): URL {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);
    // only call when passed inputs not provided by user
    if (this.getInputs) {
      // filling out algo info (id, version)
      for (let key in this.predefinedFields) {
        var fieldText = this.predefinedFields[key].toLowerCase();
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
      getUrl.searchParams.append('username',this.username);
      console.log('added username '+fieldValue);
      // console.log(getUrl.href);
    }
    return getUrl;
  }

  buildRequestUrl() {
    var me:InputWidget = this;
    return new Promise<Array<URL>>(async (resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // filling out old fields, currently for algo info (id, version) in execute & describe & delete
      if (this.getInputs) {
        for (let key in this.predefinedFields) {
          var fieldText = this.predefinedFields[key].toLowerCase();
          getUrl.searchParams.append(key.toLowerCase(), fieldText);
        }
      }

      // for calling execute after getting user inputs
      if (this.req == 'execute') {
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

        // if multiple runs over one input
        if (range) {
          var start = Number(rangeFieldValue[0]);
          var last = Number(rangeFieldValue[1]);
          console.log(rangeFieldValue);
          // var len = last - start + 1;
          for (var i = start; i <= last; i++) {
            let multiUrl = this.buildCopyUrl(rangeField,String(i));
            console.log(multiUrl.href);
            urllst.push(multiUrl);
          }
          resolve(urllst);

        // just 1 job
        } else {
          // add username
          getUrl.searchParams.append('username',this.username);
          console.log('added username');
          console.log(getUrl.href);
          urllst.push(getUrl);
          resolve(urllst);
        }

      // Get Notebook information to pass to Register Handler
      // } else if (me.req == 'describeProcess' || me.req == 'executeInputs' || me.req == 'deleteAlgorithm') {
      //   console.log(getUrl.href);
      //   urllst.push(getUrl);
      //   resolve(urllst);
      } else if (me.req == 'register') {
        resolve(urllst);

      // for all other requests
      } else {
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
        console.log(getUrl.href);
        urllst.push(getUrl);
        resolve(urllst);
      }

    });
  }

  sendRequest(urllst:Array<URL>) {
    this.responseText = '';
    for (var ind in urllst){
      var getUrl = urllst[ind];
      console.log('sending');
      console.log(getUrl.href);
      var me:InputWidget = this;
      // Send Job as Request
      // if just got inputs for execute, new popup to fill out input fields
      // if (me.req == 'executeInputs') {
      //   request('get', getUrl.href).then((res: RequestResult) => {
      //     if(res.ok){
      //       // let json_response:any = res.json();
      //       // console.log(json_response['status_code']);
      //       // console.log(json_response['result']);

      //       if (json_response['status_code'] == 200){
      //         // console.log(json_response['ins']);
      //         // var new_fields = [...executeInputsFields, ...json_response['ins']];
      //         var new_fields = json_response['ins'];
      //         var predefinedFields = json_response['old'];
      //         // console.log(new_fields);
      //         // console.log('pre-popup');
      //         var exec = new InputWidget('execute',new_fields,me.username,me.jobsPanel,{});
      //         exec.setOldFields(predefinedFields);
      //         popup(exec);
      //         // console.log('post-popup');
      //       } else {
      //         me.responseText = json_response['result'];
      //         me.updateSearchResults();
      //         // console.log("updating");
      //       }
      //     } else {
      //       me.responseText = "Error Getting Inputs Required.";
      //       me.updateSearchResults();
      //       // console.log("updating");
      //     }
      //   });
      // if set result text to response
      // } else if ( !(notImplemented.includes(me.req) )){
      if ( !(notImplemented.includes(me.req) )){
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            // console.log(json_response);
            me.responseText = me.responseText + '\n' + json_response['result'];
          } else {
            me.responseText = "Error Sending Request.";
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
      console.log(url);
      this.sendRequest(url);
    });
  }
}

export class RegisterWidget extends InputWidget {

  // TODO: protect instance vars
  // public readonly req: string;
  // public readonly popupTitle: string;

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
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);

      // default values not exposed to user set here,  along with algo name and version
      for (let key in this.predefinedFields) {
        if (! (key in this.fields)) {
          var fieldText = this.predefinedFields[key].toLowerCase();
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

export class WidgetResult extends Widget {
  // pass InputWidget which contains info panel
  cache: JobCache;
  updateCache: boolean;

  constructor(b: any, cache: JobCache, updateCache: boolean) {
    super({node: b});
    this.cache = cache;
    this.updateCache = updateCache;
  }

  // update panel text on resolution of result popup
  getValue() {
    if (this.updateCache) {
      this.cache.update();
    }
    // if (this.parentWidget.req == 'execute' || this.parentWidget.req == 'delete' || this.parentWidget.req == 'dismiss') {
    //   this.parentWidget.updateJobCache();
    // }
  }
}

// here because import dependencies of JobCache(panel.ts),popupResult(dialog.ts), WidgetResult(widget.ts)
export function popupResultText(result:string,cache:JobCache,update:boolean,title:string,isXML?:boolean) {
  let body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';

  var textarea = document.createElement("div");
  textarea.id = 'result-text';
  textarea.style.display = 'flex';
  textarea.style.flexDirection = 'column';
  var format = require('xml-formatter');

  if ( isXML == undefined || (! isXML) ){ 
    textarea.innerHTML = "<pre>" + result + "</pre>";
    // console.log(textarea);
  } else {
    var xml = "<root><content><p>"+result+"</p></content></root>";
    var options = {indentation: '  ', stripComments: true, collapseContent: false};
    var formattedXML = format(xml,options); 
    textarea.innerHTML = formattedXML;
    // console.log(formattedXML);
  }

  body.appendChild(textarea);
  popupResult(new WidgetResult(body,cache,update),title);
}