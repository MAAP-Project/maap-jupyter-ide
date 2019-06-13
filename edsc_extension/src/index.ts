/// <reference path="./widgets.ts" />

/** jupyterlab imports **/
import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, Dialog, showDialog, InstanceTracker } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { NotebookActions, NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';


/** phosphor imports **/
import { Menu } from '@phosphor/widgets';
import { ReadonlyJSONObject, JSONExt } from '@phosphor/coreutils';

/** other external imports **/
import { INotification } from "jupyterlab_toastify";
import * as $ from "jquery";

/** internal imports **/
import '../style/index.css';
import { IFrameWidget, ParamsPopupWidget, LimitPopupWidget} from './widgets';
import globals = require("./globals");


const extension: JupyterLabPlugin<InstanceTracker<IFrameWidget>> = {
  id: 'edsc_extension',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, INotebookTracker],
  activate: activate
};



function setResultsLimit() {
    console.log("old limit is: ", globals.limit)
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
  getUrl.searchParams.append("json_obj", JSON.stringify(globals.params));
  getUrl.searchParams.append("limit", globals.limit);


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
                  panel: NotebookPanel): InstanceTracker<IFrameWidget> {

  let widget: IFrameWidget;

  const namespace = 'tracker-iframe';
  let instanceTracker = new InstanceTracker<IFrameWidget>({ namespace });



  //
  // Listen for messages being sent by the iframe - this will be all of the parameter
  // objects from the EDSC instance
  //
  window.addEventListener("message", (event: MessageEvent) => {
    globals.params = event.data;
    console.log("at event listen: ", event.data);
  });

  //
  // Get the current cell selected in a notebook
  //
  function getCurrent(args: ReadonlyJSONObject): NotebookPanel | null {
    console.log(args);
    const widget = tracker.currentWidget;
    const activate = args['activate'] !== false;

    if (activate && widget) {
      app.shell.activateById(widget.id);
    }

    return widget;
  }


  // PASTE SEARCH INTO A NOTEBOOK
  function pasteSearch(args: any, result_type: any) {
    const current = getCurrent(args);
    console.log(result_type);

    // If no search is selected, send an error
    if (Object.keys(globals.params).length == 0) {
        INotification.error("Error: No Search Selected.");
        return;
    }


    // Paste Search Query
    if (result_type == "query") {

        var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getQuery');
        getUrl.searchParams.append("json_obj", JSON.stringify(globals.params));
        getUrl.searchParams.append("limit", globals.limit);

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
              INotification.error("Error making call to get search query. Have you selected valid search parameters?");
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
      getUrl.searchParams.append("json_obj", JSON.stringify(globals.params));
      getUrl.searchParams.append("limit", globals.limit);


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
               INotification.error("Error making call to get search results. Have you selected valid search parameters?");
          }
      };

      xhr.onerror = function() {
          console.log("Error making call to get results");
        };

      xhr.open("GET", getUrl.href, true);
      xhr.send(null);
    }


  }


  /******** Set commands for command palette and main menu *********/

  // Add an application command to open ESDC
  const open_command = 'iframe:open';
  app.commands.addCommand(open_command, {
    label: 'Open EarthData Search',
    isEnabled: () => true,
    execute: args => {

      console.log(widget);

      // Only allow user to have one EDSC window
      // if (widget === undefined) {
      //     widget = new IFrameWidget('https://che-k8s.maap.xyz:3052/search');
      //     app.shell.addToMainArea(widget);
      //     app.shell.activateById(widget.id);
      // } else {
      //     // if user already has EDSC, just switch to tab
      //     app.shell.addToMainArea(widget);
      //     app.shell.activateById(widget.id);
      // }

      widget = new IFrameWidget('https://che-k8s.maap.xyz:3052/search');
      app.shell.addToMainArea(widget);
      app.shell.activateById(widget.id);

      if (!instanceTracker.has(widget)) {
          console.log("in has widget");
        // Track the state of the widget for later restoration
        instanceTracker.add(widget);
      }
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


  // Track and restore the widget state
  restorer.restore(instanceTracker, {
    command: open_command,
    args: () => JSONExt.emptyObject,
    name: () => namespace
  });


  console.log('JupyterLab extension edsc_extension is activated!');
  return instanceTracker;
};


export default extension;