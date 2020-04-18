import { PageConfig } from '@jupyterlab/coreutils'
import { Widget } from '@phosphor/widgets';
import { INotification } from "jupyterlab_toastify";
import { getUserInfo } from "./getKeycloak";
import { request, RequestResult } from './request';
import { WIDGET_CLASS, CONTENT_CLASS } from './panel';
import { getJobs, getJobMetrics, getJobResults, updateResultsTable, onRowClick, deleteDismissJob, DISPLAYS } from './funcs';
import '../style/index.css';

// MainArea Widget
// Intended layout(functions):
//  -------------------------------------------------------------------
//   Run Jobs                 |  Job Info
//  (update,_populateRunJobs) |(update,_populateJobInfo)
//  ===================================================================
//     Algorithm List    |   Execute Job        |  Algorithm Info
//  (_populateRunJobs)   | (_populateRunJobs)   | (_populateRunJobs)
//  (_populateListTable) | (_updateExecuteCol)  |(_updateOverviewCol)
//   (_setAlgoClick)     |(_populateExecuteTable|(_populateOverviewCol)
//  -------------------------------------------------------------------
//   Jobs Table (update)
//  -------------------------------------------------------------------
export class JobWidget extends Widget {
  _username: string;
  _algorithm: string;
  _version: string;
  _job_id: string;0

  // names
  _widget_table_name: string;
  _algo_list_id: string;
  _execute_params_id: string;

  constructor() {
    super();
    this.addClass(CONTENT_CLASS);
    this.addClass(WIDGET_CLASS);
    this._algorithm = 'dps_plot';   // FOR TESTING
    this._version = 'master';       // FOR TESTING
    this._job_id = '';

    this._widget_table_name = 'widget-job-cache-display';
    this._algo_list_id = 'algo-list-table';
    this._execute_params_id = 'execute-params-table';

    // set username on start
    // callback should finish before users manage to do anything
    // now profile timing out shouldn't be a problem
    let me = this;
    getUserInfo(function(profile: any) {
      if (profile['cas:username'] === undefined) {
        INotification.error("Get username failed.");
        me._username = 'anonymous';
      } else {
        me._username = profile['cas:username'];
        INotification.success("Got username.");
        me.update();
      }
    });

    let job_widget = document.createElement('div');
    job_widget.id = 'job-widget';

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
    job_widget.appendChild(tabs);

    this._populateRunJobs(job_widget);
    this._populateJobInfo(job_widget);

    this.node.appendChild(job_widget);

    this._setAlgoClick(this._algo_list_id);
  }

  /* Handle update requests for the widget. */
  update() {
    let me = this;
    // update execute, overview when algo chosen
    this._updateListCol();
    this._updateExecuteCol();
    this._updateOverviewCol();
    
    // update jobinfo when job chosen
    this._updateInfoCol();
    this._updateResultsCol();
    this._updateMetricsRow();

    if (document.getElementById(this._widget_table_name) != null) {
      getJobs(this._username,this._job_id,function(job_id:string){me._job_id=job_id;},function(me:JobWidget, table:string){
        (<HTMLTextAreaElement>document.getElementById(me._widget_table_name)).innerHTML = table;
        // set widget job table clickable rows
        me._setJobClick(me._widget_table_name);
      },me);
    } else {
      // create div for jobid table if table doesn't already exist
      var div = document.createElement('div');
      div.setAttribute('id', 'widget-job-table');
      div.setAttribute('resize','none');
      div.setAttribute('class','jp-JSONEditor-host');
      div.setAttribute('style','border-style:none;');

      // jobs table
      var textarea = document.createElement("table");
      textarea.id = this._widget_table_name;
      getJobs(this._username,this._job_id,function(job_id:string){me._job_id=job_id;},function(me:JobWidget, table:string){
        textarea.innerHTML = table;
        // set widget job table clickable rows
        me._setJobClick(me._widget_table_name);
      },me);
      div.appendChild(textarea);
      let jw_div = document.getElementById('job-widget');
      if (jw_div != null){
        jw_div.appendChild(document.createElement('hr'));
        let h = document.createElement('h3');
        h.innerText = 'Submitted Jobs';
        jw_div.appendChild(h);
        jw_div.appendChild(div);
      }
    }
  }

  // RUN JOBS TAB ==============================================

