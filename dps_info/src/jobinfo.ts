// import { PageConfig } from '@jupyterlab/coreutils';
import { Widget } from '@lumino/widgets';
import { INotification } from 'jupyterlab_toastify';
import { RequestResult } from './request';
import { getJobs, getResults, onRowClick } from './funcs';

export const WIDGET_CLASS = 'jp-Widget';
export const CONTENT_CLASS = 'jp-Inspector-content'

// should be only 1 instance
export class JobTable extends Widget {
    _username: string;
    _job_id: string;
    _table: string;
    _jobs: {[k:string]:string};
    _results: string;
    _resultsTableName: string;
    _displays: {[k:string]:string};

    constructor(uname:string) {
        super();
        this._username = uname;
        this._job_id = '';
        this._table = '';
        this._results = '';
        this._jobs = {};
        this._displays = {};
        this.addClass(CONTENT_CLASS);
        this._resultsTableName = 'job-result-display'

        let br = document.createElement('br');
        this.node.appendChild(br);

        let div = document.createElement('div');
        let p = document.createElement('p');
        p.innerText = 'testing';
        div.appendChild(p);
        this.node.appendChild(div);

        this._updateJobTable.bind(this);
        this._getJobList.bind(this);
        this._updateJobInfo.bind(this);
        this._getJobResult.bind(this);
        this._setRowClick.bind(this);
    }

    update() {
        // pull new jobs list
        this._getJobList(this);
        // potentially update job details & results
        this._getJobResult();
    }

    async _getJobList(me:JobTable) {
        // console.log(this._username);
        const res:RequestResult = await getJobs(me._username);
        if(res.ok){
            let json_response:any = res.json();
            INotification.success("Get user jobs success.");
            // console.log(json_response);
            if (json_response['status_code'] === 200){
                // let resp = json_response['result'];
                me._table = json_response['table'];
                me._jobs = json_response['jobs'];
                me._displays = json_response['displays'];

                // catch case if user has no jobs
                let num_jobs = Object.keys(me._jobs).length;
                if (num_jobs > 0) {
                    // if job_id not set, pick 1st one
                    if (me._job_id === undefined || me._job_id === '') {
                        me._job_id = Object.keys(me._jobs)[0];
                    }
                    me._updateJobTable(me);
                    me._setRowClick('job-cache-display', function(){me._updateJobDisplay()});
                }
            } else {
                console.log('unable to get user job list');
                INotification.error("Get user jobs failed.");
            }
        } else {
            console.log('unable to get user job list');
            INotification.error("Get user jobs failed.");
        }
    }

    _updateJobTable(me:JobTable): void {
        let table:string = me._table;
        // console.log(table);
        if (document.getElementById('job-cache-display') !== null) {
            (<HTMLTextAreaElement>document.getElementById('job-cache-display')).innerHTML = table;
        } else {
            // create div for table if table doesn't already exist
            var div = document.createElement('div');
            div.setAttribute('id', 'job-table');
            div.setAttribute('resize','none');
            div.setAttribute('class','jp-JSONEditor-host');
            div.setAttribute('style','border-style:none;')

            // jobs table
            let textarea = document.createElement("table");
            textarea.id = 'job-cache-display';
            textarea.innerHTML = table;
            textarea.className = 'jp-JSONEditor-host';
            div.appendChild(textarea);
            this.node.appendChild(div);
        }

        let updateJobList = this._getJobList;
        // --------------------
        // refresh button
        // --------------------
        if (document.getElementById('job-refresh-button') === null) {
            let div = (<HTMLDivElement>document.getElementById('jobs-div'));
            if (div !== null) {
                let refreshBtn = document.createElement('button');
                refreshBtn.id = 'job-refresh-button';
                refreshBtn.className = 'jupyter-button';
                refreshBtn.innerHTML = 'Refresh Job List';
                refreshBtn.addEventListener('click', function() {updateJobList(me)}, false);
                let br = document.createElement('br');
                div.appendChild(br);
                div.appendChild(refreshBtn);
            }
        }
    }

