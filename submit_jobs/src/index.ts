import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
import { Widget } from '@phosphor/widgets';
import { ICommandPalette, Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { ILauncher } from '@jupyterlab/launcher';
import { request, RequestResult } from './request';
// import * as $ from "jquery";
// import { format } from "xml-formatter";
import * as data from './fields.json';

const registerFields = data.register;
const getCapabilitiesFields = data.getCapabilities;
const executeFields = data.execute;
const getStatusFields = data.getStatus;
const getResultFields = data.getResult;
const dismissFields = data.dismiss;
const describeProcessFields = data.describeProcess;
// const resultFields: string[] = ['status_code', 'result'];
const notImplemented: string[] = ['dismiss','getResult'];
const nonXML: string[] = ['getStatus','execute','describeProcess','getCapabilities','register'];

// -----------------------
// HySDS stuff
// -----------------------
class HySDSWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public readonly popup_title: string;
  public response_text: string;
  public readonly fields: string[];

  constructor(req:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    super({node: body});

     // Default text
    this.response_text = "";
    this.req = req;

    switch (req) {
      case 'register':
        this.popup_title = "Register Algorithm";
        this.fields = registerFields;
        console.log('register');
        break;
      case 'getCapabilities':
        this.popup_title = "Get List of Capabilities";
        this.fields = getCapabilitiesFields; // no params
        console.log('getCapabilities');
        break;
      case 'getStatus':
        this.popup_title = "Get Job Status";
        this.fields = getStatusFields;
        console.log('getStatus');
        break;
      case 'getResult':
        this.popup_title = "Get Job Result";
        this.fields = getResultFields;
        console.log('getResult');
        break;
      case 'execute':
        this.popup_title = "Execute Job";
        this.fields = executeFields;
        console.log('execute');
        break;
      case 'dismiss':
        this.popup_title = "Dismiss Job";
        this.fields = dismissFields;
        console.log('dismiss');
        break;
      case 'describeProcess':
        this.popup_title = "Describe Process";
        this.fields = describeProcessFields;
        console.log('describeProcess');
    }
    console.log(this.fields);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);

    // list all the fields of the job

    // ************ Search granule fields ********** //
    // Display search query result
    var title = document.createElement('div');
    title.innerHTML = this.popup_title+"\n";
    this.node.appendChild(title);

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // Construct labels and inputs for fields
    for (var field of this.fields) {
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
      popupResult(new WidgetResult(body));
    }
  }

  // submit the job
  // overrides the resolution of popup dialog
  getValue() {
    var me = this;

    // create API call to server extension
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

    for (var field of this.fields) {
      var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
      if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
    }

    console.log(getUrl.href);

    // Send Job as Request
    if ( !(notImplemented.includes(me.req) )){
      request('get', getUrl.href).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          // me.response_text = json_response;
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
}

class WidgetResult extends Widget {
  constructor(b: any) {
    super({node: b});
  }
}

export function showDialog<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new Dialog(options);
  dialog.launch();
  // setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:any): void {
  if ( !(notImplemented.includes(b.req) )){ 
    showDialog({
      title: 'Submit Request:',
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

export function activateRegister(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: register';

  app.commands.addCommand(open_command, {
    label: 'Register Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('register'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Register Algorithm is activated!');
}
export function activateGetCapabilities(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-capabilities';

  app.commands.addCommand(open_command, {
    label: 'Get Capabilities',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getCapabilities'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Capabilities is activated!');
}
export function activateGetStatus(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{  
  const open_command = 'hysds: get-status';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Status',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getStatus'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Status is activated!');
}
export function activateGetResult(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-result';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Job Result',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('getResult'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Get Job Result is activated!');
}
export function activateExecute(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: execute-job';

  app.commands.addCommand(open_command, {
    label: 'Execute DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('execute'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Execute Job is activated!');
}
export function activateDismiss(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: dismiss-job';

  app.commands.addCommand(open_command, {
    label: 'Dismiss DPS Job',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('dismiss'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Dismiss Job is activated!');
}
export function activateDescribe(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: describe-job';

  app.commands.addCommand(open_command, {
    label: 'Describe Algorithm',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget('describeProcess'));
    }
  });
  palette.addItem({command: open_command, category: 'DPS'});
  console.log('HySDS Describe Job is activated!');
}

// export extensions
const extensionRegister: JupyterLabPlugin<void> = {
  id: 'dps-register',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateRegister
};
const extensionCapabilities: JupyterLabPlugin<void> = {
  id: 'dps-capabilities',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetCapabilities
};
const extensionStatus: JupyterLabPlugin<void> = {
  id: 'dps-job-status',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetStatus
};
const extensionResult: JupyterLabPlugin<void> = {
  id: 'dps-job-result',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetResult
};
const extensionExecute: JupyterLabPlugin<void> = {
  id: 'dps-job-execute',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateExecute
};
const extensionDismiss: JupyterLabPlugin<void> = {
  id: 'dps-job-dismiss',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDismiss
};
const extensionDescribe: JupyterLabPlugin<void> = {
  id: 'dps-job-describe',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDescribe
};

export default [extensionRegister,extensionCapabilities,extensionStatus,extensionResult,extensionExecute,extensionDismiss,extensionDescribe];
