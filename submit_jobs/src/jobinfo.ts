import { JupyterFrontEnd } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette, Dialog, showDialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Widget } from '@phosphor/widgets';
import { INotification } from "jupyterlab_toastify";
import { getUserInfo } from "./getKeycloak";
import { request, RequestResult } from './request';
import { jobCache_update_command, jobWidget_command, activateMenuOptions } from './funcs';
import { ADEPanel, WIDGET_CLASS, CONTENT_CLASS } from './panel';
import '../style/index.css';

const widget_table_name = 'widget-job-cache-display';
const algo_list_id = 'algo-list-table';
const execute_params_id = 'execute-params-table';

// set display in 2nd callback after making table rows clickable
// update/populate jobs table, add delete & dismiss buttons
let setDisplays = function (jobsTable: JobTable, outerDivId: string){
  // create div for job info section
  // parent for everything, created in table response
  if (document.getElementById(outerDivId) != null) {
    // 1-time add line break and section header for job info
    let div2 = (<HTMLDivElement>document.getElementById(outerDivId));
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
    if (jobsTable.getJobID() != ''){
      disp = jobsTable.getDisplay(jobsTable.getJobID());
    }

    if (document.getElementById('job-detail-display') != null) {
      // console.log(jobsTable.getJobID());
      (<HTMLTextAreaElement>document.getElementById('job-detail-display')).innerHTML = disp;
    } else {
      // create textarea if it doesn't already exist
      // detailed info on one job
      var display = document.createElement("textarea");
      display.id = 'job-detail-display';
      (<HTMLTextAreaElement>display).readOnly = true;
      (<HTMLTextAreaElement>display).cols = 30;
      (<HTMLTextAreaElement>display).innerHTML = disp;
      display.setAttribute('style', 'margin: 0px; height:19%; width: 98%; border: none; resize: none');
      display.className = 'jp-JSONEditor-host';
      div2.appendChild(display);

      // create button to delete job 
      if (document.getElementById('job-delete-button') == null){
        var deleteBtn = document.createElement("button");
        deleteBtn.id = 'job-delete-button';
        deleteBtn.className = 'jupyter-button';
        deleteBtn.innerHTML = 'Delete Job';
        // change to get job_id and delete via widget or send request & create own popup
        deleteBtn.addEventListener('click', function () {
          var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/delete');
          getUrl.searchParams.append('job_id', jobsTable.getJobID());
          console.log(getUrl.href);
          request('get',getUrl.href).then((res: RequestResult) => {
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
          });
        }, false);
        div2.appendChild(deleteBtn);
      }

      // create button to dismiss job
      if (document.getElementById('job-dismiss-button') == null){
        var dismissBtn = document.createElement("button");
        dismissBtn.id = 'job-dismiss-button';
        dismissBtn.className = 'jupyter-button';
        dismissBtn.innerHTML = 'Dismiss Job';
        // change to get job_id and dismiss via widget or send request & create own popup
        dismissBtn.addEventListener('click', function () {
          var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/dismiss');
          getUrl.searchParams.append('job_id', jobsTable.getJobID());
          console.log(getUrl.href);
          request('get',getUrl.href).then((res: RequestResult) => {
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
          });
        }, false);

        let body2 = document.createElement('span');
        body2.innerHTML = "     ";
        div2.appendChild(body2);
        div2.appendChild(dismissBtn);
      }
    }
  }
}
// end setDisplays def

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
  job_cache: JobTable;
  _algorithm: string;
  _version: string;

  constructor(jobCache: JobTable) {
    super();
    this.job_cache = jobCache;
    this.addClass(CONTENT_CLASS);
    this.addClass(WIDGET_CLASS);
    this._algorithm = 'dps_plot';   // FOR TESTING
    this._version = 'master';       // FOR TESTING

    let job_widget = document.createElement('div');
    job_widget.id = 'job-widget';

    let tabs = document.createElement('div');
    tabs.id = 'tab';
    tabs.setAttribute('class','tab');

    // button Run tab
    let runTab = document.createElement('button');
    runTab.setAttribute('id','defaultOpen');
    runTab.setAttribute('class','tablink');
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
  }

  /* Handle update requests for the widget. */
  update() {
    // console.log('updating');
    // console.log(this._algorithm);
    // console.log(this._version);
    this.job_cache.update();
    document.getElementById("defaultOpen").click();

    // console.log(this.job_cache.getTable());
    if (document.getElementById(widget_table_name) != null) {
      (<HTMLTextAreaElement>document.getElementById(widget_table_name)).innerHTML = this.job_cache.getTable();
    } else {
      // create div for jobid table if table doesn't already exist
      var div = document.createElement('div');
      div.setAttribute('id', 'widget-job-table');
      div.setAttribute('resize','none');
      div.setAttribute('class','jp-JSONEditor-host');
      div.setAttribute('style','border-style:none;');

      // jobs table
      var textarea = document.createElement("table");
      textarea.id = widget_table_name;
      textarea.innerHTML = this.job_cache.getTable();
      div.appendChild(textarea);
      let jw_div = document.getElementById('job-widget-div');
      if (jw_div != null){
        jw_div.appendChild(document.createElement('hr'));
        let h = document.createElement('h3');
        h.innerText = 'Submitted Jobs';
        jw_div.appendChild(h);
        jw_div.appendChild(div);
      } else {
        this.node.appendChild(div);
      }
    }

    // update execute, overview when algo chosen
    this._updateListCol();
    this._updateExecuteCol();
    this._updateOverviewCol();
    // update jobinfo when job chosen
    console.log(this.job_cache.getJobID());
    this._updateInfoCol();
    this._updateResultsCol();

    // this.job_cache.setRowClick(widget_table_name,);
  }

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
    listCell.setAttribute('style','min-width:260px');

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
      if (document.getElementById('algo-list-header') == null) {
        let list_title = document.createElement('h3');
        list_title.id = 'algo-list-header';
        list_title.innerText = "Algorithm List";
        listCell.appendChild(list_title);
      }

      if (document.getElementById('algo-list-div') == null) {
        let algolistdiv = document.createElement('div');
        algolistdiv.id = 'algo-list-div'
        listCell.appendChild(algolistdiv);
        
        let algolist = document.createElement('table');
        algolist.id = algo_list_id;
        algolistdiv.appendChild(algolist);

        <HTMLTableSectionElement> algolist.createTHead();
        <HTMLTableSectionElement> algolist.createTBody();
        let ahrow = <HTMLTableRowElement> algolist.tHead.insertRow(0);
        let acell = ahrow.insertCell(0);
        acell.innerHTML = "<i>Algorithms</i>";
        this._populateListTable();
      } else {
        let algolist = <HTMLTableElement> document.getElementById(algo_list_id);
        algolist.innerHTML = '';
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
    let algolist = <HTMLTableElement> document.getElementById(algo_list_id);
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
    // this._setAlgoClick(algo_list_id);
  }

  _setAlgoClick(tableId) {
    let me = this;
    this._onRowClick(tableId, function(algoId) {
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
        t.id = execute_params_id;
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
        let t = <HTMLTableElement> document.getElementById(execute_params_id);
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
    // let paramdiv = <HTMLDivElement> document.getElementById('execute-params-div');
    let t = <HTMLTableElement> document.getElementById(execute_params_id);
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
            inp.value = this.job_cache.getUsername();
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
              // console.log(json_response);
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
    infoCell.setAttribute('style','min-width:260px');

    let resultsCell = rrow.insertCell();
    resultsCell.setAttribute('id','cell-jobresults');
    resultsCell.setAttribute('valign','top');
    resultsCell.setAttribute('style','min-width:260px');

    this._updateInfoCol();
    this._updateResultsCol();

    infoDiv.appendChild(infoTable);
    job_widget.appendChild(infoDiv);
  }

  _updateInfoCol() {
    let infoCell = document.getElementById('cell-jobinfo');
    if (infoCell != null) {
      let infoHead = document.createElement('h3');
      infoHead.innerText = 'Job Information';
      infoHead.id = 'info-name';
      infoCell.appendChild(infoHead);

      let infoText = `JobID: 89ab338b-a5a5-405b-8bb8-288de4cb7360
      Status: job-failed
      Algorithm: job-dps_plot:master
      Inputs:
        pass_number: 2
        timestamp: 2020-02-12 22:45:54.104931
        username: eyam`
      let pre = document.createElement('pre');
      pre.innerText = infoText;
      infoCell.appendChild(pre);

      let br2 = document.createElement('br');
      infoCell.appendChild(br2);

      let deleteBtn = document.createElement('button');
      deleteBtn.setAttribute('id','job-delete-button');
      deleteBtn.setAttribute('class','jupyter-button');
      deleteBtn.innerText = "Delete Job";
      infoCell.appendChild(deleteBtn);

      let span = document.createElement('span');
      span.innerText = '     ';
      infoCell.appendChild(span);

      let dismissBtn = document.createElement('button');
      dismissBtn.setAttribute('id','job-dismiss-button');
      dismissBtn.setAttribute('class','jupyter-button');
      dismissBtn.innerText = "Dismiss Job";
      infoCell.appendChild(dismissBtn); 
    }
  }

  _updateResultsCol() {
    let resultsCell = document.getElementById('cell-jobresults');
    if (resultsCell != null) {
      let resultsHead = document.createElement('h3');
      resultsHead.id = 'results-name';
      resultsHead.innerText = 'Job Results';
      resultsCell.appendChild(resultsHead);

      let resultsTable = document.createElement('div');
      resultsTable.id = 'result-table';
      resultsTable.innerHTML = `<table id="job-result-display" class="jp-JSONEditor-host" style="border-style:none; font-size:14px"><tbody><tr><td>JobID: </td><td style="text-align:left">d9f26ccc-9ab8-4234-8546-e2d6f44770d8</td></tr><tr><td>ProductName: </td><td style="text-align:left">output-2020-02-13T00:10:17.703154</td></tr><tr><td>Locations: </td><td style="text-align:left">•&nbsp;http://maap-dev-dataset.s3-website-us-east-1.amazonaws.com/products/eyam/hello-world-output_ubuntu/master/2020/02/13/00/10/17/703154<br> •&nbsp;s3://s3.us-east-1.amazonaws.com:80/maap-dev-dataset/products/eyam/hello-world-output_ubuntu/master/2020/02/13/00/10/17/703154<br>  •&nbsp;<a href="https://s3.console.aws.amazon.com/s3/buckets/maap-dev-dataset/products/eyam/hello-world-output_ubuntu/master/2020/02/13/00/10/17/703154/?region=us-east-1&amp;tab=overview" target="_blank" style="border-bottom: 1px solid #0000ff; color: #0000ff;">https://s3.console.aws.amazon.com/s3/buckets/maap-dev-dataset/products/eyam/hello-world-output_ubuntu/master/2020/02/13/00/10/17/703154/?region=us-east-1&amp;tab=overview</a></td></tr></tbody></table>`
      resultsCell.appendChild(resultsTable);
    }
  }

  _setJobClick(tableId) {
    let me = this;
    this._onRowClick(tableId, function(jobId) {
      me.job_cache.setJobID(jobId);
      me.update();
    })
  }

  // clickable table rows helper function
  _onRowClick(tableId, callback) {
    let me = this;
    if (document.getElementById(tableId) != undefined) {
      let table = document.getElementById(tableId),
          rows = table.getElementsByTagName('tr'),
          i;
      for (i = 1; i < rows.length; i++) {
        rows[i].onclick = function(row) {
          return function() {
            callback(row);
            me.update();
          }
        }(rows[i]);
      }
    }
  }

  _clickTab(evt, section) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    document.getElementById(section).style.display = "block";
    evt.currentTarget.className += " active";
  }
}

