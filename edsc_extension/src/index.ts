/// <reference path="./widgets.ts" />

/** jupyterlab imports **/
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { NotebookActions, NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { request, RequestResult } from './request';


/** phosphor imports **/
import { Menu } from '@lumino/widgets';
import { ReadonlyJSONObject } from '@lumino/coreutils';

/** other external imports **/
import { INotification } from "jupyterlab_toastify";

/** internal imports **/
import '../style/index.css';
import { IFrameWidget } from './widgets';
import { setResultsLimit, displaySearchParams } from './popups'
import globals = require("./globals");
import { decodeUrlParams } from "./urlParser";
import { buildCmrQuery } from "./buildCmrQuery";
import { granulePermittedCmrKeys,
        granuleNonIndexedKeys,
        collectionPermittedCmrKeys,
        collectionNonIndexedKeys } from "./searchKeys";
import { getMaapVarName, printInfoMessage } from "./getMaapVarName";

let edsc_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/environment');

request('get', valuesUrl.href).then((res: RequestResult) => {
  if (res.ok) {
    let environment = JSON.parse(res.data);
    edsc_server = 'https://' + environment['edsc_server'];
  }
});

///////////////////////////////////////////////////////////////
//
// Earthdata Search Client extension
//
///////////////////////////////////////////////////////////////

const extension: JupyterFrontEndPlugin<WidgetTracker<IFrameWidget>> = {
  id: 'edsc_extension',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer, IMainMenu, INotebookTracker],
  activate: activate
};