  _populateRunJobs(job_widget: HTMLDivElement) {
    let runDiv = document.createElement('div');
    runDiv.setAttribute('id','run');
    runDiv.setAttribute('class','tabcontent');
    runDiv.setAttribute('style','height: 100%; display: block');

    let runTable = document.createElement('table');
    runTable.setAttribute('id','algorithmrun');
    runTable.setAttribute('class','colPadding');
    let rrow = <HTMLTableRowElement> runTable.insertRow();
    
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

    this._updateListCol();
    this._updateExecuteCol();
    this._updateOverviewCol();

    runDiv.appendChild(runTable);
    job_widget.appendChild(runDiv);
  }

  _updateListCol() {
    let listCell = <HTMLTableCellElement> document.getElementById('cell-algolist');
    if (listCell != null) {

      // one-time create algo list header
      if (document.getElementById('algo-list-header') == null) {
        let list_title = document.createElement('h3');
        list_title.id = 'algo-list-header';
        list_title.innerText = "Algorithm List";
        listCell.appendChild(list_title);
      }

      // populate algo list
      let algolist = <HTMLTableElement> document.getElementById(this._algo_list_id);
      if (document.getElementById('algo-list-div') != null){
        algolist.innerHTML = '';
        <HTMLTableSectionElement> algolist.createTHead();
        <HTMLTableSectionElement> algolist.createTBody();
        let ahrow = <HTMLTableRowElement> algolist.tHead.insertRow(0);
        let acell = ahrow.insertCell(0);
        acell.innerHTML = "<i>Algorithms</i>";
        this._populateListTable();
      } else {
        let algolistdiv = document.createElement('div');
        algolistdiv.id = 'algo-list-div'
        listCell.appendChild(algolistdiv);
        
        let algolist = document.createElement('table');
        algolist.id = this._algo_list_id;
        algolistdiv.appendChild(algolist);

        <HTMLTableSectionElement> algolist.createTHead();
        <HTMLTableSectionElement> algolist.createTBody();
        let ahrow = <HTMLTableRowElement> algolist.tHead.insertRow(0);
        let acell = ahrow.insertCell(0);
        acell.innerHTML = "<i>Algorithms</i>";
        this._populateListTable();
      }
    }
  }