export class JobTable extends Widget {
  public opt:string;
  _table: string;
  _displays: {[k:string]:string};
  _results: string;
  _jobs: {[k:string]:string};
  _job_id: string;
  _username: string;

  constructor() {
    super();

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

    this._table = '';
    this._results = '';
    this._displays = {};
    this._jobs = {};
    this._job_id = '';
    this.addClass(CONTENT_CLASS);
  }

  _updateDisplay(): void {
    var x = document.createElement("BR");
    this.node.appendChild(x);

    // call list jobs endpoint using username
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
    getUrl.searchParams.append('username',this._username);
    console.log(getUrl.href);
    // --------------------
    // get jobs list request
    // --------------------
    request('get', getUrl.href).then((res: RequestResult) => {
      if(res.ok){
        let json_response:any = res.json();
        // console.log(json_response['status_code']);
        INotification.success("Get user jobs success.");
        // console.log(json_response['result']);
        // console.log(json_response['displays']);

        if (json_response['status_code'] == 200){
          this._table = json_response['table'];
          this._jobs = json_response['jobs'];
          // later get user to pick the job
          this._displays = json_response['displays'];

          // catch case if user has no jobs
          let num_jobs = Object.keys(this._jobs).length;
          if (num_jobs > 0 && this._job_id == '') {

            this._job_id = json_response['result'][0]['job_id'];
          }

        } else {
          console.log('unable to get user job list');
          INotification.error("Get user jobs failed.");
        }
      } else {
        console.log('unable to get user job list');
        INotification.error("Get user jobs failed.");
      }
    });

    console.log('got table, setting panel display');
    this._getJobInfo();
  }

