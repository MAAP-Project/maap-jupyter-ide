import { Widget } from '@lumino/widgets';
import { PageConfig } from '@jupyterlab/coreutils'
import { INotification } from "jupyterlab_toastify";

import {
  request, RequestResult
} from './request';

import globals = require("./globals");

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