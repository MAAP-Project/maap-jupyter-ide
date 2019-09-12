import { Widget, Panel } from '@phosphor/widgets';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import { INotification } from "jupyterlab_toastify";
import { getUserInfo } from "./getKeycloak";
import { request, RequestResult } from './request';
// import * as $ from "jquery";
// import { format } from "xml-formatter";

const CONTENT_CLASS = 'jp-Inspector-content';
// primitive text panel for storing submitted job information
export class JobCache extends Panel {
  public opt:string;
  table: string;
  displays: {[k:string]:string};
  results: string;
  jobs: {[k:string]:string};
  job_id: string;
  // username: string;

  // constructor(uname:string) {
  constructor() {
    super();
    this.table = '';
    this.results = '';
    this.displays = {};
    this.jobs = {};
    this.job_id = '';
    // this.username = uname;
    // console.log('setting username to '+this.username);
    this.addClass(CONTENT_CLASS);
  }

  updateDisplay(): void {
    // call list jobs endpoint using wksp username
    var x = document.createElement("BR");
    this.node.appendChild(x);
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/listJobs');
    let me = this;
    getUserInfo(function(profile: any) {
      // start get username callback
      var username:string;
      if (profile['cas:username'] === undefined) {
        INotification.error("Get username failed.");
        username = 'anonymous';
      return;
      } else {
        username = profile['cas:username'];
      }
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
          // console.log(json_response['result']);
          // console.log(json_response['displays']);

          if (json_response['status_code'] == 200){
            me.table = json_response['table'];
            me.jobs = json_response['jobs'];
            // later get user to pick the job
            me.displays = json_response['displays'];

            // catch case if user has no jobs
            let num_jobs = Object.keys(me.jobs).length;
            if (num_jobs > 0 && me.job_id == '') {

              me.job_id = json_response['result'][0]['job_id'];
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
      me.getJobInfo();
    // end get username callback
    });
  }

  // front-end side of display jobs table and job info
  getJobInfo() {
    // --------------------
    // job table
    // --------------------
    // set table, from response
    let me = this;
    if (document.getElementById('job-cache-display') != null) {
      (<HTMLTextAreaElement>document.getElementById('job-cache-display')).innerHTML = me.table;
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
      textarea.innerHTML = me.table;
      textarea.className = 'jp-JSONEditor-host';
      div.appendChild(textarea);
      me.node.appendChild(div);
    }

    // --------------------
    // refresh button
    // --------------------
    if (document.getElementById('job-refresh-button') == null) {
      let div = (<HTMLDivElement>document.getElementById('jobs-div'));
      let refreshBtn = document.createElement('button');
      refreshBtn.id = 'job-refresh-button';
      refreshBtn.className = 'jupyter-button';
      refreshBtn.innerHTML = 'Refresh Job List';
      refreshBtn.addEventListener('click', function() {me.updateDisplay()}, false);
      let br = document.createElement('br');
      div.appendChild(br);
      div.appendChild(refreshBtn);
    }

    // set display in 2nd callback after making table rows clickable
    let setDisplays = function (me:JobCache){
      // create div for job info section
      // parent for everything, created in table response
      if (document.getElementById('jobs-div') != null) {
        // 1-time add line break and section header for job info
        let div2 = (<HTMLDivElement>document.getElementById('jobs-div'));
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
        if (me.job_id != ''){
          disp = me.displays[me.job_id];
        }

        if (document.getElementById('job-detail-display') != null) {
          // console.log(me.job_id);
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
              getUrl.searchParams.append('job_id', me.job_id);
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
              getUrl.searchParams.append('job_id', me.job_id);
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
  
        // --------------------
        // results button
        // --------------------
        // if (document.getElementById('job-result-button') == null) {
        //   let resultBtn = document.createElement('button');
        //   resultBtn.id = 'job-result-button';
        //   resultBtn.className = 'jupyter-button';
        //   resultBtn.innerHTML = 'Get Job Results';
        //   resultBtn.addEventListener('click', function() {me.getJobResult(me)}, false);
        //   div2.appendChild(resultBtn);
        // }
      }
    }

    // make clickable table rows after setting job table
    this.onRowClick('job-cache-display', function(row){
      let job_id = row.getElementsByTagName('td')[0].innerHTML;
      // document.getElementById('click-response').innerHTML = job_id;
      me.job_id = job_id;
    }, setDisplays);

  }

  // clickable table rows helper function
  onRowClick(tableId, setJobId, setDisplays) {
    let me = this;
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
    this.results = '';
  }

  // get job result for display
  getJobResult(me:JobCache) {
    var resultUrl = new URL(PageConfig.getBaseUrl() + 'hysds/getResult');
    // console.log(me.jobs[me.job_id]);
    if (me.job_id != '' && me.jobs[me.job_id]['status'] == 'job-completed') {
      resultUrl.searchParams.append('job_id',me.job_id);
      console.log(resultUrl.href);

      request('get', resultUrl.href).then((res: RequestResult) => {
        if(res.ok){
          let json_response:any = res.json();
          // console.log(json_response['status_code']);
          INotification.success("Get user job result success.");

          if (json_response['status_code'] == 200){
            me.results = json_response['result'];

          } else {
            console.log('unable to get user job list');
            INotification.error("Get user job result failed.");
          }
        } else {
          console.log('unable to get user job list');
          INotification.error("Get user job result failed.");
        }
        this.selectedJobResult(me);
      });
    } else {
      me.results = '<p>Job '+me.job_id+' <br>not complete</p>';
      this.selectedJobResult(me);
    }
  }

  // front-end side of display job result table
  selectedJobResult(me:JobCache) {
    // let jobResult = this.results[this.job_id];
    // console.log(me.results);
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
        (<HTMLTextAreaElement>document.getElementById('job-result-display')).innerHTML = me.results;
      } else {
        // create div for table if table doesn't already exist
        var div = document.createElement('div');
        div.setAttribute('id', 'result-table');
        div.setAttribute('resize','none');
        div.setAttribute('class','jp-JSONEditor-host');
        div.setAttribute('style','border-style:none; overflow: auto');

        var display = document.createElement("table");
        display.id = 'job-result-display';
        display.innerHTML = me.results;
        display.setAttribute('class','jp-JSONEditor-host');
        display.setAttribute('style','border-style:none; font-size:11px');
        div.appendChild(display);
        div2.appendChild(div);
      }
    }
  }

  addJob(): void {
    this.updateDisplay();
  }
}

// -----------------------
// HySDS stuff
// -----------------------
const nonXML: string[] = ['deleteAlgorithm','listAlgorithms','registerAuto','getResult','executeInputs','getStatus','execute','describeProcess','getCapabilities','register', 'delete','dismiss'];
const notImplemented: string[] = [];
export class HySDSWidget extends Widget {

