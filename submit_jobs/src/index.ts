import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';
import { Widget } from '@phosphor/widgets';
import { ICommandPalette, Dialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { ILauncher } from '@jupyterlab/launcher';
// import * as $ from "jquery";

// -----------------------
// HySDS stuff
// -----------------------
class HySDSWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public response_text: string;
  public fields: string[];

  constructor(req:string) {
    super();
     // Default text
    this.response_text = "";
    this.req = req;

    switch (req) {
      case 'getCapabilities':
        console.log('getCapabilities');
        break;
      case 'getStatus':
        console.log('getStatus');
        break;
      case 'getResult':
        console.log('getResult');
        break;
      case 'execute':
        this.fields = ['Title', 'Identifier', 'Metadata'];
        console.log('execute');
        break;
      case 'dismiss':
        console.log('dismiss');
        break;
    }

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);

    // list all the fields of the job

    // ************ Search granule fields ********** //
    // Display search query result
    var granuleInfo = document.createElement('granule-info');
    granuleInfo.innerHTML = "Submit Job to DPS\n";
    this.node.appendChild(granuleInfo);

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

    // let graunuleBtn = document.createElement('button');
    // graunuleBtn.id = "SearchCMRGranule";
    // graunuleBtn.className = "btn";
    // graunuleBtn.innerHTML = "Search";
    // graunuleBtn.addEventListener('click', this.sendJob, false);
    // this.node.appendChild(graunuleBtn);

  }

  updateSearchResults(): void {
    // document.getElementById('search-text').innerHTML = this.response_text;

    if (document.getElementById('result-text') != null){
      (<HTMLTextAreaElement>document.getElementById('result-text')).value = this.response_text;
    } else {
      var textarea = document.createElement("TEXTAREA");
      textarea.id = 'result-text';
      (<HTMLTextAreaElement>textarea).readOnly = true;
      (<HTMLTextAreaElement>textarea).cols = 40;
      (<HTMLTextAreaElement>textarea).rows = 50;
      (<HTMLTextAreaElement>textarea).value = this.response_text;
      this.node.appendChild(textarea);
    }
  }

  // submit the job
  // overrides the resolution of popup dialog
  getValue() {
    // var me = this;
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

    for (var field of this.fields) {
      var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
      if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
    }

    console.log(getUrl.href);
    // console.log('show url?');

    // Send Job as Request
    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", getUrl.href, true);

    // Handle Request Result
    // xhr.onload = function() {
    //   let response = $.parseJSON(xhr.response);
    //   me.response_text = response.granule_urls;
    //   if (me.response_text == "" ) { me.response_text = "No results found."; }
    //   me.updateSearchResults();
    // }

    // xhr.send(null);
    return;
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
  showDialog({
    title: 'Submit Job:',
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({ label : 'Cancel'})]
  });
}

export function activateGetCapabilities(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  const open_command = 'hysds: get-capabilities';

  app.commands.addCommand(open_command, {
    label: 'Get DPS Capabilities',
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

// export extensions
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

export default [extensionCapabilities,extensionStatus,extensionResult,extensionExecute,extensionDismiss];
