import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, Dialog, showDialog//, Clipboard, ToolbarButton
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

/* WIDGETS */

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

    // set proxy to ESDS
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
    body.innerHTML = "<pre>" + JSON.stringify(params, null, " ") + "</pre><br>" + "Results Limit: " + limit;

    super({ node: body });
  }

}

export
class FlexiblePopupWidget extends Widget {
  constructor(text:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = text;

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

      // this.getValue = this.getValue.bind(this);

      let inputLimit = document.createElement('input');
      inputLimit.id = 'inputLimit';
      this.node.appendChild(inputLimit);
  }

  // getValue() {
  //   limit = (<HTMLInputElement>document.getElementById('inputLimit')).value;
  //   (<HTMLInputElement>document.getElementById('setLimitBtn')).innerHTML = "Results Limit: " + limit;
  //   console.log("new limit is: ", limit)
  // }

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
      //Clipboard.copyToSystem(response_text);
      url_response = response_text;
      return url_response;
  };

  xhr.open("GET", getUrl.href, true);
  xhr.send(null);

}

//
// External facing function for DPS to get the s3 urls of a specified search
//
export function getUrls() {
  return copySearchResults();
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


  // PASTE SEARCH INTO A NOTEBOOK
  function pasteSearch(args: any, result_type: any) {
    const current = getCurrent(args);
    console.log(result_type);

    // Paste Search Query
    if (result_type == "query") {

        var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getQuery');
        getUrl.searchParams.append("json_obj", JSON.stringify(params));
        getUrl.searchParams.append("limit", limit);

        // Make call to back end
        var xhr = new XMLHttpRequest();
        let response_text:any = "";

        xhr.onload = function() {
          if (xhr.status == 200) {
              let response: any = $.parseJSON(xhr.response);
              console.log(response);
              response_text = response.query_string;
              if (response_text == "") {
                  response_text = "No results found.";
              }
              console.log(response_text);
              if (current) {
                  NotebookActions.insertBelow(current.content);
                  NotebookActions.paste(current.content);
                  current.content.mode = 'edit';
                  current.content.activeCell.model.value.text = response_text;
                  console.log("inserted text");
              }
          }
          else {
              console.log("Error making call to get query. Status is " + xhr.status);

              showDialog({
                title: 'Error:',
                body: new FlexiblePopupWidget("Error making call to get search query. Have you selected valid search parameters?"),
                focusNodeSelector: 'input',
                buttons: [Dialog.okButton({ label: 'Ok' })]
              });
          }
        };

        xhr.onerror = function() {
          console.log("Error making call to get query");
        };

        xhr.open("GET", getUrl.href, true);
        xhr.send(null);

    // Paste Search Results
    } else {

      var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getGranules');
      getUrl.searchParams.append("json_obj", JSON.stringify(params));
      getUrl.searchParams.append("limit", limit);


      // Make call to back end
      var xhr = new XMLHttpRequest();

      let url_response:any = [];

      xhr.onload = function() {
          if (xhr.status == 200) {
              let response: any = $.parseJSON(xhr.response);
              let response_text: any = response.granule_urls;
              if (response_text == "") {
                  response_text = "No results found.";
              }
              url_response = response_text;
              console.log(response_text);
              if (current) {
                  NotebookActions.insertBelow(current.content);
                  NotebookActions.paste(current.content);
                  current.content.mode = 'edit';
                  current.content.activeCell.model.value.text = url_response;
                  console.log("inserted text");
              }
          }
          else {
              console.log("Error making call to get results. Status is " + xhr.status);

              showDialog({
                title: 'Error:',
                body: new FlexiblePopupWidget("Error making call to get search results. Have you selected valid search parameters?"),
                focusNodeSelector: 'input',
                buttons: [Dialog.okButton({ label: 'Ok' })]
              });
          }
      };

      xhr.onerror = function() {
          console.log("Error making call to get results");
        };

      xhr.open("GET", getUrl.href, true);
      xhr.send(null);
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

  const display_params_command = 'search:displayParams';
  app.commands.addCommand(display_params_command, {
    label: 'View Selected Search Parameters',
    isEnabled: () => true,
    execute: args => {
      displaySearchParams();
    }
  });
  palette.addItem({command: display_params_command, category: 'Search'});

  const paste_query_command = 'search:pasteQuery';
  app.commands.addCommand(paste_query_command, {
    label: 'Paste Search Query',
    isEnabled: () => true,
    execute: args => {
      pasteSearch(args, "query")
    }
  });
  palette.addItem({command: paste_query_command, category: 'Search'});

  const paste_results_command = 'search:pasteResults';
  app.commands.addCommand(paste_results_command, {
    label: 'Paste Search Results',
    isEnabled: () => true,
    execute: args => {
      pasteSearch(args, "results")
    }
  });
  palette.addItem({command: paste_results_command, category: 'Search'});

  const set_limit_command = 'search:setLimit';
  app.commands.addCommand(set_limit_command, {
    label: 'Set Results Limit',
    isEnabled: () => true,
    execute: args => {
      setResultsLimit();
    }
  });
  palette.addItem({command: set_limit_command, category: 'Search'});



  const { commands } = app;
  let searchMenu = new Menu({ commands });
  searchMenu.title.label = 'Data Search';
  [
    open_command,
    display_params_command,
    paste_query_command,
    paste_results_command,
    set_limit_command
  ].forEach(command => {
    searchMenu.addItem({ command });
  });
  mainMenu.addMenu(searchMenu, { rank: 100 });


  console.log('JupyterLab extension edsc_extension is activated!');
};


export default extension;