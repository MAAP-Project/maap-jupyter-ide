import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { Widget } from '@phosphor/widgets';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils'
import * as $ from "jquery";
import '../style/index.css';

// -----------------------
// ssh info stuff
// -----------------------
class searchInfo extends Widget {

  // TODO: protect instance vars
  public response_text: string;

  constructor() {
    super();
     // Default text
    this.response_text = ""

    // bind method definitions of "this" to refer to class instance
    this.getCollectionResult = this.getCollectionResult.bind(this);
    this.getGranuleResult = this.getGranuleResult.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);

    // // Display search query resuly
    // var info = document.createElement('info');
    // info.innerHTML = "Search CMR for collections\n";
    // this.node.appendChild(info);

    // // BREAK
    // var x = document.createElement("BR");
    // this.node.appendChild(x)

    // // ************ Search collection fields ********** //
    // // Keyword
    // var keywordLabel = document.createElement("Label");
    // //label.htmlFor = 'keyword-input';
    // keywordLabel.innerHTML="Keyword";
    // this.node.appendChild(keywordLabel)

    // var keyword = document.createElement('input');
    // keyword.id = 'keyword-input';
    // this.node.appendChild(keyword)

    // // BREAK
    // var x = document.createElement("BR");
    // this.node.appendChild(x)

    // // Instrument
    // var instrumentLabel = document.createElement("Label");
    // //label.htmlFor = 'keyword-input';
    // instrumentLabel.innerHTML="Instrument";
    // this.node.appendChild(instrumentLabel)

    // var instrument = document.createElement('input');
    // instrument.id = 'instrument-input';
    // this.node.appendChild(instrument)

    // let refreshBtn = document.createElement('button');
    // refreshBtn.id = "SearchCMR";
    // refreshBtn.className = "btn";
    // refreshBtn.innerHTML = "Search";
    // refreshBtn.addEventListener('click', this.getCollectionResult, false);
    // this.node.appendChild(refreshBtn);

    // ************ Search granule fields ********** //
    // Display search query resuly
    var granuleInfo = document.createElement('granule-info');
    granuleInfo.innerHTML = "Search CMR for granules\n";
    this.node.appendChild(granuleInfo);

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // var shortNameLabel = document.createElement("Label");
    // //label.htmlFor = 'keyword-input';
    // shortNameLabel.innerHTML="Short Name";
    // this.node.appendChild(shortNameLabel)

    // var shortName = document.createElement('input');
    // shortName.id = 'shortName-input';
    // this.node.appendChild(shortName);

    // Sitename
    var sitenameLabel = document.createElement("Label");
    //label.htmlFor = 'keyword-input';
    sitenameLabel.innerHTML="Site Name";
    this.node.appendChild(sitenameLabel)

    var sitename = document.createElement('input');
    sitename.id = 'sitename-input';
    this.node.appendChild(sitename);

    // BREAK
    var x = document.createElement("BR");
    this.node.appendChild(x)

    // Instrument
    var instrumentLabel = document.createElement("Label");
    //label.htmlFor = 'keyword-input';
    instrumentLabel.innerHTML="Instrument";
    this.node.appendChild(instrumentLabel)

    var instrument = document.createElement('input');
    instrument.id = 'instrument-input';
    this.node.appendChild(instrument)

    let graunuleBtn = document.createElement('button');
    graunuleBtn.id = "SearchCMRGranule";
    graunuleBtn.className = "btn";
    graunuleBtn.innerHTML = "Search";
    graunuleBtn.addEventListener('click', this.getGranuleResult, false);
    this.node.appendChild(graunuleBtn);

  }

  updateSearchResults(): void {
    // document.getElementById('search-text').innerHTML = this.response_text;

    if (document.getElementById('search-text') != null){
      (<HTMLTextAreaElement>document.getElementById('search-text')).value = this.response_text;
    } else {
      var textarea = document.createElement("TEXTAREA");
      textarea.id = 'search-text';
      (<HTMLTextAreaElement>textarea).readOnly = true;
      (<HTMLTextAreaElement>textarea).cols = 40;
      (<HTMLTextAreaElement>textarea).rows = 50;
      (<HTMLTextAreaElement>textarea).value = this.response_text;
      this.node.appendChild(textarea);
    }
  }

  // sets new search results with data from GET
  getCollectionResult() {
  var me = this;
  var getUrl = new URL(PageConfig.getBaseUrl() + 'search/getCollections');

    var keywordText = (<HTMLInputElement>document.getElementById('keyword-input')).value;
    // var instrumentText = (<HTMLInputElement>document.getElementById('instrument-input')).value;

    if (keywordText != "") { getUrl.searchParams.append("keyword", keywordText); } 
    // if (instrumentText != "") { getUrl.searchParams.append("instrument", instrumentText); }

    console.log(getUrl.href);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", getUrl.href, true);

    xhr.onload = function() {
      let response = $.parseJSON(xhr.response);
      me.response_text = response.collections_found;
      if (me.response_text == "" ) { me.response_text = "No results found."; }
      me.updateSearchResults();
    }

    xhr.send(null);
    return;
  }

  getGranuleResult() {
  var me = this;
  var getUrl = new URL(PageConfig.getBaseUrl() + 'search/getGranules');

    // var shortNameText = (<HTMLInputElement>document.getElementById('shortName-input')).value;
    // if (shortNameText != "") { getUrl.searchParams.append("short_name", shortNameText); }

    var sitenameText = (<HTMLInputElement>document.getElementById('sitename-input')).value;
    if (sitenameText != "") { getUrl.searchParams.append("sitename", sitenameText); }

    var instrumentText = (<HTMLInputElement>document.getElementById('instrument-input')).value;
    if (instrumentText != "") { getUrl.searchParams.append("instrument", instrumentText); }

    console.log(getUrl.href);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", getUrl.href, true);

    xhr.onload = function() {
      let response = $.parseJSON(xhr.response);
      me.response_text = response.granule_urls;
      if (me.response_text == "" ) { me.response_text = "No results found."; }
      me.updateSearchResults();
    }

    xhr.send(null);
    return;
  }
}

export function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer): void{
  // const {commands, shell} = app;

  var infoPanel = new searchInfo();
  infoPanel.id = 'search-info';
  infoPanel.title.label = 'Search CMR';
  infoPanel.title.caption = 'search CMR for data';

  app.shell.addToLeftArea(infoPanel, {rank:300});
}

// -----------------------
// export extensions
// -----------------------

/**
 * Initialization data for the select-docker-image extension.
 */


const extension: JupyterLabPlugin<void> = {
  requires: [ILayoutRestorer, ICommandPalette],
  id: 'search-cmr',
  autoStart: true,
  activate: activate
};

export default extension;

