# dps_info

![Github Actions Status](https://github.com/MAAP-Project/maap-jupyter-ide/workflows/Build/badge.svg)

## Overview
This extension provides a GUI component for interfacing with MAS and DPS.  Using this extension, users can view a side panel to list all submitted jobs with their inputs, and if complete, also view a job’s results and metrics by clicking on it.

There is also a MainAreaWidget users can open to list all available algorithms in the default tab (Run Jobs). Once an algorithm is selected, its details (results of describeProcess) will be displayed to the right, along with a built-in dynamic form for submitting a job with the selected algorithm.  In the other tab (Job Info), the user can select a job ID from the list displayed below, and view more details about the job, similar to what can be displayed in the side panel.

These extensions are accessible via the “DPS UI” menu in Jupyter.

## Requirements
* JupyterLab >= 2.1.4
* jupyterlab_toastify = 3.0.0
* nodejs >= 10.13.0
* depends on `submit_jobs` extension
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/dps_info
npm install
npm run build
jupyter labextension install dps_info
```

### Uninstall
```bash
jupyter labextension uninstall dps_info
```

## Development
The extension uses the following endpoints from the `submit_jobs` extension
* hysds/listAlgorithms
* hysds/describeProcess
* hysds/defaultvalues


Contact: Elizabeth Yam (JPL)