  _populateListTable() {
    let me = this;
    let algolist = <HTMLTableElement> document.getElementById(this._algo_list_id);
    // get list of algos by request
    var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listAlgorithms');
    let insertAlgoRow = function(algo:string,version:string) {
      // new table row per algo
      let arow = <HTMLTableRowElement> algolist.insertRow();
        let acell = arow.insertCell();
        acell.innerHTML = algo+':'+version;
        arow.onclick = function() {
          me._algorithm = algo;
          me._version = version;
          console.log('switching algo to '+algo);
          console.log('switching algo to '+me._algorithm);
          me.update();
        }
    }
    console.log(requestUrl.href);
    request('get',requestUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        let algo_set = json_response['algo_set'];
        for (var algo in algo_set) {
          for (var version of algo_set[algo]) {
            insertAlgoRow(algo,version);
          }
        }
      }
    });

    // make algo rows clickable
    this._setAlgoClick(this._algo_list_id);
  }

  _setAlgoClick(tableId:string) {
    let me = this;
    onRowClick(tableId, function(row:HTMLTableRowElement) {
      let algoId = row.getElementsByTagName('td')[0].innerHTML;
      let lst = algoId.split(':');
      me._algorithm = lst[0];
      me._version = lst[1];
      me.update();
    });
  }

  _updateExecuteCol() {
    let executeCell = <HTMLTableCellElement> document.getElementById('cell-execute');
    if (executeCell != null) {
      if (document.getElementById('execute-header') == null) {
        let execute_title = document.createElement('h3');
        execute_title.id = 'execute-header';
        execute_title.innerText = "Execute Job";
        executeCell.appendChild(execute_title);
      }

      if (document.getElementById('execute-algoname') == null) {
        let execute_algoname = document.createElement('p');
        execute_algoname.id = 'execute-algoname';
        execute_algoname.innerHTML = '<b>Algorithm: </b>    '+this._algorithm+':'+this._version;
        executeCell.appendChild(execute_algoname);
      } else {
        console.log('algorithm is now '+this._algorithm);
        let execute_algoname = document.getElementById('execute-algoname');
        execute_algoname.innerHTML = '<b>Algorithm: </b>    '+this._algorithm+':'+this._version;
      }

      if (document.getElementById('execute-subheader') == null) {
        let execute_subtitle = document.createElement('h4');
        execute_subtitle.id = 'execute-subheader';
        execute_subtitle.innerText = "Inputs";
        executeCell.appendChild(execute_subtitle);
      }

      // create params table if not exists
      if (document.getElementById('execute-params-div') == null) {
        let paramdiv = document.createElement('div');
        paramdiv.id = 'execute-params-div'
        executeCell.appendChild(paramdiv);

        // inputs TABLE
        let t = document.createElement('table');
        t.id = this._execute_params_id;
        paramdiv.appendChild(t);

        <HTMLTableSectionElement> t.createTHead();
        <HTMLTableSectionElement> t.createTBody();
        let hrow = <HTMLTableRowElement> t.tHead.insertRow(0);
        let cell = hrow.insertCell(0);
        cell.innerHTML = "<i>Parameter</i>";
        cell = hrow.insertCell(1);
        cell.innerHTML = "<i>Value</i>";

        // SUBMIT BUTTON
        let submitBtn = document.createElement('button');
        submitBtn.id = 'job-execute-button';
        submitBtn.className = 'execute-button';
        submitBtn.innerHTML = 'Execute Job';
        let br = document.createElement('br');
        paramdiv.appendChild(br);
        paramdiv.appendChild(submitBtn);

        let inputsp = document.createElement('p');
        inputsp.id = 'execute-inputs-p';
        paramdiv.appendChild(inputsp);

        this._populateExecuteTable();
      } else {
        // wipe params table if it already exists
        let t = <HTMLTableElement> document.getElementById(this._execute_params_id);
        t.innerHTML = '';
        <HTMLTableSectionElement> t.createTHead();
        <HTMLTableSectionElement> t.createTBody();
        let hrow = <HTMLTableRowElement> t.tHead.insertRow(0);
        let cell = hrow.insertCell(0);
        cell.innerHTML = "<i>Parameter</i>";
        cell = hrow.insertCell(1);
        cell.innerHTML = "<i>Value</i>";

        let inputsp = <HTMLParagraphElement> document.getElementById('execute-inputs-p');
        inputsp.innerHTML = '';        
        this._populateExecuteTable();
      }
    }
  }

  _populateExecuteTable() {
    let me = this;
    // (re-)populate params table with new algorithm's params
    let t = <HTMLTableElement> document.getElementById(this._execute_params_id);
    let submitBtn = <HTMLButtonElement> document.getElementById('job-execute-button');
    let inputsp = <HTMLParagraphElement> document.getElementById('execute-inputs-p');
    // request to get algo params
    var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/executeInputs');
    requestUrl.searchParams.append('algo_id', this._algorithm);
    requestUrl.searchParams.append('version', this._version);
    console.log(requestUrl.href);
    request('get',requestUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
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
          if (i == 'username') {
            inp.value = this._username;
            // username field is readonly and grey background
            inp.readOnly = true;
            inp.setAttribute('style','background-color : #d1d1d1');
          }
          
          let trow = <HTMLTableRowElement> t.insertRow();
          let cell = trow.insertCell();
          cell.innerHTML = i+':';
          cell = trow.insertCell();
          cell.appendChild(inp);
        }
        // Set submit button to use new params list
        let submit_fn = function() {
          let p = '\nSubmitted:\n';
          let new_input_list = "";
          var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/execute');
          for (let i of params) {
            // format [param,type] -> param
            i = i[0]
            console.log(i);
            let name = i+'-input';
            let val = (<HTMLInputElement>document.getElementById(name)).value;
            // print submitted inputs visually
            p = p.concat(i,': ',val,'\n');
            new_input_list = new_input_list.concat(i,',');
            // add to request
            requestUrl.searchParams.append(i, val);
          }
          inputsp.innerText = p;
          // add algo identifier info
          requestUrl.searchParams.append('algo_id', me._algorithm);
          requestUrl.searchParams.append('version', me._version);
          requestUrl.searchParams.append('inputs', new_input_list);
          console.log(requestUrl.href);

          // send the execute request
          request('get', requestUrl.href).then((res: RequestResult) => {
            if(res.ok){
              let json_response:any = res.json();
              p = p.concat(json_response['result']);
              inputsp.innerText = p;
            } else {
              p = p.concat("Error Sending Request.");
              inputsp.innerText = p;
            }
          });
        }
        submitBtn.onclick = submit_fn;
      }
    });
  }

  _updateOverviewCol() {
    let overviewCell = <HTMLTableCellElement> document.getElementById('cell-overview');
    if (overviewCell != null) {
      if (document.getElementById('algo-describe-header') == null) {
        let overview_title = document.createElement('h3');
        overview_title.id = 'algo-describe-header';
        overview_title.innerText = "Algorithm Overview";
        overviewCell.appendChild(overview_title);
      }

      if (document.getElementById('algo-describe-div') == null) {
        let prediv = document.createElement('div');
        prediv.id = 'algo-describe-div';
        overviewCell.appendChild(prediv);

        let pre = document.createElement('pre');
        pre.id = 'algo-describe-pre';
        prediv.appendChild(pre);
        this._populateOverviewCol();
      } else {
        let pre = document.getElementById('algo-describe-pre');
        pre.innerHTML = '';
        this._populateOverviewCol();
      }
    }
  }

  _populateOverviewCol() {
    let pre = <HTMLPreElement> document.getElementById('algo-describe-pre');
    // request to get algo description
    var requestUrl = new URL(PageConfig.getBaseUrl() + 'hysds/describeProcess');
    requestUrl.searchParams.append('algo_id', this._algorithm);
    requestUrl.searchParams.append('version', this._version);
    console.log(requestUrl.href);
    request('get',requestUrl.href).then((res: RequestResult) => {
      if (res.ok) {
        var json_response:any = res.json();
        let describe = json_response['result'];
        pre.innerText = describe;
      }
    });
  }

  // JOB INFO TAB ==============================================

  _populateJobInfo(job_widget: HTMLDivElement) {
    let infoDiv = document.createElement('div');
    infoDiv.setAttribute('id','info');
    infoDiv.setAttribute('class','tabcontent');
    infoDiv.setAttribute('style','height: 100%; display: none');

    job_widget.appendChild(infoDiv);

    let infoTable = document.createElement('table');
    infoTable.setAttribute('id','infotable');
    infoTable.setAttribute('class','colPadding');

    let rrow = <HTMLTableRowElement> infoTable.insertRow();

    let infoCell = rrow.insertCell();
    infoCell.setAttribute('id','cell-jobinfo');
    infoCell.setAttribute('valign','top');
    infoCell.setAttribute('style','min-width:360px');

    let resultsCell = rrow.insertCell();
    resultsCell.setAttribute('id','cell-jobresults');
    resultsCell.setAttribute('valign','top');
    resultsCell.setAttribute('style','min-width:360px');

    rrow = <HTMLTableRowElement> infoTable.insertRow();

    let metricsCell = rrow.insertCell();
    metricsCell.setAttribute('id','cell-jobmetrics');
    metricsCell.setAttribute('valign','top');
    metricsCell.setAttribute('style','min-width:720px')

    infoDiv.appendChild(infoTable);
    job_widget.appendChild(infoDiv);
  }

  _updateInfoCol() {
    let infoCell = document.getElementById('cell-jobinfo');
    if (infoCell != null) {
      let infoHead = document.getElementById('info-name');
      if (infoHead == null) {
        infoHead = document.createElement('h3');
        infoHead.innerText = 'Job Information';
        infoHead.id = 'info-name';
        infoCell.appendChild(infoHead);
      }

      let pre = document.getElementById('info-pre');
      if (pre != null) {
        pre.innerHTML = DISPLAYS[this._job_id];
      } else {
        pre = document.createElement('pre');
        pre.id = 'info-pre';
        pre.innerHTML = DISPLAYS[this._job_id];
        infoCell.appendChild(pre);
        
        let br2 = document.createElement('br');
        infoCell.appendChild(br2);
      }

      // Delete Job Button
      let deleteBtn = <HTMLButtonElement>document.getElementById('job-delete-button-widget');
      if (deleteBtn != null){
        // set delete fn
        deleteDismissJob(deleteBtn,this._job_id,'delete');
      } else {
        deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('id','job-delete-button-widget');
        deleteBtn.setAttribute('class','jupyter-button');
        deleteBtn.innerText = "Delete Job";
        infoCell.appendChild(deleteBtn);
        
        let span = document.createElement('span');
        span.innerText = '     ';
        infoCell.appendChild(span);
        deleteDismissJob(deleteBtn,this._job_id,'delete');
      }

      // Dismiss Job Button
      let dismissBtn = <HTMLButtonElement>document.getElementById('job-dismiss-button-widget');
      if (dismissBtn != null ){
        // set dismiss fn
        deleteDismissJob(dismissBtn,this._job_id,'dismiss');
      } else {
        dismissBtn = document.createElement('button');
        dismissBtn.setAttribute('id','job-dismiss-button-widget');
        dismissBtn.setAttribute('class','jupyter-button');
        dismissBtn.innerText = "Dismiss Job";
        infoCell.appendChild(dismissBtn);
        deleteDismissJob(dismissBtn,this._job_id,'dismiss');
      }
    }
  }

  _updateResultsCol() {
    let resultsCell = document.getElementById('cell-jobresults');
    if (resultsCell != null) {
      // section header
      let resultsHead = document.getElementById('results-name');
      if (resultsHead == null){
        resultsHead = document.createElement('h3');
        resultsHead.id = 'results-name';
        resultsHead.innerText = 'Job Results';
        resultsCell.appendChild(resultsHead);
      }

      // results table
      let resultsTableDiv = <HTMLDivElement>document.getElementById('results-table-div');
      if (resultsTableDiv != null) {
        getJobResults(this._job_id, function(results:string) {
          updateResultsTable(resultsTableDiv,'widget-result-table',results);
        });
      } else {
        console.log('creating results table div');
        resultsTableDiv = document.createElement('div');
        resultsTableDiv.id = 'results-table-div';

        let resultsTable = document.createElement('table');
        resultsTable.id = 'widget-result-table';
        resultsTableDiv.appendChild(resultsTable);
        resultsCell.appendChild(resultsTableDiv);

        getJobResults(this._job_id, function(results:string) {
          updateResultsTable(resultsTableDiv,'widget-result-table',results);
        });
      }
    }
  }

  _updateMetricsRow() {
    let metricsCell = document.getElementById('cell-jobmetrics');
    if (metricsCell != null) {
      // section header
      let metricsHead = document.getElementById('metrics-name');
      if (metricsHead == null){
        metricsHead = document.createElement('h3');
        metricsHead.id = 'metrics-name';
        metricsHead.innerText = 'Job Metrics';
        metricsCell.appendChild(metricsHead);
      }

      // metrics table
      let metricsTableDiv = <HTMLDivElement>document.getElementById('metrics-table-div');
      if (metricsTableDiv != null) {
        getJobMetrics(this._job_id, function(results:string) {
          updateResultsTable(metricsTableDiv,'widget-metrics-table',results);
        });
      } else {
        console.log('creating results table div');
        metricsTableDiv = document.createElement('div');
        metricsTableDiv.id = 'metrics-table-div';

        let resultsTable = document.createElement('table');
        resultsTable.id = 'widget-metrics-table';
        metricsTableDiv.appendChild(resultsTable);
        metricsCell.appendChild(metricsTableDiv);

        getJobMetrics(this._job_id, function(results:string) {
          updateResultsTable(metricsTableDiv,'widget-metrics-table',results);
        });
      }
    }
  }

  // OTHER.     ==============================================

  _setJobClick(tableId:string) {
    let me = this;
    onRowClick(tableId, function(row:HTMLTableRowElement) {
      let job_id = row.getElementsByTagName('td')[0].innerHTML;
      me._job_id = job_id;
      me._updateInfoCol();
      me._updateResultsCol();
      me._updateMetricsRow();
    })
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
}