  // TODO: protect instance vars
  public readonly req: string;
  public readonly popup_title: string;
  public response_text: string;
  public old_fields: {[k:string]:string}; // for execute
  public readonly fields: string[];       // user inputs
  public readonly get_inputs: boolean;    // for execute
  public username: string;                // for execute & listing jobs in case of timeout
  jobs_panel: JobCache;    // for execute
  ins_dict: {[k:string]:string};          // for execute

  constructor(req:string, method_fields:string[],uname:string, panel:JobCache, defaultValues:{[k:string]:string}) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    super({node: body});

    // Default text
    this.req = req;
    this.response_text = "";
    this.old_fields = {};
    this.fields = method_fields;
    this.get_inputs = false;
    this.username = uname;
    this.jobs_panel = panel;
    this.ins_dict = {};

    switch (req) {
      case 'register':
        this.popup_title = "Register Algorithm";
        console.log('register');
        break;
      case 'deleteAlgorithm':
        this.popup_title = "Delete Algorithm";
        this.get_inputs = true;
        console.log('deleteAlgorithm');
        break;
      case 'getCapabilities':
        this.popup_title = "Get List of Capabilities";
        console.log('getCapabilities');
        break;
      case 'getStatus':
        this.popup_title = "Get Job Status";
        console.log('getStatus');
        break;
      case 'getResult':
        this.popup_title = "Get Job Result";
        console.log('getResult');
        break;
      case 'executeInputs':
        this.popup_title = "Execute Job";
        this.get_inputs = true;
        console.log('executeInputs');
        break;
      case 'execute':
        this.popup_title = "Execute Job - Provide Inputs";
        this.get_inputs = true;
        console.log('execute');
        break;
      case 'dismiss':
        this.popup_title = "Dismiss Job";
        console.log('dismiss');
        break;
      case 'delete':
        this.popup_title = "Delete Job";
        console.log('delete');
        break;
      case 'describeProcess':
        this.popup_title = "Describe Process";
        this.get_inputs = true;
        console.log('describeProcess');
        break;
      case 'listAlgorithms':
        this.popup_title = "List Algorithms";
        console.log('listAlgorithms');
        break;
    }
    // console.log(this.fields);

    // bind method definitions of "this" to refer to class instance
    this.getValue = this.getValue.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.setOldFields = this.setOldFields.bind(this);
    this.buildRequestUrl = this.buildRequestUrl.bind(this);

