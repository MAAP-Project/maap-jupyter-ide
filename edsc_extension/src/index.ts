import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, Clipboard, Dialog, showDialog//, ToolbarButton
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

import {
    NotebookActions, NotebookPanel, INotebookTracker
} from '@jupyterlab/notebook';

import { ReadonlyJSONObject } from '@phosphor/coreutils';

import {
  request, RequestResult
} from './request';

import * as $ from "jquery";

import '../style/index.css';

let unique = 0;
// let searchParamURL = "test";
let params:any = {};
let limit = "1000";

const extension: JupyterLabPlugin<void> = {
  id: 'edsc_extension',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, INotebookTracker],
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
    iframe.id = "iframeid";

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
          path = "edsc/proxy/" + path;
          iframe.src = path;
        }
      }
    });

    let copyQueryBtn = document.createElement('button');
    copyQueryBtn.id = "copyBtn";
    copyQueryBtn.className = "btn";
    copyQueryBtn.innerHTML = "Copy Search Query";
    copyQueryBtn.addEventListener('click', copySearchQuery, false);
    this.node.appendChild(copyQueryBtn);

    let copyResultsBtn = document.createElement('button');
    copyResultsBtn.id = "copyBtn";
    copyResultsBtn.className = "btn";
    copyResultsBtn.innerHTML = "Copy Search Results";
    copyResultsBtn.addEventListener('click', copySearchResults, false);
    this.node.appendChild(copyResultsBtn);

    let setLimitBtn = document.createElement('button');
    setLimitBtn.id = "setLimitBtn";
    setLimitBtn.className = "btn";
    setLimitBtn.innerHTML = "Set Results Limit";
    setLimitBtn.addEventListener('click', setResultsLimit, false);
    this.node.appendChild(setLimitBtn);

    let viewParamsBtn = document.createElement('button');
    viewParamsBtn.id = "copyBtn";
    viewParamsBtn.className = "btn";
    viewParamsBtn.innerHTML = "View Search Parameters";
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

    super({ node: body });
  }

}

export
class LimitPopupWidget extends Widget {
  constructor() {
      let body = document.createElement('div');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';

      super({node: body});

      this.getValue = this.getValue.bind(this);

      let inputLimit = document.createElement('input');
      inputLimit.id = 'inputLimit';
      this.node.appendChild(inputLimit);
  }

  getValue() {
    limit = (<HTMLInputElement>document.getElementById('inputLimit')).value;
    (<HTMLInputElement>document.getElementById('setLimitBtn')).innerHTML = "Results Limit: " + limit;
    console.log("new limit is: ", limit)
  }

}

function copySearchQuery() {
  var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getQuery');
  getUrl.searchParams.append("json_obj", JSON.stringify(params));
  getUrl.searchParams.append("limit", limit);

  // Make call to back end
  var xhr = new XMLHttpRequest();
  let response_text:any = "";

  xhr.onload = function() {
      let response:any = $.parseJSON(xhr.response);
      console.log(response);
      response_text = response.query_string;
      if (response_text == "" ) { response_text = "No results found."; }
      console.log(response_text);
      Clipboard.copyToSystem(response_text);
  };

  xhr.open("GET", getUrl.href, true);
  xhr.send(null);

  return response_text;
}


function copySearchResults() {
  // Construct url to hit backend
  var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getGranules');
  getUrl.searchParams.append("json_obj", JSON.stringify(params));
  getUrl.searchParams.append("limit", limit);


  // Make call to back end
  var xhr = new XMLHttpRequest();

  let url_response:any = [];

  xhr.onload = function() {
      let response:any = $.parseJSON(xhr.response);
      let response_text:any = response.granule_urls;
      if (response_text == "" ) { response_text = "No results found."; }
      console.log(response_text);
      Clipboard.copyToSystem(response_text);
      url_response = response_text;
  };

  xhr.open("GET", getUrl.href, true);
  xhr.send(null);

  return url_response;
}

//
// External facing function for DPS to get the s3 urls of a specified search
//
export function getUrls() {

  return copySearchResults();
}

function setResultsLimit() {
    console.log("old limit is: ", limit)
    showDialog({
        title: 'Set Results Limit:',
        body: new LimitPopupWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });


}

function displaySearchParams() {
  showDialog({
        title: 'Current Search Parameters:',
        body: new ParamsPopupWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });

}

function activate(app: JupyterLab,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  tracker: INotebookTracker,
                  panel: NotebookPanel) {

  let widget: IFrameWidget;

  function getCurrent(args: ReadonlyJSONObject): NotebookPanel | null {
    console.log(args);
    const widget = tracker.currentWidget;
    const activate = args['activate'] !== false;

    if (activate && widget) {
      app.shell.activateById(widget.id);
    }

    return widget;
  }

  // Listen for messages being sent by the iframe
  window.addEventListener("message", (event: MessageEvent) => {
    params = event.data;
    console.log("at event listen: ", event.data);
  });

  function pasteSearch(args: any, result_type: any) {
    const current = getCurrent(args);
    let insert_text = "NO SEARCH STORED";

    if (result_type == "query") {
      insert_text = copySearchQuery();
    } else {
      insert_text = copySearchResults();
    }

    if (current) {
      NotebookActions.paste(current.content);
      current.content.mode = 'edit';
      current.content.activeCell.model.value.text = insert_text;
    }
  }


  /******** Set commands for menu *********/

  // Add an application command to open ESDS
  const open_command = 'iframe:open';
  app.commands.addCommand(open_command, {
    label: 'Open EarthData Search',
    isEnabled: () => true,
    execute: args => {
      widget = new IFrameWidget('https://che-k8s.maap.xyz:3052/search');
      app.shell.addToMainArea(widget);
      app.shell.activateById(widget.id);
    }
  });
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

  app.commands.addCommand('search:pasteQuery', {
    label: 'Paste Search Query',
    isEnabled: () => true,
    execute: args => {
      pasteSearch(args, "query")

    }
  });
  palette.addItem({command: 'search:pasteQuery', category: 'Search'});

  app.commands.addCommand('search:pasteResults', {
    label: 'Paste Search Results',
    isEnabled: () => true,
    execute: args => {
      pasteSearch(args, "results")

    }
  });
  palette.addItem({command: 'search:pasteResults', category: 'Search'});



  // function pasteFunc() {
  //   const current = getCurrent(args);
  //
  //     if (current) {
  //
  //       NotebookActions.paste(current.content);
  //       current.content.mode = 'edit';
  //       current.content.activeCell.model.value.text = "Inserting ESDS query!!!";
  //     }
  // }

  // let button = new ToolbarButton({
  //     iconClassName: 'paste-esds',
  //     onClick: () => {
  //       panel = getCurrent(args);
  //       NotebookActions.paste(panel.content);
  //       panel.content.mode = 'edit';
  //       panel.content.activeCell.model.value.text = "Inserting ESDS query!!!";
  //     },
  //     tooltip: 'Insert a cell below'
  //   });
  //
  // panel.toolbar.insertItem(0,"paste-search", button);

  const { commands } = app;
  let searchMenu = new Menu({ commands })
  searchMenu.title.label = 'Data Search';
  [
    open_command,
    'search:copyQuery',
    'search:copyResult',
    'search:displayParams',
    'search:pasteQuery',
    'search:pasteResults'
  ].forEach(command => {
    searchMenu.addItem({ command });
  });
  mainMenu.addMenu(searchMenu, { rank: 100 });

  
  console.log('JupyterLab extension edsc_extension is activated!');
};


export default extension;