export class JobTable extends Widget {
  _username: string;
  _job_id: string;
  _results: string;
  _resultsTableName: string;

  constructor() {
    super();
    this._resultsTableName = 'job-result-display';
    this._job_id = '';
    this.addClass(CONTENT_CLASS);

    // set username on start
    // callback should finish before users manage to do anything
    // now profile timing out shouldn't be a problem
    let me = this;
    getUserInfo(function(profile: any) {
      if (profile['cas:username'] === undefined) {
        INotification.error("Get username failed.");
        me._username = 'anonymous';
      } else {
        me._username = profile['cas:username'];
        INotification.success("Got username.");
        me.update();
      }
    });
    // make clickable table rows after setting job table
    var x = document.createElement("BR");
    this.node.appendChild(x);
  }

  _updateDisplay(): void {
    console.log("getting jobs list");
    let me = this;
    getJobs(this._username,this._job_id, function(job_id){
      console.log('setting job id');
      me._job_id = job_id;
    },this._getJobInfo, me);
  }

  // front-end side of display jobs table and job info
  _getJobInfo(me: JobTable, table:string) {
    // --------------------
    // job table
    // --------------------
    // set table, from response
    if (document.getElementById('job-cache-display') != null) {
      (<HTMLTextAreaElement>document.getElementById('job-cache-display')).innerHTML = table;
    } else {
      // create div for table if table doesn't already exist
      var div = document.createElement('div');
      div.setAttribute('id', 'job-table');
      div.setAttribute('resize','none');
      div.setAttribute('class','jp-JSONEditor-host');
      div.setAttribute('style','border-style:none;');

      // jobs table
      var textarea = document.createElement("table");
      textarea.id = 'job-cache-display';
      textarea.innerHTML = table;
      textarea.className = 'jp-JSONEditor-host';
      div.appendChild(textarea);
      me.node.appendChild(div);
    }

    // --------------------
    // refresh button
    // --------------------
    if (document.getElementById('job-refresh-button') == null) {
      let div = (<HTMLDivElement>document.getElementById('jobs-div'));
      if (div != null) {
        let refreshBtn = document.createElement('button');
        refreshBtn.id = 'job-refresh-button';
        refreshBtn.className = 'jupyter-button';
        refreshBtn.innerHTML = 'Refresh Job List';
        refreshBtn.addEventListener('click', function() {me._updateDisplay()}, false);
        let br = document.createElement('br');
        div.appendChild(br);
        div.appendChild(refreshBtn);
      }
    }

    // set display in 2nd callback after making table rows clickable
    // update/populate jobs table, add delete & dismiss buttons
    let setDisplays = function(me:JobTable){
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
        if (me._job_id != ''){
          disp = DISPLAYS[me._job_id];
        }

        if (document.getElementById('job-detail-display') != null) {
          // console.log(me._job_id);
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

        // create button to delete job 
        if (document.getElementById('job-delete-button') == null){
          var deleteBtn = document.createElement("button");
          deleteBtn.id = 'job-delete-button';
          deleteBtn.className = 'jupyter-button';
          deleteBtn.innerHTML = 'Delete Job';
          // update to delete with new job id
          deleteDismissJob(deleteBtn,me._job_id,'delete');
          div2.appendChild(deleteBtn);
        } else {
          let deleteBtn = <HTMLButtonElement>document.getElementById('job-delete-button');
          deleteDismissJob(deleteBtn,me._job_id,'delete');
        }

        // create button to dismiss job
        if (document.getElementById('job-dismiss-button') == null){
          var dismissBtn = document.createElement("button");
          dismissBtn.id = 'job-dismiss-button';
          dismissBtn.className = 'jupyter-button';
          dismissBtn.innerHTML = 'Dismiss Job';
          // update to dismiss with new job id
          deleteDismissJob(deleteBtn,me._job_id,'dismiss');
          let body2 = document.createElement('span');
          body2.innerHTML = "     ";
          div2.appendChild(body2);
          div2.appendChild(dismissBtn);
        } else {
          let dismissBtn = <HTMLButtonElement>document.getElementById('job-dismiss-button');
          deleteDismissJob(dismissBtn,me._job_id,'dismiss');
        }
      }
    }
    // end setDisplays def
    me._setRowClick('job-cache-display', setDisplays);
  }

