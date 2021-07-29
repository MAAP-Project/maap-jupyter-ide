import { Widget } from '@lumino/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { INotification } from "jupyterlab_toastify";

import {
  request, RequestResult
} from './request';

import globals = require("./globals");

//MY IMPORTS
import { NotebookActions } from '@jupyterlab/notebook';
let current = null;
import { getMaapVarName, printInfoMessage } from "./getMaapVarName";
//import { DropdownSelector } from './selector';
//import { popupResult } from './dialogs';

let unique = 0;

//
// Widget to display Earth Data Search Client inside an iframe
//
export
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

    // set proxy to EDSC
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

//
// Widget to display selected search parameter
//
export
class ParamsPopupWidget extends Widget {
  constructor() {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = "<pre>Granule search: " + JSON.stringify(globals.granuleParams, null, " ") + "</pre><br>"
        + "<pre>Collection search: " + JSON.stringify(globals.collectionParams, null, " ") + "</pre><br>"
        + "<pre>Results Limit: " + globals.limit + "</pre>";

    super({ node: body });
  }
}

//
// Popup widget to display any string message
//
export class FlexiblePopupWidget extends Widget {
  constructor(text:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = text;

    super({ node: body });
  }
}

//
// Widget with popup to set search results limit
//
export class LimitPopupWidget extends Widget {
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

  /* sets limit */
  getValue() {
    globals.limit = (<HTMLInputElement>document.getElementById('inputLimit')).value;
    console.log("new limit is: ", globals.limit)
    INotification.success("Results limit is now set to " + globals.limit);
  }

}

/**
 * Widget that allows the user to fill in the information for a call to load_geotiffs
 */
export class LoadGeotiffsWidget extends Widget {
  constructor(currentGiven) {
      current = currentGiven;
      let body = document.createElement('div');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';

      super({node: body});

      this.getValue = this.getValue.bind(this);

      // default_tiler_ops
      this.createArgumentHeaderElement("default_tiler_ops")
      this.createInputElementForVariableDropDown("default_tiler_ops_tile_format", "tile_format", ["png", "jpg", "jpeg", "tif", "jp2", "npy", "webp", "pngraw"], "png");
      this.createInputElementForVariableTextBox("default_tiler_ops_tile_scale", "tile_scale", 1);
      this.createInputElementForVariableDropDown("default_tiler_ops_pixel_selection", "pixel_selection", ["first", "highest", "lowest", "mean", "median", "stdev"], "first");
      var tileMatrixSets = ['CanadianNAD83_LCC', 'EPSG3413', 'EPSG6933', 'EuropeanETRS89_LAEAQuad', 'LINZAntarticaMapTilegrid', 'NZTM2000', 'UPSAntarcticWGS84Quad', 'UPSArcticWGS84Quad', 'UTM31WGS84Quad', 'WebMercatorQuad', 'WorldCRS84Quad', 'WorldMercatorWGS84Quad'];
      this.createInputElementForVariableDropDown("default_tiler_ops_TileMatrixSetId", "TileMatrixSetId", tileMatrixSets, "WebMercatorQuad");
      var resampling_methods = ['nearest','bilinear','cubic','cubic_spline','lanczos','average','mode','gauss','max','min','med','q1','q3'];
      this.createInputElementForVariableDropDown("default_tiler_ops_resampling_method", "resampling_method", resampling_methods, "nearest");
      this.createInputElementForVariableDropDown("default_tiler_ops_return_mask", "return_mask", [true, false], true);
      this.createInputElementForVariableTextBox("default_tiler_ops_rescale", "rescale", "0,1");

      // handle_as
      this.node.appendChild(document.createElement('br'));
      this.createArgumentHeaderElement("handle_as");
      this.createJustInputElement("handle_asInput", "wmts/xml");

      // default_ops_load_layer
      this.node.appendChild(document.createElement('br'));
      this.createArgumentHeaderElement("default_ops_load_layer");
      this.createInputElementForVariableTextBox("handleAs", "handleAs", "wmts_raster");

      // debug_mode
      this.node.appendChild(document.createElement('br'));
      this.createArgumentHeaderElement("debug_mode");
      this.createJustDropDownElement([true, false], true);

      // time_analysis
      this.node.appendChild(document.createElement('br'));
      this.createArgumentHeaderElement("time_analysis");
      this.createJustDropDownElement([false, true], false);

  }

