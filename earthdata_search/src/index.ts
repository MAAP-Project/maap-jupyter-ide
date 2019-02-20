import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, Clipboard
} from '@jupyterlab/apputils';

import {
  PageConfig
} from '@jupyterlab/coreutils'

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  Widget
} from '@phosphor/widgets';

import {
  request, RequestResult
} from './request';

import '../style/index.css';

let unique = 0;
let searchParamURL = "test";
let params:any = {};

const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_iframe',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer],
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

    let copyBtn = document.createElement('button');
    copyBtn.id = "copyBtn";
    // copyBtn.className = "btn";
    copyBtn.innerHTML = "Copy Search Parameters";
    copyBtn.addEventListener('click', copySearchParams, false);
    this.node.appendChild(copyBtn);


    var x = document.createElement("BR");
    this.node.appendChild(x);

    div.appendChild(iframe);
    this.node.appendChild(div);

  }
};

class SearchResultsWidget extends Widget {

  constructor() {
    super();
    this.id = "testid"
    this.title.label = "Search Parameters";
    this.title.closable = true;

    //var x = document.createElement("searchResults");
    var contents = document.createTextNode(JSON.stringify(params));

    this.node.appendChild(contents);

    Clipboard.copyToSystem(JSON.stringify(params));

  }
};

function copySearchParams() {
  console.log("search copied. url is: ", searchParamURL);

  // Parse URL into JSON
  params = getAllUrlParams(searchParamURL);
  console.log(params);

  // If the URL is too long and converts to a project ID, make the request for the json
  // associated with the project ID
  if (params['projectid']) {
    
    var path = 'http://localhost:9001/projects/' + params['projectid'] + '.json';
    request('get', path).then((res: RequestResult) => {

      var temp_json:any = res.json();
      var temp_path:string = temp_json['path'];

      // Convert the path with all parameters into a json object
      params = getAllUrlParams(temp_path);
    })
  }
  console.log(params);
}

/* from https://www.sitepoint.com/get-url-parameters-with-javascript/ */
function getAllUrlParams(url: string) {

  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj:any = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // set parameter name and value (use 'true' if empty)
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

      // if the paramName ends with square brackets, e.g. colors[] or colors[2]
      if (paramName.match(/\[(\d+)?\]$/)) {

        // create key if it doesn't exist
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        // if it's an indexed array e.g. colors[2]
        if (paramName.match(/\[\d+\]$/)) {
          // get the index value and add the entry at the appropriate position
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          // otherwise add the value to the end of the array
          obj[key].push(paramValue);
        }
      } else {
        // we're dealing with a string
        if (!obj[paramName]) {
          // if it doesn't exist, create property
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string'){
          // if property does exist and it's a string, convert it to an array
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          // otherwise add the property
          obj[paramName].push(paramValue);
        }
      }
    }
  }

  return obj;
}

function activate(app: JupyterLab, docManager: IDocumentManager, palette: ICommandPalette, restorer: ILayoutRestorer) {

  // Declare a widget variable
  let widget: IFrameWidget;
  let pasted_widget: SearchResultsWidget;

  window.addEventListener("message", (event: MessageEvent) => {
    searchParamURL = event.data;
    console.log("at event listen: ", event.data);
  });

  // Add an application command
  const open_command = 'iframe:open';

  app.commands.addCommand(open_command, {
    label: 'Open EarthData Search',
    isEnabled: () => true,
    execute: args => {
      widget = new IFrameWidget('http://localhost:9001/');
      app.shell.addToMainArea(widget);
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({command: open_command, category: 'Search'});

  app.commands.addCommand('search:paste', {
    label: 'Paste Search Results',
    isEnabled: () => true,
    execute: args => {
      pasted_widget = new SearchResultsWidget();
      app.shell.addToMainArea(pasted_widget);
      app.shell.activateById(pasted_widget.id);
    }
  });
  palette.addItem({command: 'search:paste', category: 'Search'});


  // grab sites from serverextension
  // request('get', PageConfig.getBaseUrl() + "iframes").then((res: RequestResult) => {
  //   if(res.ok){
  //     let jsn = res.json() as {[key: string]: string};
  //     let welcome = jsn['welcome'];
  //     let welcome_included = false;

  //       let sites = jsn['sites'];

  //       for(let site of sites){
  //         console.log('adding quicklink for ' + site);

  //         if (site === welcome){
  //           welcome_included = true;
  //         }
  //         if (site){
  //           registerSite(app, palette, site);
  //         }
  //       }

  //       if (!welcome_included) {
  //         if (welcome !== ''){
  //           registerSite(app, palette, welcome);
  //         }
  //       }

  //       if (welcome) {
  //         app.restored.then(() => {
  //           if(!localStorage.getItem('jupyterlab_iframe_welcome')) {
  //             localStorage.setItem('jupyterlab_iframe_welcome', 'false');
  //             app.commands.execute('iframe:open-' + welcome);
  //           }
  //         });
  //       }
  //   }
  // });
  console.log('JupyterLab extension jupyterlab_iframe is activated!');
};

export default extension;
export {activate as _activate};