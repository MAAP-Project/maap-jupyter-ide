import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { INotification } from 'jupyterlab_toastify';
import { RequestResult } from './request';
import { getAlgoList, describeAlgo, executeInputs, getJobs, getResults, getMetrics, onRowClick, DPSCall } from './funcs';
import '../style/index.css';
import { IStateDB } from '@jupyterlab/statedb';

export const WIDGET_CLASS = 'jp-Widget';
export const CONTENT_CLASS = 'jp-Inspector-content';

export var JOBS: {[k:string]:string} = {};
export var DISPLAYS: {[k:string]:string} = {};

// should be only 1 instance
// inside side panel
export class JobTable extends Widget {
    _username: string;
    _job_id: string;
    _table: string;
    _results: string;
    _metrics: string;
    _state: IStateDB;

    JOBS: {[k:string]:string};
    DISPLAYS: {[k:string]:string};

    _resultsTableName: string;
    _metricsTableName: string;

    constructor(uname:string, state:IStateDB) {
        super();
        this._username = uname;
        this._job_id = '';
        this._table = '';
        this._results = '';
        this._metrics = '';
        this._state = state;

        this.addClass(CONTENT_CLASS);
        this._resultsTableName = 'job-result-display';
        this._metricsTableName = 'job-metrics-display';

        let br = document.createElement('br');
        this.node.appendChild(br);

        let div = document.createElement('div');
        let p = document.createElement('p');
        p.innerText = '';
        div.appendChild(p);
        this.node.appendChild(div);

        this._setRowClick.bind(this);
    }

    _updateJobInfo() {
        // create div for job info section
        // parent for everything, created in table response
        let div2 = (document.getElementById('jobs-div') as HTMLDivElement);
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
                disp = DISPLAYS[this._job_id];
            }
    
