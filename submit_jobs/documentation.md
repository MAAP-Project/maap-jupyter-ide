## Submit Jobs Extension Documentation & Architecture
### Architecture
<img alt="architecture diagram" src="submit_jobs_architecture.png" width="350">

#### sourcefiles
- index.ts: instantiate & export jupyter extensions
- fields.json: required parameters for each DPS/MAS function that calls the MAAP API
- activate.ts: contains all extension activate functions
- funcs.ts: common functions across classes & API calls
- selector.ts: widget that creates a dropdown menu for selecting from a prepopulated list of choices
- widgets.ts: contains common widgets for executing DPS/MAS cals to MAAP API; includes 2 dialog popup functions widgets depend on
- request.ts: class and functions utility for making http requests and reading their responses
- dialog.ts: customize more dialog types & popup functions from the base class/function in @jupyterlab/apputils