    _updateJobInfo() {
        // create div for job info section
        // parent for everything, created in table response
        let div2 = (<HTMLDivElement>document.getElementById('jobs-div'));
        if (div2 != null) {
            // 1-time add line break and section header for job info
            if (document.getElementById('job-info-head') == null) {
                // line break
                var line = document.createElement('hr');
                div2.appendChild(line);
        
                // display header
                var detailHeader = document.createElement('h4');
                detailHeader.setAttribute('id','job-info-head');
                detailHeader.setAttribute('style','margin:0px');
                detailHeader.innerText = 'Job Information';
                div2.appendChild(detailHeader);
            }
      
            // --------------------
            // job info
            // --------------------
            // set description from response
            let disp = '';
            if (this._job_id !== undefined || this._job_id !== ''){
                disp = this._displays[this._job_id];
            }
    
            if (document.getElementById('job-detail-display') != null) {
                // console.log(this._job_id);
                (<HTMLTextAreaElement>document.getElementById('job-detail-display')).innerHTML = disp;
            } else {
                // create textarea if it doesn't already exist
                // detailed info on one job
                var display = document.createElement("textarea");
                display.id = 'job-detail-display';
                (<HTMLTextAreaElement>display).readOnly = true;
                (<HTMLTextAreaElement>display).cols = 30;
                (<HTMLTextAreaElement>display).innerHTML = disp;
                display.setAttribute('style', 'margin: 0px; height:17%; width: 98%; border: none; resize: none');
                display.className = 'jp-JSONEditor-host';
                div2.appendChild(display);
            }
        }
    }

    async _getJobResult() {
        if (this._job_id === undefined || this._job_id === '') {
            this._results = '<p> Job ID not selected.</p>';
            console.log('job id undefined/empty');
        } else if (this._jobs[this._job_id]['status'] !== 'job-completed') {
            this._results = '<p> Job '+this._job_id+' not complete</p>';
            console.log('job not complete');
        } else {
            console.log('looking up job results');
            const res:RequestResult = await getResults(this._job_id,this._username);
            // console.log(res);
            if (res.ok) {
                let json_response:any = res.json();
                
                if (json_response['status_code'] === 200) {
                    INotification.success("Get user job result success.");
                    this._results = json_response['results'];
                } else {
                    console.log('get user job result != 200');
                    INotification.error("Get user job result failed.");
                    this._results = '<p> Retrieving '+this._job_id+' result got'+json_response['status_code']+'</p>';
                }
            } else {
                console.log('unable to get user job result');
                INotification.error("Get user job result failed.");
            }
        }
        this._updateJobResult();
    }

    _updateJobResult() {
        // this._results = results;
        let outerDiv = (<HTMLDivElement>document.getElementById('jobs-div'));
        // section header formatting
        if (outerDiv === null) {
            outerDiv = document.createElement('div');
            outerDiv.setAttribute('id', this._resultsTableName+'-div');
            outerDiv.setAttribute('resize','none');
            outerDiv.setAttribute('class','jp-JSONEditor-host');
            outerDiv.setAttribute('style','border-style:none; overflow: auto');
        }
        // 1-time add line break and section header for job result
        if (document.getElementById('job-result-head') == null) {
            // line break
            let line = document.createElement('hr');
            outerDiv.appendChild(line);

            // display header
            let detailHeader = document.createElement('h4');
            detailHeader.setAttribute('id','job-result-head');
            detailHeader.setAttribute('style','margin:0px');
            detailHeader.innerText = 'Job Results';
            outerDiv.appendChild(detailHeader);
        }

        // update table
        if (document.getElementById(this._resultsTableName) !== null) {
            (<HTMLTextAreaElement>document.getElementById(this._resultsTableName)).innerHTML = this._results;
        } else {
          let display = document.createElement("table");
          display.id = this._resultsTableName;
          display.innerHTML = this._results;
          display.setAttribute('class','jp-JSONEditor-host');
          display.setAttribute('style','border-style:none; font-size:11px');
          outerDiv.appendChild(display);
        }
    }

    _updateJobDisplay() {
        this._updateJobInfo();
        this._getJobResult();
    }

    // set clickable rows
    _setRowClick(div_name:string, setDisplays:any) {
        let me = this;
        onRowClick(div_name, function(row:HTMLTableRowElement){
            let job_id = row.getElementsByTagName('td')[0].innerHTML;
            console.log('set new job id '+job_id);
            me._job_id = job_id;
            setDisplays(me);
            me._results = '';
        });
    }

}