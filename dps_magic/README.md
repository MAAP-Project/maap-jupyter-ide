# dps_magic

[![Build Status](https://travis-ci.org/MAAP/dps_magic.svg?branch=master)](https://travis-ci.org/MAAP/dps_magic)
[![codecov](https://codecov.io/gh/MAAP/dps_magic/branch/master/graph/badge.svg)](https://codecov.io/gh/MAAP/dps_magic)
An nbextension to allow inline submission of DPS jobs, corresponding to and **dependent** on API endpoints from the `submit_jobs` extension, using jupyter notebook line magics.<br>
When opening the workspace (or any time the kernel has been restarted), the extension must be loaded by running `%load_ext dps_magic` in a cell.  Currently implemented are:

1. Get Capabilities
	- calls `hysds/getCapabilities`
	- inline call: `%capabilities`
	- displays MAAP API Capabilities
2. List Algorithms
	- calls `hysds/listAlgorithms`
	- inline call: `%list`
	- displays list of registered algorithms
3. Describe Process
	- calls `hysds/describeProcess`
	- inline call: `%describe algorithm_name:version`
	- displays algorithm information and required inputs
4. Execute
	- calls `hysds/execute`
	- inline call: `%execute algorithm_name:version(param1:val1,param2:val2)`
	- submits a job, displaying job id if successful or error message when provided bad inputs
5. Get Status
	- calls `hysds/getStatus`
	- inline call: `%status job_id`
	- displays job's status (queued, started, completed, failed)
6. Get Result
	- calls `hysds/getResult`
	- inline call: `%result job_id`
	- displays job's results; links in a formatted table with s3 links hyperlinked
7. Delete Algorithm
	- calls `hysds/deleteAlgorithm`
	- inline call: `%delete algorithm_name:version`
	- deletes and echos name of deleted algorithm
8. Help
	- inline call: `%help`
	- displays table of possible inline calls with brief descriptions

If you are unsure of how to use the line magics, you can view the help text by calling `%function help`, for example `%execute help`.  To list all of them, call `%help`.

## Installation

You can install using `pip`:

```bash
pip install dps_magic
```

Or if you use jupyterlab:

```bash
pip install dps_magic
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] dps_magic
```

Within Dockerfile, cd into the extension top directory:

```bash
pip install -e .
jupyter nbextension install --symlink --py dps_magic --sys-prefix
jupyter nbextension enable --py dps_magic --sys-prefix
```
