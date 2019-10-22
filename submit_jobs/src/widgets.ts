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
// HySDS endpoints that require user inputs
// -----------------------
const nonXML: string[] = ['deleteAlgorithm','listAlgorithms','registerAuto','getResult','executeInputs','getStatus','execute','describeProcess','getCapabilities','register', 'delete','dismiss'];
const autoUpdate: string[] = ['execute','delete','dismiss'];
const notImplemented: string[] = [];

export class InputWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public popupTitle: string;
  public predefinedFields: Object; // store predefined fields (default values)
  public readonly fields: string[];       // user inputs to fill out
  public username: string;                // for execute & listing jobs in case of timeout
  _responseText: string;
  _getInputs: boolean;                    // for getting predefinedFields
  _jobsPanel: JobCache;                   // for execute
  _ins_dict: {[k:string]:string};          // for execute

  constructor(req:string, method_fields:string[],uname:string, panel:JobCache, defaultValues:Object,skipInputs?:boolean) {
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
    this.predefinedFields = {};
    this.fields = method_fields;
    this._responseText = "";
    this._getInputs = false;
    this._jobsPanel = panel;
    this._ins_dict = {};

    switch (req) {
      case 'register':
        this.popupTitle = "Register Algorithm";
        console.log('register');
        break;
      case 'execute':
        this.popupTitle = "Execute Job - Provide Inputs";
        this._getInputs = true;
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
    this._buildRequestUrl = this._buildRequestUrl.bind(this);

    // skip 1st popup if nothing to fill out
    if (this.fields.length == 0) {
      return;
    }

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    if (skipInputs == undefined || skipInputs == false) {
      // TODO enforce input types
      // Construct labels and inputs for fields
      for (var field of this.fields) {
        var fieldName = field[0];
        if (fieldName != 'inputs') {
          var fieldLabel = document.createElement("Label");
          fieldLabel.innerHTML = fieldName;
          this.node.appendChild(fieldLabel);
  
          fieldName = fieldName.toLowerCase();
          var fieldInput = document.createElement('input');
          fieldInput.id = (fieldName + '-input');
          fieldInput.classList.add(fieldName);
          if (field in defaultValues) {
            fieldInput.value = defaultValues[field] as string;
          }
          this.node.appendChild(fieldInput);
        
          // // newline
          // var br = document.createElement("BR");
          // this.node.appendChild(br);
  
          // // add button
          // var fieldAdd = document.createElement('button');
          // fieldAdd.innerHTML = 'Add Run Input';
          // fieldAdd.id = (fieldName + '-add');
          // fieldAdd.name = fieldName;
          // fieldAdd.addEventListener('click', (e:Event) => this._insertField(e), false);
          // this.node.appendChild(fieldAdd);
  
          // newline
          var br = document.createElement("BR");
          this.node.appendChild(br);
        }
      }
      // console.log('done constructing');
    }
  }

  // _insertField(fieldName:string) {
  _insertField(e:Event) {
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

  setOldFields(old:Object): void {
    console.log('setting fields');
    this.predefinedFields = old;
    // TODO enforce input types
  }

  updateJobCache(){
    this._jobsPanel.update();
  }

  updateSearchResults(): void {
    // document.getElementById('search-text').innerHTML = this._responseText;
    if (document.getElementById('result-text') != null){
      // console.log('using textarea');
      (<HTMLDivElement>document.getElementById('result-text')).innerHTML = "<pre>" + this._responseText + "</pre>";
    } else {
      // console.log('create textarea');
      popupResultText(this._responseText,this._jobsPanel,autoUpdate.includes(this.req),"Results",(!nonXML.includes(this.req)));
    }
  }

  // helper to deepcopy aka rebuild URL for execute because deepcopy is a pain rn
  buildCopyUrl(fieldName:string,fieldValue:string): URL {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);
    // only call when passed inputs not provided by user
    if (this._getInputs) {
      // filling out algo info (id, version)
      for (let key in this.predefinedFields) {
        var fieldText = (this.predefinedFields[key] as string).toLowerCase();
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
          this._ins_dict[field] = fieldText;
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

  _buildRequestUrl() {
    var me:InputWidget = this;
    return new Promise<Array<URL>>(async (resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // filling out old fields, currently for algo info (id, version) in execute & describe & delete
      if (this._getInputs) {
        for (let key in this.predefinedFields) {
          var fieldText = (this.predefinedFields[key] as string).toLowerCase();
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
          this._ins_dict[field] = fieldText;
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

  _sendRequest(urllst:Array<URL>) {
    this._responseText = '';
    for (var ind in urllst){
      var getUrl = urllst[ind];
      console.log(getUrl.href);
      var me:InputWidget = this;
      // Send Job as Request
      // set result text to response
      if ( !(notImplemented.includes(me.req) )){
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            // console.log(json_response);
            me._responseText = me._responseText + '\n' + json_response['result'];
          } else {
            me._responseText = "Error Sending Request.";
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
    this._buildRequestUrl().then((url) => {
      console.log(url);
      this._sendRequest(url);
    });
  }
}

export class RegisterWidget extends InputWidget {

  constructor(method_fields:string[],uname:string,panel:JobCache,defaultValues:Object,subtext?:string) {
    super('register', method_fields,uname,panel,defaultValues,true);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this._buildRequestUrl = this._buildRequestUrl.bind(this);

    if (subtext != undefined) {
      let subtxt = document.createElement('div');
      subtxt.id = 'register-subtext';
      subtxt.style.display = 'flex';
      subtxt.style.flexDirection = 'column';
      subtxt.innerHTML = subtext;
      this.node.appendChild(subtxt);
    }

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

        // show input names and dl
        console.log('default values');
        console.log(defaultValues);
        let ins = ''
        for (var itm of (defaultValues['inputs'] as Array<{[k:string]:string}>)) {
          ins = ins+itm['name'];
          if (itm['download']) {
            ins = ins+' (download)';
          } else {
            ins = ins+' (no download)';
          }
          ins = ins+'\n';
        }
        fieldInputs.value = ins;
        this.node.appendChild(fieldInputs);
      
        // BREAK
        var x = document.createElement("BR");
        this.node.appendChild(x)
      } else {
        var fieldLabel = document.createElement("Label");
        fieldLabel.innerHTML = field;
        this.node.appendChild(fieldLabel);

        var fieldInput = document.createElement('input');
        fieldInput.id = (field.toLowerCase() + '-input');
        // set default values
        if (field in defaultValues) {
          fieldInput.value = defaultValues[field] as string;
        }
        fieldInput.readOnly = true;
        this.node.appendChild(fieldInput);
      
        // BREAK
        var x = document.createElement("BR");
        this.node.appendChild(x)
      }
    }
  }

  _buildRequestUrl() {
    // var me:RegisterWidget = this;
    return new Promise<Array<URL>>((resolve, reject) => {
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);

      // default values not exposed to user set here,  along with algo name and version
      for (let key in this.predefinedFields) {
        if (! (key in this.fields)) {
          var fieldText = (this.predefinedFields[key] as string).toLowerCase();
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

  // console.log(result);
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
  // console.log(body);
  popupResult(new WidgetResult(body,cache,update),title);
}
