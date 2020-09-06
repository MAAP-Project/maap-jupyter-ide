import { PageConfig } from '@jupyterlab/coreutils';
import { IStateDB } from '@jupyterlab/statedb';
import { INotification } from 'jupyterlab_toastify';
import { getUserInfo } from "./getKeycloak";
import { request, RequestResult } from './request';

let maapEnvironment = {}

export async function getUsernameToken(state: IStateDB, profileId:string) {
    let uname:string = 'anonymous';
    let ticket:string = '';
    let result:string[] = [uname, ticket];
    const opts = maapEnvironment ? maapEnvironment : await loadMaapEnvironment();

    return new Promise<string[]> ((resolve,reject) => {
        if ("https://" + opts.headers['maap_ade_server'] === document.location.origin) {
            getUserInfo(function(profile: any) {
                if (profile['cas:username'] === undefined) {
                    INotification.error("Get profile failed.");
                    resolve(result);
                } else {
                    uname = profile['cas:username'];
                    ticket = profile['proxyGrantingTicket'];
                    result[0] = uname;
                    result[1] = ticket;
                    INotification.success("Got profile.");
                    resolve(result);
                }
            });
        } else {
            state.fetch(profileId).then((profile) => {
                let profileObj = JSON.parse(JSON.stringify(profile));
                INotification.success("Got profile.");
                uname = profileObj.preferred_username;
                ticket = profileObj.proxyGrantingTicket;
                result[0] = uname;
                result[1] = ticket;
                resolve(result);
            }).catch((error) => {
                INotification.error("Get profile failed.");
                resolve(result);
            });
        }
    });
  }

export async function DPSCall(state: IStateDB, endpoint:string, keywords:string[], kwargs:{[k:string]:string}) {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + endpoint);
    for (let k of keywords) {
        requestUrl.searchParams.append(k,kwargs[k]);
    }
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res; 
}

export async function getAlgoList(state: IStateDB, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

export async function describeAlgo(state: IStateDB, algo:string, version:string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/describeProcess');
    requestUrl.searchParams.append('algo_id', algo);
    requestUrl.searchParams.append('version', version)
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

export async function executeInputs(state: IStateDB, algo:string, version:string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/executeInputs');
    requestUrl.searchParams.append('algo_id', algo);
    requestUrl.searchParams.append('version', version)
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

export async function getJobs(state: IStateDB, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

export async function getResults(state: IStateDB, job_id: string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
    requestUrl.searchParams.append('username', username);
    requestUrl.searchParams.append('job_id', job_id);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

export async function getMetrics(state: IStateDB, job_id: string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getMetrics');
    requestUrl.searchParams.append('username', username);
    requestUrl.searchParams.append('job_id', job_id);
    console.log(requestUrl.href);
    const res = await request('get', requestUrl.href);
    return res;
}

// clickable table rows helper function
export function onRowClick(tableId:string, callback:any) {
    let table = document.getElementById(tableId)
    if (table) {
        let rows = table.getElementsByTagName('tr'),
            i:number;
        for (i = 1; i < rows.length; i++) {
            rows[i].onclick = function(row:HTMLTableRowElement) {
                return function() {
                    callback(row);
                }
            }(rows[i]);
        }
    }
}

export async function loadMaapEnvironment(): Promise<any> {
    return new Promise<RequestResult>((resolve, reject) => {
      
      var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/environment');
  
      request('get', valuesUrl.href).then((res: RequestResult) => {
        console.log('maapsec environment response');
        console.log(res);
        if (res.ok) {
          let environment = JSON.parse(res.data);
          resolve(environment);
        } else {
          resolve(null);
        }
      });
    });
  }
  