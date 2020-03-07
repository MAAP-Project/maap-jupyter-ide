## Submit Jobs Extension Documentation & Architecture
### Architecture
<img alt="architecture diagram" src="submit_jobs_architecture.png" width="350">

#### sourcefiles
- index.ts: instantiate & export jupyter extensions
- fields.json: required parameters for each DPS/MAS function that calls the MAAP API
- funcs.ts: common functions across classes & API calls; includes extension activate functions (except for side panels)
- selector.ts: widget that creates a dropdown menu for selecting from a prepopulated list of choices
- widgets.ts: contains common widgets for executing DPS/MAS cals to MAAP API; includes 2 dialog popup functions widgets depend on
- panel.ts: contains skeleton code for a basic side panel in jupyter lab, wth a commented-out example activate function (extension must be instantiated and exported as well)
- jobinfo.ts: 1) creates a widget for listing DPS jobs associated with the user in table; 2) creates a main area jupyter widget for easy UI in listing, describing, and executing algorithms; format in (1):

| Job Id | Status | Algorithm |
| ------ | ------ | --------- |

- request.ts: class and functions utility for making http requests and reading their responses
- dialog.ts: customize more dialog types & popup functions from the base class/function in @jupyterlab/apputils
