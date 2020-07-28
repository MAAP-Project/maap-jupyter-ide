import { PageConfig } from '@jupyterlab/coreutils';
// import { INotification } from 'jupyterlab_toastify';
import { request, RequestResult } from './request';

export async function DPSCall(endpoint:string, keywords:string[], kwargs:{[k:string]:string}) {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + endpoint);
    for (let k of keywords) {
        requestUrl.searchParams.append(k,kwargs[k]);
    }
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res; 
}

export async function getAlgoList(username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

export async function describeAlgo(algo:string, version:string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/describeProcess');
    requestUrl.searchParams.append('algo_id', algo);
    requestUrl.searchParams.append('version', version)
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

export async function executeInputs(algo:string, version:string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/executeInputs');
    requestUrl.searchParams.append('algo_id', algo);
    requestUrl.searchParams.append('version', version)
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

export async function getJobs(username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
    requestUrl.searchParams.append('username', username);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

export async function getResults(job_id: string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
    requestUrl.searchParams.append('username', username);
    requestUrl.searchParams.append('job_id', job_id);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

export async function getMetrics(job_id: string, username:string): Promise<RequestResult> {
    let requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getMetrics');
    requestUrl.searchParams.append('username', username);
    requestUrl.searchParams.append('job_id', job_id);
    console.log(requestUrl.href);

    const res = await request('get', requestUrl.href);
    return res;
}

// clickable table rows helper function
export function onRowClick(tableId:string, callback:any) {
    if (document.getElementById(tableId) !== undefined) {
        let table = document.getElementById(tableId),
            rows = table.getElementsByTagName('tr'),
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