    // if (this.popup_title == "registerAuto") {
    //   var msg = document.createElement("Label");
    //   msg.innerHTML = "Your Docker container must have cloned the repository in the following path: /app";
    //   this.node.appendChild(msg);
    // }

    // skip 1st popup if nothing to fill out
    if (this.fields.length == 0) {
      // this.getValue();
      return;
    }

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // TODO enforce input types
    // Construct labels and inputs for fields
    if (! this.get_inputs && this.req != 'describeProcess' && this.req != 'deleteAlgorithm') {
      for (var field of this.fields) {
        
        // textarea for inputs field in register
        if (field == "inputs") {
          var fieldLabel = document.createElement("Label");
          fieldLabel.innerHTML = field;
          this.node.appendChild(fieldLabel);

          var fieldInputs = document.createElement('textarea');
          fieldInputs.id = (field.toLowerCase() + '-input');
          (<HTMLTextAreaElement>fieldInputs).cols = 40;
          (<HTMLTextAreaElement>fieldInputs).rows = 6;
          this.node.appendChild(fieldInputs);
        
          // BREAK
          var x = document.createElement("BR");
          this.node.appendChild(x)

        // for all other fields
        } else {
          var fieldLabel = document.createElement("Label");
          fieldLabel.innerHTML = field;
          this.node.appendChild(fieldLabel);

          var fieldInput = document.createElement('input');
          fieldInput.id = (field.toLowerCase() + '-input');
          // set default values
          if (field in defaultValues) {
            fieldInput.value = defaultValues[field];
          }
          this.node.appendChild(fieldInput);
        
          // BREAK
          var x = document.createElement("BR");
          this.node.appendChild(x)
        }
      }

    // user fill out inputs for execute 2nd popup
    } else {
      // console.log("new");
      for (var field of this.fields) {
        var fieldName = field[0];
        var fieldLabel = document.createElement("Label");
        fieldLabel.innerHTML = fieldName;
        this.node.appendChild(fieldLabel);

        fieldName = fieldName.toLowerCase();
        var fieldInput = document.createElement('input');
        fieldInput.id = (fieldName + '-input');
        fieldInput.classList.add(fieldName);
        this.node.appendChild(fieldInput);
      
        // // newline
        // var br = document.createElement("BR");
        // this.node.appendChild(br);

        // // add button
        // var fieldAdd = document.createElement('button');
        // fieldAdd.innerHTML = 'Add Run Input';
        // fieldAdd.id = (fieldName + '-add');
        // fieldAdd.name = fieldName;
        // fieldAdd.addEventListener('click', (e:Event) => this.insertField(e), false);
        // this.node.appendChild(fieldAdd);

        // newline
        var br = document.createElement("BR");
        this.node.appendChild(br);
      }
    }
    // console.log('done constructing');
  }

  // insertField(fieldName:string) {
  insertField(e:Event) {
    console.log('adding field '+fieldName);
    var fieldName = (<HTMLButtonElement>e.currentTarget).name;
    fieldName = fieldName.toLowerCase();
    var addbtn = document.getElementById(fieldName+'-add');
    var fieldInput = document.createElement('input');
    fieldInput.id = (fieldName + '-input');
    fieldInput.classList.add(fieldName);

     // insert newline & new input field before add button
    addbtn.parentNode.insertBefore(document.createElement("BR"),addbtn.previousSibling);
    addbtn.parentNode.insertBefore(fieldInput,addbtn.previousSibling);
    return;
  }

  setOldFields(old:{[k:string]:string}): void {
    console.log('setting fields');
    this.old_fields = old;
    // TODO enforce input types
  }

  // TODO: add jobs to response text
  updateJobCache(){
    this.jobs_panel.addJob();
  }

  updateSearchResults(): void {
    var me = this;
    // document.getElementById('search-text').innerHTML = this.response_text;
    // console.log(this.response_text);

    if (document.getElementById('result-text') != null){
      // console.log('using textarea');
      (<HTMLDivElement>document.getElementById('result-text')).innerHTML = "<pre>" + this.response_text + "</pre>";
    } else {
      // console.log('create textarea');
      let body = document.createElement('div');
      body.style.display = 'flex';
      body.style.flexDirection = 'column';

      var textarea = document.createElement("div");
      textarea.id = 'result-text';
      textarea.style.display = 'flex';
      textarea.style.flexDirection = 'column';
      var format = require('xml-formatter');
      // var xml = "<pre>" + this.response_text + "</pre>";

      if ( nonXML.includes(me.req) ){ 
        textarea.innerHTML = "<pre>" + this.response_text + "</pre>";
        // console.log(textarea);
      } else {
        var xml = "<root><content><p>"+this.response_text+"</p></content></root>";
        var options = {indentation: '  ', stripComments: true, collapseContent: false};
        var formattedXML = format(xml,options); 
        textarea.innerHTML = formattedXML;
        // console.log(formattedXML);
      }

      body.appendChild(textarea);
      popupResult(new WidgetResult(body,this),"Results");
    }
  }

