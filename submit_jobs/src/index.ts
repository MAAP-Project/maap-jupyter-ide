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
  public response_text: string;
  public fields: string[];

  constructor() {
    super();
     // Default text
    this.response_text = "";
    this.fields = ['Title', 'Identifier', 'Metadata'];

    // bind method definitions of "this" to refer to class instance
    this.sendJob = this.sendJob.bind(this);
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

  sendJob() {
    // var me = this;
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/submit');

    for (var field of this.fields) {
      var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
      if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
    }

    console.log(getUrl.href);

    // Send Job as Request
    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", getUrl.href, true);

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

export function activate(app: JupyterLab, 
                        palette: ICommandPalette, 
                        restorer: ILauncher | null): void{
  
  // add application command
  const open_command = 'hysds: submit-job';

  app.commands.addCommand(open_command, {
    label: 'Submit Job to DPS',
    isEnabled: () => true,
    execute: args => {
      popup(new HySDSWidget());
    }
  });

  palette.addItem({command: open_command, category: 'DPS'});

  console.log('HySDS Job Submit is activated!');

  // add as side panel
  // var infoPanel = new HySDSWidget();
  // infoPanel.id = 'submit-job';
  // infoPanel.title.label = 'Submit Job';
  // infoPanel.title.caption = 'submit job to HySDS';

  // app.shell.addToLeftArea(infoPanel, {rank:300});
}

// export extensions
const extension: JupyterLabPlugin<void> = {
  id: 'submit-job',
  autoStart: true,
  requires: [ ICommandPalette],
  optional: [ILauncher],
  activate: activate
};

export default extension;