  // set clickable rows
  _setRowClick(div_name:string, setDisplays:any) {
    let me = this;
    onRowClick(div_name, function(row:HTMLTableRowElement){
      let job_id = row.getElementsByTagName('td')[0].innerHTML;
      me._job_id = job_id;
      setDisplays(me);
      me._getJobResult(me);
      me._results = '';
    });
  }

  // get job result for display
  _getJobResult(me:JobTable) {
    getJobResults(me._job_id,function(results:string) {me.convertResultToDisplay(me,results)});
  }

  // front-end side of display job result table
  convertResultToDisplay(me:JobTable, results: string) {
    me._results = results;
    let outerDiv = (<HTMLDivElement>document.getElementById('jobs-div'));
    if (outerDiv != null) {
      // 1-time add line break and section header for job result
      if (document.getElementById('job-result-head') == null) {
        // line break
        var line = document.createElement('hr');
        outerDiv.appendChild(line);

        // display header
        var detailHeader = document.createElement('h4');
        detailHeader.setAttribute('id','job-result-head');
        detailHeader.setAttribute('style','margin:0px');
        detailHeader.innerText = 'Job Results';
        outerDiv.appendChild(detailHeader);
      }
      updateResultsTable(outerDiv,me._resultsTableName,me._results);
    }
  }

  update(): void {
    this._updateDisplay();
  }
}