  // helper to deepcopy aka rebuild URL for execute because deepcopy is a pain rn
  buildCopyUrl(fieldName:string,fieldValue:string): URL {
    var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req);
    // only call when passed inputs not provided by user
    if (this.get_inputs) {
      // filling out algo info (id, version)
      for (let key in this.old_fields) {
        var fieldText = this.old_fields[key].toLowerCase();
        getUrl.searchParams.append(key.toLowerCase(), fieldText);
      }
      // filling out algo inputs
      var new_input_list = "";

      for (var e of this.fields) {
        var field = e[0].toLowerCase();
        new_input_list = new_input_list.concat(field,',');
        if (fieldName == field){
          getUrl.searchParams.append(field.toLowerCase(), fieldValue);
        } else {
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          this.ins_dict[field] = fieldText;
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }
      }
      getUrl.searchParams.append("inputs",new_input_list);
      // add username
      let me = this;
      getUserInfo(function(profile: any) {
        var username:string;
        if (profile['cas:username'] === undefined) {
          INotification.error("Get username failed.");
          username = 'anonymous';
        return;
        } else {
          username = profile['cas:username'];
        }
        me.old_fields['username'] = username;
        console.log('added username '+fieldValue);
        getUrl.searchParams.append('username',username);
      });
    }
    return getUrl;
  }

  buildRequestUrl() {
    var me:HySDSWidget = this;
    return new Promise<Array<URL>>(async (resolve, reject) => {
      // var skip = false;
      // create API call to server extension
      var urllst: Array<URL> = []
      var getUrl = new URL(PageConfig.getBaseUrl() + 'hysds/'+this.req); // REMINDER: hack this url until fixed

      // filling out old fields, currently for algo info (id, version) in execute & describe & delete
      if (this.get_inputs) {
        for (let key in this.old_fields) {
          var fieldText = this.old_fields[key].toLowerCase();
          getUrl.searchParams.append(key.toLowerCase(), fieldText);
        }
      }

      // for calling execute after getting user inputs
      if (this.req == 'execute') {
        // filling out algo inputs
        var new_input_list = "";
        var range = false;
        var rangeField = "";
        var rangeFieldValue:string[] = [];

        for (var e of this.fields) {
          var field = e[0].toLowerCase();
          new_input_list = new_input_list.concat(field,',');
          // console.log(field);
          var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
          // console.log(fieldText);

          // check for range in inputs
          // currently only support INTEGER range in SINGLE input field
          // expected format "range:1:10"
          if (fieldText.includes("range:")) {
            range = true;
            rangeField = field;
            rangeFieldValue = fieldText.split("range:")[1].split(":");
          }
          this.ins_dict[field] = fieldText;
          getUrl.searchParams.append(field.toLowerCase(), fieldText);
        }
        console.log(new_input_list);
        getUrl.searchParams.append("inputs",new_input_list);

        // if multiple runs over one input
        if (range) {
          var start = Number(rangeFieldValue[0]);
          var last = Number(rangeFieldValue[1]);
          console.log(rangeFieldValue);
          // var len = last - start + 1;
          for (var i = start; i <= last; i++) {
            var multiUrl = this.buildCopyUrl(rangeField,String(i));
            multiUrl.searchParams.append("username",this.username);
            console.log(multiUrl.href);
            urllst.push(multiUrl);
            // });
          }
          resolve(urllst);

        // just 1 job
        } else {
          // add username
          let me = this;
          getUserInfo(function(profile: any) {
            var username:string;
            if (profile['cas:username'] === undefined) {
              INotification.error("Get username failed.");
              username = 'anonymous';
            return;
            } else {
              username = profile['cas:username'];
            }
            me.old_fields['username'] = username;
            getUrl.searchParams.append('username',username);
            console.log('added username');
            console.log(getUrl.href);
            urllst.push(getUrl);
            resolve(urllst);
          });
          // getUrl.searchParams.append('username',this.username);
          // console.log('added username');
          // console.log(getUrl.href);
          // urllst.push(getUrl);
          // resolve(urllst);
        }

      // Get Notebook information to pass to Register Handler
      } else if (me.req == 'describeProcess' || me.req == 'executeInputs' || me.req == 'deleteAlgorithm') {
        console.log(getUrl.href);
        urllst.push(getUrl);
        resolve(urllst);
      } else if (me.req == 'register') {
        resolve(urllst);

      // for all other requests
      } else {
        // console.log(this.req+'!!!!');
        for (var field of this.fields) {
          if (field == "inputs") {
            var fieldText = (<HTMLTextAreaElement>document.getElementById(field.toLowerCase()+'-input')).value;
            // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
            getUrl.searchParams.append(field.toLowerCase(), fieldText);
          } else {
            var fieldText = (<HTMLInputElement>document.getElementById(field.toLowerCase()+'-input')).value;
            // if (fieldText != "") { getUrl.searchParams.append(field.toLowerCase(), fieldText); }
            getUrl.searchParams.append(field.toLowerCase(), fieldText);
          }
        }
        console.log(getUrl.href);
        urllst.push(getUrl);
        resolve(urllst);
      }

    });
  }

  sendRequest(urllst:Array<URL>) {
    this.response_text = '';
    for (var ind in urllst){
      var getUrl = urllst[ind];
      console.log('sending');
      console.log(getUrl.href);
      var me:HySDSWidget = this;
      // Send Job as Request
      // if just got inputs for execute, new popup to fill out input fields
      if (me.req == 'executeInputs') {
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            // console.log(json_response['status_code']);
            // console.log(json_response['result']);

            if (json_response['status_code'] == 200){
              // console.log(json_response['ins']);
              // var new_fields = [...executeInputsFields, ...json_response['ins']];
              var new_fields = json_response['ins'];
              var old_fields = json_response['old'];
              // console.log(new_fields);
              // console.log('pre-popup');
              var exec = new HySDSWidget('execute',new_fields,me.username,me.jobs_panel,{});
              exec.setOldFields(old_fields);
              popup(exec);
              // console.log('post-popup');
            } else {
              me.response_text = json_response['result'];
              me.updateSearchResults();
              // console.log("updating");
            }
          } else {
            me.response_text = "Error Getting Inputs Required.";
            me.updateSearchResults();
            // console.log("updating");
          }
        });
      // if set result text to response
      } else if ( !(notImplemented.includes(me.req) )){
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
            let json_response:any = res.json();
            // console.log(json_response);
            me.response_text = me.response_text + '\n' + json_response['result'];
          } else {
            me.response_text = "Error Sending Request.";
          }
          console.log("updating");
          me.updateSearchResults();
        });
      } else {
        console.log("not implemented yet");
      }
    }
    return;
  }

  // submit the job
  // overrides the resolution of popup dialog
  getValue(): void {
    this.buildRequestUrl().then((url) => {
      console.log(url);
      this.sendRequest(url);
    });
  }
}