  /* sets limit */
  getValue() {
    //globals.limit = (<HTMLInputElement>document.getElementById('inputLimit')).value;
    //INotification.success("Just got value");
    /*if (Object.keys(globals.granuleParams).length == 0) {
      INotification.error("Error: No Search Selected.");
      return;
    }*/

    var getUrl = new URL(PageConfig.getBaseUrl() + 'edsc/visualizeCMC');
    getUrl.searchParams.append("maapVarName", getMaapVarName(current));
    
    //getUrl.searchParams.append("cmr_query", globals.granuleQuery);
    //getUrl.searchParams.append("limit", globals.limit);
    var xhr = new XMLHttpRequest();
    
    //INotification.success("About to create onload function");
    xhr.onload = function() {
        //INotification.success("In onload function");
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
            //INotification.error("Error in widgets.ts");
        }
    };

    xhr.onerror = function() {
      INotification.error("Error getting results from Data Search.");
    };

    xhr.open("GET", getUrl.href, true);
    xhr.send(null);
  }

  createInputElementForVariableTextBox(elementId: string, elementName: string, defaultValue: any) {
    let element = document.createElement('p');
    element.id = elementId;
    element.textContent = elementName + ":";
    this.node.appendChild(element);

    let element_input = document.createElement('input');
    element_input.id = elementId + "Input";
    element_input.defaultValue = defaultValue;
    this.node.appendChild(element_input);
  }

  createJustInputElement(elementId: string, defaultValue: any) {
    let element_input = document.createElement('input');
    element_input.id = elementId + "Input";
    element_input.defaultValue = defaultValue;
    this.node.appendChild(element_input);
  }

  createJustDropDownElement(options: any, defaultOption: any) {
    let dropdown = <HTMLSelectElement>document.createElement("SELECT");
    if (! defaultOption) {
        defaultOption = '';
    }

    let opt:HTMLOptionElement;
    for (let option of options) {
        opt = <HTMLOptionElement>document.createElement("option");
        if (defaultOption === option) {
            opt.setAttribute("selected","selected");
        }
        opt.setAttribute("id", option);
        opt.setAttribute("label",option);
        opt.appendChild(document.createTextNode(option));
        dropdown.appendChild(opt);
    }
    this.node.appendChild(dropdown);
  }

  createInputElementForVariableDropDown(elementId: string, elementName: string, options: any, defaultOption: any) {
    let element = document.createElement('p');
    element.id = elementId;
    element.textContent = elementName + ":";
    this.node.appendChild(element);

    this.createJustDropDownElement(options, defaultOption);
  }

  createArgumentHeaderElement(nameParameter: string) {
    let argHeader = document.createElement("b");
    argHeader.textContent = nameParameter + ":";
    argHeader.id = nameParameter;
    this.node.appendChild(argHeader);
  }
  
    /*testingDropDownReplicatingExistingCode(options:string[], defaultOption:string) {
      let dropdown = <HTMLSelectElement>document.createElement("SELECT");
      if (! defaultOption) {
          defaultOption = '';
      }

      let opt:HTMLOptionElement;
      for (let option of options) {
          opt = <HTMLOptionElement>document.createElement("option");
          if (defaultOption === option) {
              opt.setAttribute("selected","selected");
          }
          opt.setAttribute("id", option);
          opt.setAttribute("label",option);
          opt.appendChild(document.createTextNode(option));
          dropdown.appendChild(opt);
      }
      this.node.appendChild(dropdown);
    }*/

}