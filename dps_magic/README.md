# dps_magic

[![Build Status](https://travis-ci.org/MAAP/dps_magic.svg?branch=master)](https://travis-ci.org/MAAP/dps_magic)
[![codecov](https://codecov.io/gh/MAAP/dps_magic/branch/master/graph/badge.svg)](https://codecov.io/gh/MAAP/dps_magic)

## Overview
An nbextension to create Jupyter Notebook magic calls for algorithm-related (MAS) and job-related (DPS) commands, corresponding to and **dependent** on API endpoints from the `submit_jobs` extension.<br>

## Usage
When opening the workspace (or any time the kernel has been restarted), the extension must be loaded by running `%load_ext dps_magic` in a cell.  Currently implemented are:

1. `%capabilities`
	- calls `hysds/getCapabilities`
	- displays MAAP API Capabilities
2. `%list`
	- calls `hysds/listAlgorithms`
	- displays list of registered algorithms
3. `%describe <algorithm_name>:<version>`
	- calls `hysds/describeProcess`
	- displays algorithm information and required inputs
4. `%execute <algorithm_name>:<version>(param1:val1,param2:val2)`
	- calls `hysds/execute`
	- submits a job, displaying job id if successful or error message when provided bad inputs
5. `%status <job_id>`
	- calls `hysds/getStatus`
	- displays job's status (queued, started, completed, failed, revoked)
6. `%metrics <job_id>`
	- calls `hysds/getMetrics`
	- displays job's execution metrics, such as machine used, runtime, memory footprint
	- only works for successfully completed jobs
7. `%result <job_id>`
	- calls `hysds/getResult`
	- displays job's results; links in a formatted table with s3 links hyperlinked
	- only works for successfully completed jobs
8. `%delete_algorithm <algorithm_name>:<version>`
	- calls `hysds/deleteAlgorithm`
	- deletes and echoes name of specified algorithm
9. `delete_job <job_id>`
	- calls `hysds/delete`
	- deletes and echoes id of the specified job
10. `dismiss <job_id>`
	- calls `hysds/dismiss`
	- dismisses and echoes id of the specified job
11. `%s3_url <filepath>`
	- calls `show_ssh_info/getSigneds3Url`
	- filepath must be from an s3-backed folder
	- link expires after 12 hours
12. `%help`
	- displays table of available inline calls with brief descriptions

If you are unsure of how to use the line magics, you can view the help text by calling `%function help`, for example `%execute help`.  To list all of them, call `%help`.

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* depends on `submit_jobs` and `show_ssh_info` extensions
* see `package.json` for package dependencies

### Build & Install nbextension
```bash
cd maap-jupyter-ide/dps_magic
npm install
npm run build
pip install .
jupyter nbextension install --symlink --py dps_magic --sys-prefix
jupyter nbextension enable --py dps_magic --sys-prefix
```

### Uninstall
```bash
jupyter nbextension uninstall dps_magic
```

## Development
The magics in the nbextension are defined as functions in a Magics Class `dps_magic/dps_magic/hysds.py`.  They are added to the notebook by creating and registering the Magics Class in `dps_magic/dps_magic/__init__.py`.  The official Jupyter Notebook documentation can be found [here](https://ipython.readthedocs.io/en/stable/config/custommagics.html).


Contact: Elizabeth Yam (JPL)