class WidgetResult extends Widget {
  // pass HySDSWidget which contains info panel
  public parentWidget: HySDSWidget;

  constructor(b: any,parent:HySDSWidget) {
    super({node: b});
    this.parentWidget = parent;
  }

  // update panel text on resolution of result popup
  getValue() {
    if (this.parentWidget.req == 'execute' || this.parentWidget.req == 'delete' || this.parentWidget.req == 'dismiss') {
      this.parentWidget.updateJobCache();
    }
  }
}

class DialogEnter<T> extends Dialog<T> {
  /**
   * Create a dialog panel instance.
   *
   * @param options - The dialog setup options.
   */
  constructor(options: Partial<Dialog.IOptions<T>> = {}) {
    super(options);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._evtKeydown(event as KeyboardEvent);
        break;
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'focus':
        this._evtFocus(event as FocusEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
      default:
        break;
    }
  }

  protected _evtKeydown(event: KeyboardEvent): void {
    // Check for escape key
    switch (event.keyCode) {
      case 13: // Enter.
        //event.stopPropagation();
        //event.preventDefault();
        //this.resolve();
        break;
      default:
        super._evtKeydown(event);
        break;
    }
  }
}

function showDialogEnter<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new DialogEnter(options);
  dialog.launch();
  // setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:any): void {
  if ( !(notImplemented.includes(b.req) )){ 
    showDialogEnter({
      title: b.popup_title,
      body: b,
      focusNodeSelector: 'input',
      buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({ label : 'Cancel'})]
    });
  } else {
    console.log("not implemented yet");
    popupResult("Not Implemented yet","Not Implemented yet")
  }
}

export function popupResult(b:any,popup_title:string): void {
  showDialogEnter({
    title: popup_title,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