function activate(app: JupyterFrontEnd,
                  docManager: IDocumentManager,
                  palette: ICommandPalette,
                  restorer: ILayoutRestorer,
                  mainMenu: IMainMenu,
                  tracker: INotebookTracker,
                  panel: NotebookPanel): WidgetTracker<IFrameWidget> {

  let widget: IFrameWidget;

  const namespace = 'tracker-iframe';
  let instanceTracker = new WidgetTracker<IFrameWidget>({ namespace });

  //
  // Listen for messages being sent by the iframe - parse the url and set as parameters for search
  //
  window.addEventListener("message", (event: MessageEvent) => {
      // if the message sent is the edsc url
      if (typeof event.data === "string"){
          globals.edscUrl = event.data;
          const queryString = '?' + event.data.split('?')[1];
          const decodedUrlObj = decodeUrlParams(queryString);
          globals.granuleQuery = "https://fake.com/?" + buildCmrQuery(decodedUrlObj, granulePermittedCmrKeys, granuleNonIndexedKeys, );
          globals.collectionQuery = "https://fake.com/?" + buildCmrQuery(decodedUrlObj, collectionPermittedCmrKeys, collectionNonIndexedKeys, false);
          // console.log("Granule", globals.granuleQuery);
          // console.log("Collection", globals.collectionQuery);
      }
  });


  //
  // Get the current cell selected in a notebook
  //
  function getCurrent(args: ReadonlyJSONObject): NotebookPanel | null {
    const widget = tracker.currentWidget;
    const activate = args['activate'] !== false;

    if (activate && widget) {
      app.shell.activateById(widget.id);
    }
    return widget;
  }

  // PASTE SEARCH INTO A NOTEBOOK
  function pasteSearch(args: any, result_type: any, query_type='granule') {
    const current = getCurrent(args);

    // If no search is selected, send an error
    if (Object.keys(globals.granuleParams).length == 0) {
        INotification.error("Error: No Search Selected.");
        return;
    }

    // Paste Search Query
    if (result_type == "query") {

        var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getQuery');
        if (query_type === 'granule') {
            getUrl.searchParams.append("cmr_query", globals.granuleQuery);
            getUrl.searchParams.append("query_type", 'granule');
        } else {
            getUrl.searchParams.append("cmr_query", globals.collectionQuery);
            getUrl.searchParams.append("query_type", 'collection');
        }
        getUrl.searchParams.append("limit", globals.limit);

        // Make call to back end
        var xhr = new XMLHttpRequest();
        let response_text:any = "";

        xhr.onload = function() {
          if (xhr.status == 200) {
              let response: any = JSON.parse(xhr.response);
              response_text = response.query_string;
              if (response_text == "") {
                  response_text = "No results found.";
              }
              if (current) {
                  NotebookActions.insertBelow(current.content);
                  NotebookActions.paste(current.content);
                  current.content.mode = 'edit';
                  const insert_text = "# generated from this EDSC search: " + globals.edscUrl + "\n" + response_text;
                  current.content.activeCell.model.value.text = insert_text;
              }
          }
          else {
              console.log("Error making call to get query. Status is " + xhr.status);
              INotification.error("Error making call to get search query. Have you selected valid search parameters?");
          }
        };

        xhr.onerror = function() {
          console.error("Error making call to get query");
        };

        xhr.open("GET", getUrl.href, true);
        xhr.send(null);


    // Paste Search Results
    } else {

      var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/getGranules');
      getUrl.searchParams.append("cmr_query", globals.granuleQuery);
      getUrl.searchParams.append("limit", globals.limit);

      // Make call to back end
      var xhr = new XMLHttpRequest();
      let url_response:any = [];

      xhr.onload = function() {
          if (xhr.status == 200) {
              let response: any = JSON.parse(xhr.response);
              let response_text: any = response.granule_urls;
              if (response_text == "") {
                  response_text = "No results found.";
              }
              url_response = response_text;
              if (current) {
                  NotebookActions.insertBelow(current.content);
                  NotebookActions.paste(current.content);
                  current.content.mode = 'edit';
                  const insert_text = "# generated from this EDSC search: " + globals.edscUrl + "\n" + url_response;
                  current.content.activeCell.model.value.text = insert_text;
              }
          }
          else {
              console.log("Error making call to get results. Status is " + xhr.status);
              INotification.error("Error making call to get search results with status "+ xhr.status +". Have you selected valid search parameters?");
          }
      };

      xhr.onerror = function() {
          console.log("Error making call to get results");
        };

      xhr.open("GET", getUrl.href, true);
      xhr.send(null);
    }


  }

  function visualizeCMC(args: any) {
    const current = getCurrent(args);
    // If no search is selected, send an error
    if (Object.keys(globals.granuleParams).length == 0) {
      INotification.error("Error: No Search Selected.");
      return;
    }
    var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/visualizeCMC');
    getUrl.searchParams.append("maapVarName", getMaapVarName(current));
    
    getUrl.searchParams.append("cmr_query", globals.granuleQuery);
    getUrl.searchParams.append("limit", globals.limit);
    var xhr = new XMLHttpRequest();
    
    xhr.onload = function() {
        if (xhr.status == 200) {
            let response: any = JSON.parse(xhr.response);
            if (current) {
              NotebookActions.insertBelow(current.content);
              NotebookActions.paste(current.content);
              current.content.mode = 'edit';
              const insert_text = "# Results to post to CMC (unaccepted file types removed): " + "\n" + response.function_call;
              current.content.activeCell.model.value.text = insert_text;
              printInfoMessage(response);
            }
        }
        else {
            console.log("Error making call to get results. Status is " + xhr.status);
            INotification.error("Error making call to get search results. Have you selected valid search parameters?");
        }
    };

    xhr.onerror = function() {
      INotification.error("Error getting results from Data Search.");
    };

    xhr.open("GET", getUrl.href, true);
    xhr.send(null);
  }


  /******** Set commands for command palette and main menu *********/

  // Add an application command to open ESDC
  const open_command = 'iframe:open';
  app.commands.addCommand(open_command, {
    label: 'Open EarthData Search',
    isEnabled: () => true,
    execute: args => {
      // Only allow user to have one EDSC window
      if (widget == undefined) {
          widget = new IFrameWidget(edsc_server);
          app.shell.add(widget, 'main');
          app.shell.activateById(widget.id);
      } else {
          // if user already has EDSC, just switch to tab
          app.shell.add(widget, 'main');
          app.shell.activateById(widget.id);
      }

      if (!instanceTracker.has(widget)) {
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

  const paste_collection_query_command = 'search:pasteCollectionQuery';
  app.commands.addCommand(paste_collection_query_command, {
    label: 'Paste Collection Search Query',
    isEnabled: () => true,
    execute: args => {
        pasteSearch(args, "query", "collection")
    }
  });
  palette.addItem({command: paste_collection_query_command, category: 'Search'});

  const paste_granule_query_command = 'search:pasteGranuleQuery';
  app.commands.addCommand(paste_granule_query_command, {
    label: 'Paste Granule Search Query',
    isEnabled: () => true,
    execute: args => {
      pasteSearch(args, "query", "granule")
    }
  });
  palette.addItem({command: paste_granule_query_command, category: 'Search'});

  const paste_results_command = 'search:pasteResults';
  app.commands.addCommand(paste_results_command, {
    label: 'Paste Granule Search Results',
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

  const visualize_cmc_command = 'search:visualizeCMC';
  app.commands.addCommand(visualize_cmc_command, {
    label: 'Visualize Granule Results in map',
    isEnabled: () => true,
    execute: args => {
      visualizeCMC(args)
    }
  });
  palette.addItem({command: visualize_cmc_command, category: 'Search'});

  const { commands } = app;
  let searchMenu = new Menu({ commands });
  searchMenu.title.label = 'Data Search';
  [
    open_command,
    display_params_command,
    paste_collection_query_command,
    paste_granule_query_command,
    paste_results_command,
    set_limit_command,
    visualize_cmc_command
  ].forEach(command => {
    searchMenu.addItem({ command });
  });
  mainMenu.addMenu(searchMenu, { rank: 100 });


  // Track and restore the widget state
  restorer.restore(instanceTracker, {
    command: open_command,
    name: () => namespace
  });


  console.log('JupyterLab extension edsc_extension is activated!');
  return instanceTracker;
};


export default extension;
