import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, Clipboard, showDialog, Dialog
} from '@jupyterlab/apputils';

import {
  PageConfig
} from '@jupyterlab/coreutils'

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@phosphor/widgets';

import {
  Widget
} from '@phosphor/widgets';

// import { MimeData } from '@phosphor/coreutils';

import {
  request, RequestResult
} from './request';

import * as $ from "jquery";

import '../style/index.css';

let unique = 0;
// let searchParamURL = "test";
let params:any = {};

const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_iframe',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu],
  activate: activate
};

class IFrameWidget extends Widget {

  constructor(path: string) {
    super();
    this.id = path + '-' + unique;
    unique += 1;

    this.title.label = "Earthdata Search";
    this.title.closable = true;

    let div = document.createElement('div');
    div.classList.add('iframe-widget');
    let iframe = document.createElement('iframe');
    iframe.id = "iframeid"

    console.log("Path is,", path);
    // TODO proxy path if necessary
    request('get', path).then((res: RequestResult) => {
      if (res.ok){
        console.log('site accesible: proceeding');
        iframe.src = path;
      } else {
        iframe.setAttribute('baseURI', PageConfig.getBaseUrl());

        console.log('site failed with code ' + res.status.toString());
        if(res.status == 404){

        } else if(res.status == 401){

        } else {
          console.log('setting proxy');
          path = "iframes/proxy/" + path;
          iframe.src = path;
        }
      }
    });

    let copyQueryBtn = document.createElement('button');
    copyQueryBtn.id = "copyBtn";
    // copyBtn.className = "btn";
    copyQueryBtn.innerHTML = "Copy Search Query";
    copyQueryBtn.addEventListener('click', copySearchQuery, false);
    this.node.appendChild(copyQueryBtn);

    let copyResultsBtn = document.createElement('button');
    copyResultsBtn.id = "copyBtn";
    // copyBtn.className = "btn";
    copyResultsBtn.innerHTML = "Copy Search Results";
    copyResultsBtn.addEventListener('click', copySearchResults, false);
    this.node.appendChild(copyResultsBtn);

    let viewParamsBtn = document.createElement('button');
    viewParamsBtn.id = "copyBtn";
    // copyBtn.className = "btn";
    viewParamsBtn.innerHTML = "View current search parameters";
    viewParamsBtn.addEventListener('click', displaySearchParams, false);
    this.node.appendChild(viewParamsBtn);


    div.appendChild(iframe);
    this.node.appendChild(div);

  }
};

export 
class ParamsPopupWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = "<pre>" + JSON.stringify(params, null, " ") + "</pre>";
    //let contents = document.createTextNode(JSON.stringify(params, null, " "));
    //body.appendChild(contents);

    super({ node: body });
  }

}

function copySearchQuery() {

  var getUrl = new URL(PageConfig.getBaseUrl() + 'iframes/getQuery');
  getUrl.searchParams.append("json_obj", JSON.stringify(params));

  // Make call to back end
  var xhr = new XMLHttpRequest();

  xhr.onload = function() {
      let response:any = $.parseJSON(xhr.response);
      console.log(response);
      let response_text:any = response.query_string;
      if (response_text == "" ) { response_text = "No results found."; }
      console.log(response_text);
      Clipboard.copyToSystem(response_text);
  }

  xhr.open("GET", getUrl.href, true);
  xhr.send(null);
}


function copySearchResults() {
  // Construct url to hit backend
  var getUrl = new URL(PageConfig.getBaseUrl() + 'iframes/getGranules');
  getUrl.searchParams.append("json_obj", JSON.stringify(params));


  // Make call to back end
  var xhr = new XMLHttpRequest();

  xhr.onload = function() {
      let response:any = $.parseJSON(xhr.response);
      let response_text:any = response.granule_urls;
      if (response_text == "" ) { response_text = "No results found."; }
      console.log(response_text);
      Clipboard.copyToSystem(response_text);
  }

  xhr.open("GET", getUrl.href, true);
  xhr.send(null);
}


function displaySearchParams() {
  showDialog({
        title: 'Current Search Parameters:',
        body: new ParamsPopupWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });

}


function activate(app: JupyterLab, docManager: IDocumentManager, palette: ICommandPalette, restorer: ILayoutRestorer, mainMenu: IMainMenu) {

  let widget: IFrameWidget;

  // Listen for messages being sent by the iframe
  window.addEventListener("message", (event: MessageEvent) => {
    params = event.data;
    console.log("at event listen: ", event.data);
  });

  // const toolbar = new Toolbar();
  // toolbar.id = 'ESDS-TOOLBAR-1'
  // toolbar.addItem(
  //     'Copy search Query',
  //     new ToolbarButton({
  //       iconClassName: 'jp-RefreshIcon jp-Icon jp-Icon-16',
  //       onClick: () => {
  //         copySearchQuery();
  //       },
  //       tooltip: 'Copy Search Query'
  //     })
  //   );

  // const panel = new BoxPanel();
  // panel.id = 'main';
  // panel.direction = 'top-to-bottom';
  // panel.spacing = 0;
  // panel.addWidget(toolbar);
  // Widget.attach(panel, window);

  // Add an application command to open ESDS
  const open_command = 'iframe:open';
  app.commands.addCommand(open_command, {
    label: 'Open EarthData Search',
    isEnabled: () => true,
    execute: args => {
      widget = new IFrameWidget('https://ade.maap-project.org:3052/search');
      app.shell.addToMainArea(widget);
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({command: open_command, category: 'Search'});

  // Add copy commands to the command palette
  app.commands.addCommand('search:copyQuery', {
    label: 'Copy Search Query To Clipboard',
    isEnabled: () => true,
    execute: args => {
      copySearchQuery();
    }
  });
  palette.addItem({command: 'search:copyQuery', category: 'Search'});


  app.commands.addCommand('search:copyResult', {
    label: 'Copy Search Result To Clipboard',
    isEnabled: () => true,
    execute: args => {
      copySearchResults();
    }
  });
  palette.addItem({command: 'search:copyResult', category: 'Search'});

  app.commands.addCommand('search:displayParams', {
    label: 'Display selected search parameters',
    isEnabled: () => true,
    execute: args => {
      displaySearchParams();
    }
  });
  palette.addItem({command: 'search:displayParams', category: 'Search'});

  const { commands } = app;
  let searchMenu = new Menu({ commands })
  searchMenu.title.label = 'Data Search';
  [
    open_command,
    'search:copyQuery',
    'search:copyResult',
    'search:displayParams'
  ].forEach(command => {
    searchMenu.addItem({ command });
  });
  mainMenu.addMenu(searchMenu, { rank: 100 });



  console.log('JupyterLab extension jupyterlab_iframe is activated!');
};


export default extension;
export {activate as _activate};