            if (document.getElementById('job-detail-display') != null) {
                // console.log(this._job_id);
                (document.getElementById('job-detail-display') as HTMLTextAreaElement).innerHTML = disp;
            } else {
                // create textarea if it doesn't already exist
                // detailed info on one job
                let display:HTMLTextAreaElement = document.createElement("textarea");
                display.id = 'job-detail-display';
                display.readOnly = true;
                display.cols = 30;
                display.innerHTML = disp;
                display.setAttribute('style', 'margin: 0px; height:17%; width: 105%; border: none; resize: none; font-size: 11px');
                display.className = 'jp-JSONEditor-host';
                div2.appendChild(display);
            }
        }
    }

    _updateJobTable(me:JobTable): void {
        let table:string = me._table;
        // console.log(table);
        if (document.getElementById('job-cache-display') !== null) {
            (document.getElementById('job-cache-display') as HTMLTextAreaElement).innerHTML = table;
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
            let div = (document.getElementById('jobs-div') as HTMLDivElement);
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

    async _getJobList(me:JobTable) {
        const res:RequestResult = await getJobs(me._state, me._username);
        if(res.ok){
            let json_response:any = res.json();
            if (json_response['status_code'] === 200){
                INotification.success("Get user jobs success.");

                me._table = json_response['result'];
                JOBS = json_response['jobs'];
                DISPLAYS = json_response['displays'];

                // catch case if user has no jobs
                let num_jobs = Object.keys(JOBS).length;
                if (num_jobs > 0) {
                    // if job_id not set, pick 1st one
                    if (me._job_id === undefined || me._job_id === '') {
                        me._job_id = Object.keys(JOBS)[0];
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

    _updateJobResult() {
        // this._results = results;
        let outerDiv = (document.getElementById('jobs-div') as HTMLDivElement);
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
            (document.getElementById(this._resultsTableName) as HTMLTextAreaElement).innerHTML = this._results;
        } else {
          let display = document.createElement("table");
          display.id = this._resultsTableName;
          display.innerHTML = this._results;
          display.setAttribute('class','jp-JSONEditor-host');
          display.setAttribute('style','border-style:none; font-size:11px');
          outerDiv.appendChild(display);
        }
    }

    async _getJobResult() {
        if (this._job_id === undefined || this._job_id === '') {
            this._results = '<p> Job ID not selected.</p>';
            console.log('job id undefined/empty');
        } else if (JOBS[this._job_id]['status'] == 'job-started') {
            this._results = '<p> Job '+this._job_id+' not complete</p>';
            console.log('job not complete');
        } else {
            console.log('looking up job results');
            const res:RequestResult = await getResults(this._state, this._job_id,this._username);
            console.log(res);
            if (res.ok) {
                let json_response:any = res.json();
                
                if (json_response['status_code'] === 200) {
                    INotification.success("Get user job result success.");
                    this._results = json_response['result'];
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

    _updateJobMetrics() {
        let outerDiv = (document.getElementById('jobs-div') as HTMLDivElement);
        // section header formatting
        if (outerDiv === null) {
            outerDiv = document.createElement('div');
            outerDiv.setAttribute('id', this._metricsTableName+'-div');
            outerDiv.setAttribute('resize','none');
            outerDiv.setAttribute('class','jp-JSONEditor-host');
            outerDiv.setAttribute('style','border-style:none; overflow: auto');
        }
        // 1-time add line break and section header for job result
        if (document.getElementById('job-metrics-head') == null) {
            // line break
            let line = document.createElement('hr');
            outerDiv.appendChild(line);

            // display header
            let detailHeader = document.createElement('h4');
            detailHeader.setAttribute('id','job-metrics-head');
            detailHeader.setAttribute('style','margin:0px');
            detailHeader.innerText = 'Job Metrics';
            outerDiv.appendChild(detailHeader);
        }

        // update table
        console.log("These are the metrics");
        console.log(this._metrics);
        if (document.getElementById(this._metricsTableName) !== null) {
            (document.getElementById(this._metricsTableName) as HTMLTextAreaElement).innerHTML = this._metrics;
        } else {
          let display = document.createElement("table");
          display.id = this._metricsTableName;
          display.innerHTML = this._metrics;
          display.setAttribute('class','jp-JSONEditor-host');
          display.setAttribute('style','border-style:none; font-size:11px');
          outerDiv.appendChild(display);
        }
    }

    async _getJobMetrics() {
        if (this._job_id === undefined || this._job_id === '') {
            this._metrics = '<p> Job ID not selected.</p>';
            console.log('job id undefined/empty');
        } else if (JOBS[this._job_id]['status'] == 'job-started') {
            this._metrics = '<p> Job '+this._job_id+' not complete</p>';
            console.log('job not complete');
        } else {
            console.log('looking up job metrics');
            const res:RequestResult = await getMetrics(this._state, this._job_id,this._username);
            console.log(res);
            if (res.ok) {
                let json_response:any = res.json();
                
                if (json_response['status_code'] === 200) {
                    //INotification.success("Get user job metrics success.");
                    this._metrics = json_response['result'];
                } else {
                    console.log('get user job result != 200');
                    //INotification.error("Get user job metrics failed.");
                    this._results = '<p> Retrieving '+this._job_id+' metrics got'+json_response['status_code']+'</p>';
                }
            } else {
                console.log('unable to get user job metrics');
                //INotification.error("Get user job metrics failed.");
            }
        }
        this._updateJobMetrics();
    }

    _updateJobDisplay() {
        this._updateJobInfo();
        this._getJobResult();
        this._getJobMetrics();
    }

    update() {
        // pull new jobs list
        this._getJobList(this);
        // potentially update job details & results
        this._getJobResult();
        this._getJobMetrics();
    }

    // set clickable rows
    _setRowClick(tableId:string, setDisplays:any) {
        let me = this;
        onRowClick(tableId, function(row:HTMLTableRowElement){
            let job_id = row.getElementsByTagName('td')[0].innerHTML;
            console.log('set new job id '+job_id);
            me._job_id = job_id;
            setDisplays(me);
            me._results = '';
        });
    }

}

// inside main area
export class JobWidget extends Widget {
    _username: string;
    _algorithm: string;
    _version: string;
    _job_id: string;
    _widget_div: HTMLDivElement;
    
    _table: string;
    _results: string;
    _metrics: string;

    _widget_table_name: string;
    _algo_list_id: string;
    _execute_params_id: string;
    _resultsTableName: string;
    _metricsTableName: string;
    _state: IStateDB;

    constructor(uname:string, state: IStateDB) {
        super();
        this._username = uname;
        this._state = state;
        this._algorithm = '';
        this._version = '';
        this._job_id = '';
        
        this._widget_table_name = 'widget-job-cache-display';
        this._algo_list_id = 'algo-list-table';
        this._execute_params_id = 'execute-params-table';
        this._resultsTableName = 'widget-job-result-table';
        this._metricsTableName = 'widget-metrics-table';

        this._table = '';
        this._results = '';
        this._metrics = '';
        
        this.addClass(CONTENT_CLASS);
        this.addClass(WIDGET_CLASS);
        this.title.label = "DPS Jobs UI";
        this.title.closable = true;

        this._widget_div = document.createElement('div');
        this._widget_div.id = 'job-widget';

        let tabs = document.createElement('div');
        tabs.id = 'tab';
        tabs.setAttribute('class','tab');

        // button Run tab
        let runTab = document.createElement('button');
        runTab.setAttribute('id','defaultOpen');
        runTab.setAttribute('class','tablink active');
        runTab.onclick = (e) => {this._clickTab(event, 'run');};
        runTab.innerHTML = 'Run Jobs';

        // button Info tab
        let infoTab = document.createElement('button');
        infoTab.setAttribute('class','tablink');
        infoTab.onclick = (e) => {this._clickTab(event, 'info');};
        infoTab.innerHTML = 'Job Info';

        tabs.appendChild(runTab);
        tabs.appendChild(infoTab);
        this._widget_div.appendChild(tabs);

        this.node.appendChild(this._widget_div);
    }

    // RUN JOBS TAB ==============================================

    async _updateListCol(): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {
            let listCell = document.getElementById('cell-algolist') as HTMLTableCellElement;
            if (listCell) {
                // one-time create algo list header
                if (document.getElementById('algo-list-header') === null) {
                    let list_title = document.createElement('h3');
                    list_title.id = 'algo-list-header';
                    list_title.innerText = "Algorithm List";
                    listCell.appendChild(list_title);
                }
                
                const algoList:HTMLTableElement = function (algo_list_id:string) {
                    let algoList:HTMLTableElement = document.getElementById(algo_list_id) as HTMLTableElement;
                    if (!algoList) {
                        let algoListDiv = document.createElement('div');
                        algoListDiv.id = 'algo-list-div';
                        listCell.appendChild(algoListDiv);
                        
                        let algoList = document.createElement('table');
                        algoList.id = algo_list_id;
                        algoListDiv.appendChild(algoList);
                        return algoList;
                    } else {
                        return algoList;
                    }
                }(this._algo_list_id) as HTMLTableElement;

                algoList.innerHTML = '';
                algoList.createTHead() as HTMLTableSectionElement;
                algoList.createTBody() as HTMLTableSectionElement;
                let ahrow = algoList.tHead.insertRow(0) as HTMLTableRowElement;
                let acell = ahrow.insertCell(0);
                acell.innerHTML = "<i>Algorithms</i>";
                
                // helper function insert table rows for each algorithm/version
                let me:JobWidget = this;
                let insertAlgoRow = function(algo:string,version:string) {
                    // new table row per algo
                    let arow:HTMLTableRowElement = algoList.insertRow() as HTMLTableRowElement;
                    let acell = arow.insertCell();
                    acell.innerHTML = algo+':'+version;
                    arow.onclick = function() {
                        me._algorithm = algo;
                        me._version = version;
                        console.log('switching algo to '+algo);
                        console.log('algo switched to '+me._algorithm);
                        me.update();
                    }
                }
                
                // gets algorithm list and calls helper function
                const res:RequestResult =  await getAlgoList(this._state, this._username);
                if (res.ok) {
                    let json_response:any = res.json();
                    let algo_set = json_response['algo_set'];
                    for (var algo in algo_set) {
                        for (var version of algo_set[algo]) {
                            // if algo/version not set, set it to 1st algo/version
                            // if (this._algorithm === '' || this._version === '') {
                            //     this._algorithm = algo; 
                            //     this._version = version;
                            // }
                            insertAlgoRow(algo,version);
                        }
                    }
                    resolve();
                }
            }
            // resolve any other path
            resolve();
        });
    }

    // helper to setup and populate execute params table
    async _execute_params_table(paramdiv:HTMLDivElement) {
        // get inputs table
        const t:HTMLTableElement = function(paramdiv,execute_params_id) {
            let t:HTMLTableElement = document.getElementById(execute_params_id) as HTMLTableElement;
            if (t) {
                t.innerHTML = '';
            } else {
                t = document.createElement('table');
                t.id = execute_params_id;
                paramdiv.appendChild(t);
            }
            return t;
        }(paramdiv,this._execute_params_id) as HTMLTableElement;

        t.innerHTML = '';
        t.createTHead() as HTMLTableSectionElement;
        t.createTBody() as HTMLTableSectionElement;
        let hrow:HTMLTableRowElement = t.tHead.insertRow(0) as HTMLTableRowElement;
        let cell = hrow.insertCell(0);
        cell.innerHTML = "<i>Parameter</i>";
        cell = hrow.insertCell(1);
        cell.innerHTML = "<i>Value</i>";

        // create submit button
        let submit_btn_id = 'job-execute-button';
        let submitBtn:HTMLButtonElement = document.getElementById(submit_btn_id) as HTMLButtonElement;
        if (!submitBtn){
            submitBtn = document.createElement('button');
            submitBtn.id = submit_btn_id;
            submitBtn.className = 'execute-button';
            submitBtn.innerHTML = 'Execute Job';
    
            let br = document.createElement('br');
            paramdiv.appendChild(br);
            paramdiv.appendChild(submitBtn);
        }

        // inputs fields
        let inputsp:HTMLParagraphElement = document.getElementById('execute-inputs-p') as HTMLParagraphElement;
        if (inputsp) {
            inputsp.innerHTML = '';
        } else {
            inputsp = document.createElement('p');
            inputsp.id = 'execute-inputs-p';
            paramdiv.appendChild(inputsp);
        }
        // get params and populate table
        const res:RequestResult = await executeInputs(this._state, this._algorithm, this._version, this._username);
        if (res.ok) {
            let json_response: any = res.json();
            // format [[param1,type1],[param2,type2]]
            // add username param
            let params = json_response['ins'].concat([['username','string']]);
            // POPULATE ROWS WITH PARAMS
            for (var i of params){
                // format [param,type] -> param
                i = i[0]
                let inp = document.createElement('input');
                inp.id = (i+'-input');
                inp.classList.add(i);
                // pre-populate username field
                if (i === 'username') {
                  inp.value = this._username;
                  // username field is readonly and grey background
                  inp.readOnly = true;
                  inp.setAttribute('style','background-color : #d1d1d1');
                }

                let trow:HTMLTableRowElement = t.insertRow() as HTMLTableRowElement;
                let cell = trow.insertCell();
                cell.innerHTML = i+':';
                cell = trow.insertCell();
                cell.appendChild(inp);
            }

            // set submit button
            let me = this;
            let submit_fn = async function() {
                let p = '\nSubmitted:\n';
                let new_input_list = '';
                let kwargs = {};
                let keywords:string[] = ['algo_id','version','inputs','username'];
    
                for (let i of params) {
                    // format [param,type] -> param
                    i = i[0]
                    console.log(i)
                    let name = i+'-input';
                    let val = (document.getElementById(name) as HTMLInputElement).value;
                    // print submitted inputs visually
                    p = p.concat(i,': ',val,'\n');
                    new_input_list = new_input_list.concat(i,',');
                    kwargs[i] = val;
                    keywords.push(i);
                }
                kwargs['algo_id'] = me._algorithm;
                kwargs['version'] = me._version;
                kwargs['inputs'] = new_input_list;
                kwargs['username'] = me._username;
                
                // send execute request
                const res:RequestResult = await DPSCall(me._state, 'execute', keywords, kwargs);
                if (res.ok){
                    let json_response:any = res.json();
                    p = p.concat(json_response['result']);
                    inputsp.innerText = p
                } else {
                    p = p.concat("Error Sending Request.");
                    inputsp.innerText = p;
                }
            }
            submitBtn.onclick = submit_fn;
        }

    }
        
    async _updateExecuteCol(): Promise<void> {
        return new Promise<void> (async (resolve,reject) => {
            let algoUnselected = (this._algorithm === '' || this._algorithm === null);
            let executeCell:HTMLTableCellElement = document.getElementById('cell-execute') as HTMLTableCellElement;
            if (executeCell) {
                // one-time create algo execute header
                if (document.getElementById('execute-header') === null) {
                    let execute_title = document.createElement('h3');
                    execute_title.id = 'execute-header';
                    execute_title.innerText = "Execute Job";
                    executeCell.appendChild(execute_title);
                }

                // dynamically create algorithm header with selected algo name
                let execute_algoname:HTMLParagraphElement = document.getElementById('execute-algoname') as HTMLParagraphElement;
                if (execute_algoname) {
                    if (algoUnselected) {
                        execute_algoname.innerHTML = '<b>Algorithm: </b> No algorithm selected.';
                    } else {
                        execute_algoname.innerHTML = '<b>Algorithm: </b>    '+this._algorithm+':'+this._version;
                    }
                } else {
                    execute_algoname = document.createElement('p');
                    execute_algoname.id = 'execute-algoname';
                    if (algoUnselected) {
                        execute_algoname.innerHTML = '<b>Algorithm: </b> No algorithm selected.';
                    } else {
                        execute_algoname.innerHTML = '<b>Algorithm: </b>    '+this._algorithm+':'+this._version;
                    }
                    executeCell.appendChild(execute_algoname)
                }

                // one-time create execute inputs header
                if (document.getElementById('execute-subheader') === null) {
                    let execute_subtitle = document.createElement('h4');
                    execute_subtitle.id = 'execute-subheader';
                    execute_subtitle.innerText = "Inputs";
                    executeCell.appendChild(execute_subtitle);
                }

                // execute params table
                if (!algoUnselected){
                    const paramdiv:HTMLDivElement = function(param_div_id) {
                        let paramDiv:HTMLDivElement = document.getElementById(param_div_id) as HTMLDivElement;
                        if (!paramDiv) {
                            paramDiv = document.createElement('div');
                            paramDiv.id = 'execute-params-div';
                            executeCell.appendChild(paramDiv);
                            return paramDiv
                        } else {
                            return paramDiv;
                        }
                    } ('execute-params-div') as HTMLDivElement;
                    this._execute_params_table(paramdiv);
                }
            }
        })
    }

    async _updateOverviewCol(): Promise<void> {
        return new Promise<void> (async (resolve,reject) => {
            let overviewCell = document.getElementById('cell-overview') as HTMLTableCellElement;
            if (overviewCell) {
                // one-time create algo describe header
                if (document.getElementById('algo-describe-header') === null) {
                    let overview_title = document.createElement('h3');
                    overview_title.id = 'algo-describe-header';
                    overview_title.innerText = "Algorithm Overview";
                    overviewCell.appendChild(overview_title);
                }

                let pre_div_id = 'algo-describe-div';
                let preDiv:HTMLDivElement = document.getElementById(pre_div_id) as HTMLDivElement;
                if (preDiv) {
                    let pre = document.getElementById('algo-describe-pre');
                    // erase previous algorithm's overview
                    pre.innerHTML = '';
                    // re-populate div with describe call
                    if (this._algorithm === '' || this._version === '') {
                        pre.innerText = 'No algorithm selected.';
                        resolve();
                    } else {
                        const res: RequestResult = await describeAlgo(this._state, this._algorithm, this._version, this._username);
                        if (res.ok) {
                            let json_response:any = res.json();
                            let describe = json_response['result'];
                            pre.innerText = describe;
                            resolve();
                        }
                    }
                } else {
                    preDiv = document.createElement('div');
                    preDiv.id = pre_div_id;
                    overviewCell.appendChild(preDiv);
                    
                    let pre = document.createElement('pre');
                    pre.id = 'algo-describe-pre';
                    preDiv.appendChild(pre);
                    if (this._algorithm === '' || this._version === '') {
                        console.log('algorithm not set');
                        pre.innerText = 'No algorithm selected.';
                        resolve();
                    } else {
                        // populate div with describe call
                        const res: RequestResult = await describeAlgo(this._state, this._algorithm, this._version, this._username);
                        if (res.ok) {
                            let json_response:any = res.json();
                            let describe = json_response['result'];
                            pre.innerText = describe;
                            resolve();
                        }
                    }
                }
            }
            // resolve any other path
            resolve();
        });
    }

    _updateRunJobs() {
        // create run jobs tab div
        const runDiv: HTMLDivElement = function() {
            let runDiv: HTMLDivElement = document.getElementById('run') as HTMLDivElement;
            if (runDiv) {
                return runDiv;
            } else {
                runDiv = document.createElement('div');
                runDiv.id = 'run';
                runDiv.setAttribute('class','tabcontent');
                runDiv.setAttribute('style','height: 100%; display: block');
                return runDiv;
            }
        }() as HTMLDivElement;

        // create html table within run jobs content table
        let runTable:HTMLTableElement = document.getElementById('algorithmrun') as HTMLTableElement;
        if (!runTable) {
            runTable = document.createElement('table');
            runTable.setAttribute('id','algorithmrun');
            runTable.setAttribute('class','colPadding');

            let rrow = runTable.insertRow() as HTMLTableRowElement;

            let listCell = rrow.insertCell();
            listCell.setAttribute('id','cell-algolist');
            listCell.setAttribute('valign','top');
            listCell.setAttribute('style','min-width:295px');

            let executeCell = rrow.insertCell();
            executeCell.setAttribute('id','cell-execute');
            executeCell.setAttribute('valign','top');

            let overviewCell = rrow.insertCell();
            overviewCell.setAttribute('id','cell-overview');
            overviewCell.setAttribute('valign','top');

            runDiv.appendChild(runTable);
            this._widget_div.appendChild(runDiv);
        }

        // update run jobs content
        this._updateListCol().then( () => this._updateOverviewCol()
            ).then( () => this._updateExecuteCol() 
            );
        
    }

    // JOB INFO TAB ==============================================

    _updateInfoCol() {
        let infoCell = document.getElementById('cell-jobinfo');
        if (infoCell) {
            let infoHead = document.getElementById('info-name');
            if (infoHead === null) {
                infoHead = document.createElement('h3');
                infoHead.innerText = 'Job Information';
                infoHead.id = 'info-name';
                infoCell.appendChild(infoHead);
            }

            let pre = document.getElementById('info-pre');
            if (pre !== null) {
                pre.innerHTML = DISPLAYS[this._job_id];
            } else {
                pre = document.createElement('pre');
                pre.id = 'info-pre';
                // console.log('check '+this._job_id);
                pre.innerHTML = DISPLAYS[this._job_id];
                infoCell.appendChild(pre);
                
                let br2 = document.createElement('br');
                infoCell.appendChild(br2);
            }

            let job_id = this._job_id;
            let uname = this._username;
            let state = this._state;

            // Delete Job Button
            // redefine delete btn with current job_id
            let delete_fn = async function() {
                const res:RequestResult = await DPSCall(state, 'delete',['job_id','username'],{'job_id':job_id,'username':uname});
                if (res.ok) {
                    let json_response:any = res.json();
                    let result = json_response['result'];

                    let body = document.createElement('div');
                    body.style.display = 'flex';
                    body.style.flexDirection = 'column';

                    let textarea = document.createElement("div");
                    textarea.id = 'delete-button-text';
                    textarea.style.display = 'flex';
                    textarea.style.flexDirection = 'column';
                    textarea.innerHTML = "<pre>"+result+"</pre>";

                    body.appendChild(textarea);
                    showDialog({
                    title: 'Delete Job',
                    body: new Widget({node:body}),
                    focusNodeSelector: 'input',
                    buttons: [Dialog.okButton({label: 'Ok'})]
                    });
                }
            }
            let deleteBtn:HTMLButtonElement = document.getElementById('job-delete-button-widget') as HTMLButtonElement;
            if (deleteBtn){
                // set delete fn
                deleteBtn.onclick = delete_fn;
            } else {
                // create delete button
                deleteBtn = document.createElement('button');
                deleteBtn.setAttribute('id','job-delete-button-widget');
                deleteBtn.setAttribute('class','jupyter-button');
                deleteBtn.innerText = "Delete Job";
                infoCell.appendChild(deleteBtn);
                
                let span = document.createElement('span');
                span.innerText = '     ';
                infoCell.appendChild(span);
                
                // set delete fn
                deleteBtn.onclick = delete_fn;
            }

            // Dismiss Job Button
            // redefine dismiss btn with current job_id
            let dismiss_fn = async function() {
                const res:RequestResult = await DPSCall(state, 'dismiss',['job_id','username'],{'job_id':job_id,'username':uname});
                if (res.ok) {
                    let json_response:any = res.json();
                    let result = json_response['result'];

                    let body = document.createElement('div');
                    body.style.display = 'flex';
                    body.style.flexDirection = 'column';

                    let textarea = document.createElement("div");
                    textarea.id = 'dismiss-button-text';
                    textarea.style.display = 'flex';
                    textarea.style.flexDirection = 'column';
                    textarea.innerHTML = "<pre>"+result+"</pre>";

                    body.appendChild(textarea);
                    showDialog({
                    title: 'Dismiss Job',
                    body: new Widget({node:body}),
                    focusNodeSelector: 'input',
                    buttons: [Dialog.okButton({label: 'Ok'})]
                    });
                } 
            }
            let dismissBtn:HTMLButtonElement = document.getElementById('job-dismiss-button-widget') as HTMLButtonElement;
            if (dismissBtn) {
                // set dismiss fn
                dismissBtn.onclick = dismiss_fn;
            } else {
                // create dismiss btn
                dismissBtn = document.createElement('button');
                dismissBtn.setAttribute('id','job-dismiss-button-widget');
                dismissBtn.setAttribute('class','jupyter-button');
                dismissBtn.innerText = "Dismiss Job";
                infoCell.appendChild(dismissBtn);

                dismissBtn.onclick = dismiss_fn;
            }
        }
    }

    _updateJobResult() {
        let outerDiv = document.getElementById(this._resultsTableName+'-div') as HTMLDivElement;
        // update table
        if (document.getElementById(this._resultsTableName) !== null) {
            // update table
            (document.getElementById(this._resultsTableName) as HTMLTextAreaElement).innerHTML = this._results;
        } else {
            let display = document.createElement("table");
            display.id = this._resultsTableName;
            display.innerHTML = this._results;
            display.setAttribute('class','jp-JSONEditor-host');
            display.setAttribute('style','border-style:none; font-size:11px');
            outerDiv.appendChild(display);
        }
    }

    async _getJobResult() {
        if (this._job_id === undefined || this._job_id === '') {
            this._results = '<p> Job ID not selected.</p>';
            console.log('job id undefined/empty');
        } else if (JOBS[this._job_id]['status'] == 'job-started') {
            this._results = '<p> Job '+this._job_id+' not complete.</p>';
            console.log('job not complete');
        } else {
            console.log('looking up job results');
            const res:RequestResult = await getResults(this._state, this._job_id,this._username);
            console.log(res);
            if (res.ok) {
                let json_response:any = res.json();
                
                if (json_response['status_code'] === 200) {
                    INotification.success("Get user job result success.");
                    this._results = json_response['result'];
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

    _updateResultsCol() {
        let resultsCell = document.getElementById('cell-jobresults');
        if (resultsCell) {
            // one-time section header
            let resultsHead = document.getElementById('results-name');
            if (resultsHead === null){
                resultsHead = document.createElement('h3');
                resultsHead.id = 'results-name';
                resultsHead.innerText = 'Job Results';
                resultsCell.appendChild(resultsHead);
            }

            // results table
            let outerDiv = document.getElementById(this._resultsTableName+'-div') as HTMLDivElement;
            // section header formatting
            if (outerDiv === null) {
                outerDiv = document.createElement('div');
                outerDiv.setAttribute('id', this._resultsTableName+'-div');
                outerDiv.setAttribute('resize','none');
                outerDiv.setAttribute('class','jp-JSONEditor-host');
                outerDiv.setAttribute('style','border-style:none; overflow: auto');
                resultsCell.append(outerDiv);
                this._getJobResult();
            } else {
                this._getJobResult();
            }
        }
    }

    _updateJobMetrics() {
        let outerDiv = document.getElementById(this._metricsTableName+'-div') as HTMLDivElement;
        // update table
        if (document.getElementById(this._metricsTableName) !== null) {
            // update table
            (document.getElementById(this._metricsTableName) as HTMLTextAreaElement).innerHTML = this._metrics;
        } else {
            let display = document.createElement("table");
            display.id = this._metricsTableName;
            display.innerHTML = this._metrics;
            display.setAttribute('class','jp-JSONEditor-host');
            display.setAttribute('style','border-style:none; font-size:11px');
            outerDiv.appendChild(display);
        }
    }

    async _getJobMetrics() {
        if (this._job_id === undefined || this._job_id === '') {
            this._metrics = '<p> Job ID not selected.</p>';
            console.log('job id undefined/empty');
        } else if (JOBS[this._job_id]['status'] == 'job-started') {
            this._metrics = '<p> Job '+this._job_id+' not complete.</p>';
            console.log('job not complete');
        } else {
            console.log('looking up job metrics 2');
            const res:RequestResult = await getMetrics(this._state, this._job_id,this._username);
            const res1:RequestResult = await getResults(this._state, this._job_id,this._username);
            console.log(res);
            console.log(res1)
            if (res.ok) {
                let json_response:any = res.json();
                
                if (json_response['status_code'] === 200) {
                    //INotification.success("Get user job metrics success.");
                    this._metrics = json_response['result'];
                    console.log(this._metrics);
                } else {
                    console.log('get user job metrics != 200');
                    //INotification.error("Get user job metrics failed.");
                    this._metrics = '<p> Retrieving '+this._job_id+' result got'+json_response['status_code']+'</p>';
                }
            } else {
                console.log('unable to get user job metrics');
                //INotification.error("Get user job metrics failed.");
            }
        }
        this._updateJobMetrics();
    }
    
    _updateMetricsRow() {
        let metricsCell = document.getElementById('cell-jobmetrics');
        if (metricsCell) {
            // one-time metrics section header
            let metricsHead = document.getElementById('metrics-name');
            if (metricsHead === null){
                metricsHead = document.createElement('h3');
                metricsHead.id = 'metrics-name';
                metricsHead.innerText = 'Job Metrics';
                metricsCell.appendChild(metricsHead);
            }

            // metrics table
            let outerDiv = document.getElementById(this._metricsTableName+'-div') as HTMLDivElement;
            // section header formatting
            if (outerDiv === null) {
                outerDiv = document.createElement('div');
                outerDiv.setAttribute('id', this._metricsTableName+'-div');
                outerDiv.setAttribute('resize','none');
                outerDiv.setAttribute('class','jp-JSONEditor-host');
                outerDiv.setAttribute('style','border-style:none; overflow: auto');
                metricsCell.appendChild(outerDiv);
                this._getJobMetrics();
            } else {
                this._getJobMetrics();
            }
        }
    }

    _updateJobInfo() {
        const infoDiv: HTMLDivElement = function() {
            let infoDiv = document.getElementById('info');
            if (infoDiv) {
                return infoDiv;
            } else {
                infoDiv = document.createElement('div');
                infoDiv.setAttribute('id','info');
                infoDiv.setAttribute('class','tabcontent');
                infoDiv.setAttribute('style','height: 100%; display: none');
                return infoDiv;
            }
        }() as HTMLDivElement;

        // create html table with job info content table
        let infoTable: HTMLTableElement = document.getElementById('infotable') as HTMLTableElement;
        if (!infoTable) {
            infoTable = document.createElement('table');
            infoTable.setAttribute('id','infotable');
            infoTable.setAttribute('class','colPadding');

            let rrow = infoTable.insertRow() as HTMLTableRowElement;

            let infoCell = rrow.insertCell();
            infoCell.setAttribute('id','cell-jobinfo');
            infoCell.setAttribute('valign','top');
            infoCell.setAttribute('style','min-width:360px');

            let resultsCell = rrow.insertCell();
            resultsCell.setAttribute('id','cell-jobresults');
            resultsCell.setAttribute('valign','top');
            resultsCell.setAttribute('style','min-width:360px');

            // rrow = infoTable.insertRow() as HTMLTableRowElement;

            let metricsCell = rrow.insertCell();
            metricsCell.setAttribute('id','cell-jobmetrics');
            metricsCell.setAttribute('valign','top');
            metricsCell.setAttribute('style','min-width:720px');
            metricsCell.setAttribute('colspan','2');

            infoDiv.appendChild(infoTable);
            this._widget_div.appendChild(infoDiv);
        }

        // update job info content
        this._updateInfoCol();
        this._updateResultsCol();
        this._updateMetricsRow();
    }

    // OTHER.     ==============================================

    _updateJobTable(me:JobWidget) {
        let table:string = me._table
        let textarea:HTMLTextAreaElement = document.getElementById('widget-job-table') as HTMLTextAreaElement;
        if (textarea) {
            textarea.innerHTML = table;
            // textarea.id = me._widget_table_name;
        } else {
            // create div for jobid table if table doesn't already exist
            let div = document.createElement('div');
            div.setAttribute('id', 'widget-job-table');
            div.setAttribute('resize','none');
            div.setAttribute('class','jp-JSONEditor-host');
            div.setAttribute('style','border-style:none; font-size:14px;');

            // jobs table
            let textarea = document.createElement("table");
            textarea.id = me._widget_table_name;
            textarea.innerHTML = table;

            div.appendChild(textarea);

            // 1-time attach div to widget div
            let jw_div = me._widget_div;
            let h = document.getElementById('widget-job-table-header') as HTMLHeadingElement;
            if (jw_div && !h){
                jw_div.appendChild(document.createElement('hr'));
                h = document.createElement('h3');
                h.id = 'widget-job-table-header';
                h.innerText = 'Submitted Jobs';
                jw_div.appendChild(h);
                jw_div.appendChild(div);
            }
        }
    }

    async _getJobList(me:JobWidget) {
        const res:RequestResult = await getJobs(this._state, this._username);
            if(res.ok){
                let json_response:any = res.json();
                if (json_response['status_code'] === 200){
                    INotification.success("Get user jobs success.");
                    
                    me._table = json_response['table'];
                    JOBS = json_response['jobs'];
                    DISPLAYS = json_response['displays'];

                    // catch case if user has no jobs
                    let num_jobs = Object.keys(JOBS).length;
                    if (num_jobs > 0) {
                        // if job_id not set, pick 1st one
                        if (this._job_id === undefined || this._job_id === '') {
                            this._job_id = Object.keys(JOBS)[0];
                        }
                        me._updateJobTable(me);
                        me._setJobClick('widget-job-table', function(){me._updateJobInfo()})
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

    update() {
        // update tabs content
        this._updateRunJobs();
        this._updateJobInfo();

        // jobtable below
        this._getJobList(this);
        
        console.log('update UI 2');
    }

    _clickTab(evt, section:string) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }
        document.getElementById(section).style.display = "block";
        evt.currentTarget.className += " active";
    }

    // set clickable rows
    _setJobClick(tableId:string, setDisplays:any) {
        let me = this;
        onRowClick(tableId, function(row:HTMLTableRowElement){
            let job_id = row.getElementsByTagName('td')[0].innerHTML;
            console.log('widget set new job id '+job_id);
            me._job_id = job_id;
            setDisplays(me);
            me._results = '';
        });
    }
}
