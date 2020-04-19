import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';
import { popupResultText } from './widgets';

export function getAlgorithms() {
  return new Promise<{[k:string]:Array<string>}>((resolve, reject) => {
    var algoSet: { [key: string]: Array<string>} = {}

    // get list of projects to give dropdown menu
    var settingsAPIUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
    console.log(settingsAPIUrl.href);
    request('get',settingsAPIUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        var algos = json_response['algo_set'];
        // console.log(json_response);
        // console.log(algos);
        algoSet = algos;
        resolve(algoSet);
      }
    });
  });
}

export function getDefaultValues(code_path) {
  return new Promise<{[k:string]:string}>((resolve, reject) => {
    var defaultValues:{[k:string]:string}  = {}

    // get list of projects to give dropdown menu
    var valuesUrl = new URL(PageConfig.getBaseUrl() + 'hysds/defaultValues');
    valuesUrl.searchParams.append('code_path', code_path);
    console.log(valuesUrl.href);
    request('get',valuesUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        var values = json_response['default_values'];
        defaultValues = values;
      resolve(defaultValues);
      } else {
        resolve({});
      }
    });
  });
}

// HySDS endpoints that require inputs
export function inputRequest(endpt:string,title:string,inputs:{[k:string]:string},fn?:any) {
  var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + endpt);
  // add params
  for (let key in inputs) {
    var fieldValue = inputs[key];

    if(key !== 'proxy-ticket')
      fieldValue = fieldValue.toLowerCase();

    requestUrl.searchParams.append(key.toLowerCase(), fieldValue);
  }
  console.log(requestUrl.href);

  // send request
  request('get',requestUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      var json_response:any = res.json();
      // console.log(json_response['result']);
      // console.log(fn);
      if (fn == undefined) {
        console.log('fn undefined');
        popupResultText(json_response['result'],title);
      } else {
        console.log('fn defined');
        fn(json_response);
      }
    }
  }); 
}

// HySDS endpoints that don't require any inputs
export function noInputRequest(endpt:string,title:string) {
  inputRequest(endpt,title,{});
}

export function algorithmExists(name:string, ver:string, env:string) {
  var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + 'describeProcess');
  // add params
  requestUrl.searchParams.append('algo_name', name+'_'+env);
  requestUrl.searchParams.append('version', ver);
  console.log(requestUrl.href);

  // send request
  return request('get',requestUrl.href).then((res: RequestResult) => {
    if (res.ok) {
      var json_response:any = res.json();
      console.log(json_response);
      if (json_response.status == 200) {
        return true;
      } else {
        return false;
      }
    } else {
      console.log('describeProcess not ok');
      return false;
    }
  }); 
}