  // front-end side of display jobs table and job info
  _getJobInfo() {
    // --------------------
    // job table
    // --------------------
    // set table, from response
    let me = this;
    if (document.getElementById('job-cache-display') != null) {
      (<HTMLTextAreaElement>document.getElementById('job-cache-display')).innerHTML = me._table;
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
      textarea.innerHTML = me._table;
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

    let setDetailedDisplay = function(me: JobTable) {setDisplays(me,'jobs-div');}

    // make clickable table rows after setting job table
    this.setRowClick('job-cache-display', setDetailedDisplay);
  }

  // set clickable rows
  setRowClick(div_name, setDisplays) {
    let me = this;
    this._onRowClick(div_name, function(row){
      let job_id = row.getElementsByTagName('td')[0].innerHTML;
      // document.getElementById('click-response').innerHTML = job_id;
      me._job_id = job_id;
    }, setDisplays);
  }

  // clickable table rows helper function
  _onRowClick(tableId, setJobId, setDisplays) {
    let me = this;
    if (document.getElementById(tableId) != undefined) {
      let table = document.getElementById(tableId),
          rows = table.getElementsByTagName('tr'),
          i;
        for (i = 1; i < rows.length; i++) {
          rows[i].onclick = function(row) {
            return function() {
              setJobId(row);
              setDisplays(me);
              me.getJobResult(me);
            }
          }(rows[i]);
        }
      }
    this._results = '';
  }

  // get job result for display
  getJobResult(me:JobTable) {
    var resultUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
    // console.log(me.jobs[me._job_id]);
    if (me._job_id != '' && me._jobs[me._job_id]['status'] == 'job-completed') {
      resultUrl.searchParams.append('job_id',me._job_id);
      console.log(resultUrl.href);

      request('get', resultUrl.href).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          // console.log(json_response['status_code']);
          INotification.success("Get user job result success.");

          if (json_response['status_code'] == 200){
            me._results = json_response['result'];

          } else {
            console.log('unable to get user job list');
            INotification.error("Get user job result failed.");
          }
        } else {
          console.log('unable to get user job list');
          INotification.error("Get user job result failed.");
        }
        this._selectedJobResult(me);
      });
    } else {
      me._results = '<p>Job '+me._job_id+' <br>not complete</p>';
      this._selectedJobResult(me);
    }
  }

  // front-end side of display job result table
  _selectedJobResult(me:JobTable) {
    // let jobResult = this._results[this._job_id];
    // console.log(me._results);
    if (document.getElementById('jobs-div') != null) {
      // 1-time add line break and section header for job result
      let div2 = (<HTMLDivElement>document.getElementById('jobs-div'));
      if (document.getElementById('job-result-head') == null) {
        // line break
        var line = document.createElement('hr');
        div2.appendChild(line);

        // display header
        var detailHeader = document.createElement('h4');
        detailHeader.setAttribute('id','job-result-head');
        detailHeader.setAttribute('style','margin:0px');
        detailHeader.innerText = 'Job Results';
        div2.appendChild(detailHeader);
      }

      // --------------------
      // job result
      // --------------------
      // console.log('setting results');
      if (document.getElementById('job-result-display') != null) {
        (<HTMLTextAreaElement>document.getElementById('job-result-display')).innerHTML = me._results;
      } else {
        // create div for table if table doesn't already exist
        var div = document.createElement('div');
        div.setAttribute('id', 'result-table');
        div.setAttribute('resize','none');
        div.setAttribute('class','jp-JSONEditor-host');
        div.setAttribute('style','border-style:none; overflow: auto');

        var display = document.createElement("table");
        display.id = 'job-result-display';
        display.innerHTML = me._results;
        display.setAttribute('class','jp-JSONEditor-host');
        display.setAttribute('style','border-style:none; font-size:11px');
        div.appendChild(display);
        div2.appendChild(div);
      }
    }
  }

  // -----------------------------------------------------------
  // getters for GUI referencing properties in this class
  update(): void {
    this._updateDisplay();
  }

  getTable(): string {
    return this._table;
  }

  getDisplay(jobId: string): string {
    return this._displays[jobId];
  }

  getUsername(): string {
    return this._username;
  }

  getJobID(): string{
    return this._job_id;
  }

  setJobID(jobId: string): void{
    this._job_id = jobId;
    this._updateDisplay();
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// reference to jobsTable passed through each submit_job widget (NO LONGER)
export const jobsTable = new JobTable();
jobsTable.update();
export const jobsPanel = new ADEPanel(jobsTable);
let content = new JobWidget(jobsTable);
const jobsWidget = new MainAreaWidget({content});
// -------------------------------------------------------------
// panel widget activation
// const jobCache_update_command = 'jobs: refresh';
// const jobWidget_command = 'jobs: main-widget';

export function activateJobPanel(app: JupyterFrontEnd, palette: ICommandPalette, mainMenu: IMainMenu): void{
  var infoPanel = jobsPanel;
  infoPanel.id = 'job-cache-display';
  infoPanel.title.label = 'Jobs';
  infoPanel.title.caption = 'jobs sent to DPS';

  // app.shell.addToLeftArea(infoPanel, {rank:300});
  app.shell.add(infoPanel, 'left', {rank: 300});

  app.commands.addCommand(jobCache_update_command, {
    label: 'Refresh Job List',
    isEnabled: () => true,
    execute: args => {
      jobsTable.update();
      infoPanel.update();
      jobsWidget.update();
    }
  });
  palette.addItem({command: jobCache_update_command, category: 'DPS/MAS'});
  // jobsTable.updateDisplay();
  console.log('HySDS JobList is activated!');

  activateMenuOptions(app,mainMenu);
}
export function activateJobWidget(app: JupyterFrontEnd, palette: ICommandPalette) {
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  // Declare a widget variable
  // let widget: MainAreaWidget<JobWidget>;
  let widget: MainAreaWidget<JobWidget>;

  // Add an application command
  app.commands.addCommand(jobWidget_command, {
    label: 'Jobs Main Widget',
    execute: () => {
      if (!widget) {
        console.log('setting widget attr');
        widget = jobsWidget;
        widget.id = 'jobs-main-widget';
        widget.title.label = 'Jobs Main Widget';
        widget.title.closable = true;
      }
      // if (!tracker.has(widget)) {
      //   // Track the state of the widget for later restoration
      //   tracker.add(widget);
      // }
      if (!widget.isAttached) {
        console.log('attaching widget');
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, 'main');
      }
      widget.content.update();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({command: jobWidget_command, category: '!Tutorial' });

  // Track and restore the widget state
  // let tracker = new WidgetTracker<MainAreaWidget<JobWidget>>({
  //   namespace: 'jobs'
  // });
  // restorer.restore(tracker, {
  //   command: jobWidget_command,
  //   name: () => 'jobs'
  // });
}