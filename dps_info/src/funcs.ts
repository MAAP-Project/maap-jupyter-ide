import { PageConfig } from '@jupyterlab/coreutils';
// import { INotification } from 'jupyterlab_toastify';
import { request, RequestResult } from './request';

export async function getJobs(username:string): Promise<RequestResult> {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
    getUrl.searchParams.append('username', username);
    console.log(getUrl.href);

    const res = await request('get', getUrl.href);
    return res;
}

export async function getResults(job_id: string, username:string): Promise<RequestResult> {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
    getUrl.searchParams.append('username', username);
    getUrl.searchParams.append('job_id', job_id);
    console.log(getUrl.href);

    const res = await request('get', getUrl.href);
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