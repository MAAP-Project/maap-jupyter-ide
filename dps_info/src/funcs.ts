import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { Widget } from '@phosphor/widgets';
import { INotification } from "jupyterlab_toastify";
import { request, RequestResult } from './request';
import '../style/index.css';

export const jobCache_update_command = 'jobs: refresh';
export const jobWidget_command = 'jobs: main-widget';
export var JOBS: {[k:string]:string} = {};
export var DISPLAYS: {[k:string]:string} = {};

// create job table with job ids, status, and algorithms
export function getJobs(username: string, job_id: string, setJobId:any, callback:any,obj?:any) {
  // call list jobs endpoint using username
  var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
  getUrl.searchParams.append('username',username);
  console.log(getUrl.href);
  // --------------------
  // get jobs list request
  // --------------------
  request('get', getUrl.href).then((res: RequestResult) => {
    if(res.ok){
      let json_response:any = res.json();
      // console.log(json_response['status_code']);
      INotification.success("Get user jobs success.");
      if (json_response['status_code'] == 200){
        let table = json_response['table'];
        JOBS = json_response['jobs'];
        // later get user to pick the job
        // this._displays = json_response['displays'];
        DISPLAYS = json_response['displays'];

        // catch case if user has no jobs
        let num_jobs = Object.keys(JOBS).length;
        if (num_jobs > 0 && job_id == '') {
          job_id = json_response['result'][0]['job_id'];
          setJobId(job_id);
        }
        callback(obj, table);
      } else {
        console.log('unable to get user job list');
        INotification.error("Get user jobs failed.");
      }
    } else {
      console.log('unable to get user job list');
      INotification.error("Get user jobs failed.");
    }
  });
}

// passes back metrics html from python api
export function getJobMetrics(job_id: string, callback?: any) {
  let metrics:string = '';
  var metricsUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getMatrics');
  if (job_id != '' && JOBS[job_id]['status'] == 'job-completed') {
    metricsUrl.searchParams.append('job',job_id);
    console.log(metricsUrl.href);

    request('get', metricsUrl.href).then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        INotification.success("Get user job metrics success.");

        if (json_response['status_code'] == 200){
          metrics = json_response['result'];
        } else {
          console.log('unable to get job metrics');
          INotification.error("Get user job metrics failed.");
        }
        callback(metrics);
      } else {
        console.log('unable to get job metrics');
        INotification.error("Get user job metrics failed.");
      }
      callback(metrics);
    })
  }
}

// passes back results html from python api
export function getJobResults(job_id: string, callback?: any) {
  let results:string = '';
  var resultUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
  if (job_id != '' && JOBS[job_id]['status'] == 'job-completed') {
    resultUrl.searchParams.append('job_id',job_id);
    console.log(resultUrl.href);

    request('get', resultUrl.href).then((res: RequestResult) => {
      console.log(res);
      if(res.ok){
        let json_response:any = res.json();
        // console.log(json_response['status_code']);
        INotification.success("Get user job result success.");

        if (json_response['status_code'] == 200){
          results = json_response['result'];
        } else {
          console.log('unable to get user job result');
          INotification.error("Get user job result failed.");
        }
      } else {
        console.log('unable to get user job result');
        INotification.error("Get user job result failed.");
      }
      // let outerDiv = (<HTMLDivElement>document.getElementById('jobs-div'));
      callback(results);
    });
  } else {
    results = '<p>Job '+job_id+' <br>not complete</p>';
    // let outerDiv = (<HTMLDivElement>document.getElementById('jobs-div'));
    callback(results);
  }
}

// converts results into display table and appends to provided div element
export function updateResultsTable(outerDiv: HTMLDivElement, tableName: string, results: string) {
  if (outerDiv == null) {
    outerDiv = document.createElement('div');
    outerDiv.setAttribute('id', tableName+'-div');
    outerDiv.setAttribute('resize','none');
    outerDiv.setAttribute('class','jp-JSONEditor-host');
    outerDiv.setAttribute('style','border-style:none; overflow: auto');
  }
  if (document.getElementById(tableName) != null) {
      (<HTMLTextAreaElement>document.getElementById(tableName)).innerHTML = results;
  } else {
    var display = document.createElement("table");
    display.id = tableName;
    display.innerHTML = results;
    display.setAttribute('class','jp-JSONEditor-host');
    display.setAttribute('style','border-style:none; font-size:11px');
    outerDiv.appendChild(display);
  }
}

// clickable table rows helper function
export function onRowClick(tableId:string, callback:any) {
  if (document.getElementById(tableId) != undefined) {
    let table = document.getElementById(tableId),
        rows = table.getElementsByTagName('tr'),
        i;
    for (i = 1; i < rows.length; i++) {
      rows[i].onclick = function(row:HTMLTableRowElement) {
        return function() {
          callback(row);
        }
      }(rows[i]);
    }
  }
}

export function deleteDismissJob(btn: HTMLButtonElement, job_id: string, fn: string) {
  let title:string = '';
  if (fn == 'delete') {
    title = 'Delete Job';
  } else {
    title = 'Dismiss Job';
  }
  
  let btn_fn = function () {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/' + fn);
    getUrl.searchParams.append('job_id', job_id);
    console.log(getUrl.href);
    request('get',getUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        let json_response:any = res.json();
        let result = json_response['result'];

        let body = document.createElement('div');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';

        let textarea = document.createElement("div");
        textarea.id = fn+'-button-text';
        textarea.style.display = 'flex';
        textarea.style.flexDirection = 'column';
        textarea.innerHTML = "<pre>"+result+"</pre>";

        body.appendChild(textarea);
        showDialog({
          title: title,
          body: new Widget({node:body}),
          focusNodeSelector: 'input',
          buttons: [Dialog.okButton({label: 'Ok'})]
        });
      }
    });
  }
  btn.onclick = btn_fn;
}