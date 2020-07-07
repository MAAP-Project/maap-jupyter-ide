# submit_jobs

## Overview
UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There will be 10 API endpoints (currently WIP) for communication with MAS & DPS (HySDS) from the JupyterLab workspace.  All of the user-facing endpoints are registered on the CommandPalette.
1. `hysds/getCapabilities`
	- sends a GET request to DPS (https://api.maap-project.org/api/dps/job) for a list of HySDS jobs and algorithms available from MAAP
2. `hysds/register`
	- user right-clicks script they want to register as a job, which sends a GET request to `hysds/defaultValues` to prepopulate registration fields for user to go over in `config.yaml` in the same directory
	- checks if user has committed unchanged `.py` or `.ipynb` files
	- algorithm
	- user-provided required parameters:
		- algorithm name
		- run command
		- environment
	- user-provided optional parameters:	
		- algorithm description
		- inputs
	- UI-provided required parameters:
		- repository URL
		- nb_name: path to notebook file
		- version: algorithm version, taken from branch name
	- XML body is auto-generated and a POST request is sent via `hysds/register` to DPS (https://api.maap-project.org/api/mas/algorithm) to register the new algorithm
3. `hysds/deleteAlgorithm`
	- sends DELETE request to MAS (https://api.maap-project.org/api/mas/algorithm/{algorithm_id}:{algorithm_version}) to remove specified algorithm
4. `hysds/listAlgorithms`
	- sends GET request to list all algorithms registered with MAS (https://api.maap-project.org/api/mas/algorithm)
5. `hysds/describeProcess`
	- sends a GET request to MAS (https://api.maap-project.org/api/mas/algorithm/{algorithm_id}:{algorithm_version}) to get information about the specified algorithm
6. `hysds/execute`
	- first sends a GET request to `hysds/listAlgorithms` to get a list of registered algoirthms and populates a dropdown menu for user to choose from
	- after user has chosen an algorithm, gets algorithm information and required inputs for user to populate and submit
	- the helper `hysds/executeInputs` sends a GET request to MAS (https://api.maap-project.org/api/mas/algorithm/{algorithm_id}:{algorithm_version}) to get information about specified algorithm's inputs
	- required inputs:
		- algo_id
		- version
		- identifier
		- inputs (comma-separated list of input fields)
		- each input field
	- XML body is auto-generated and a POST request is sent to DPS (https://api.maap-project.org/api/dps/job) and returns the Job ID of the new job, which can be used to query the job status and result.
7. `hysds/getStatus`
	- sends a GET request to DPS (https://api.maap-project.org/api/dps/job/{job_id}/status) to check on a job's status
8. `hysds/getResult`
	- sends a GET request to DPS (https://api.maap-project.org/api/dps/job/{job_id}) to get the result of a job that has been completed
9. `hysds/getMetrics`
	- sends a GET request to DPS (https://api.maap-project.org/api/dps/job/{job_id}/metrics) to get runtime information of a job that has been completed
10. `hysds/dismiss`
	- sends a DELETE request to DPS (https://api.maap-project.org/api/dps/job/revoke/{job_id}) to cancel a queued or started job
11. `hysds/delete`
	- sends a DELETE request to DPS (https://api.maap-project.org/api/dps/job/{job_id}) to delete a job
12. Default Values
	- NOT user-facing; helper for `Register Algorithm`
	- used to pre-populate registration fields when provided with a filepath
13. `hysds/listJobs`
	- sends a GET request to DPS (https://api.maap-project.org/api/dps/job/{username}/list) to get a user's list of jobs
	- helper for creating table of user's submitted jobs
	- returns table in HTML, joblist as list of dictionaries, and dictionary of job-id as key mapped to printable display info

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* jupyterlab_toastify = 3.0.0
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/submit_jobs
npm install
npm run build
jupyter labextension install submit_jobs
```

### Build & Install Server Extension
```bash
cd maap-jupyter-ide/submit_jobs
pip install -e .
jupyter serverextension enable --py submit_jobs --sys-prefix
```

## Uninstall
```bash
jupyter labextension uninstall submit_jobs
jupyter serverextension disable --py submit_jobs --sys-prefix
```

## Development
* `hysds/defaultValues` and `hysds/executeInputs` are helper calls to gather necessary arguments without requiring the user to know them
* `hysds/listJobs` is mainly a helper for the `dps_info` extension to provide a graphical display of job history and relevant information for each job
* We are currently planning to move most of the server extension functionality to the [maap-py library](https://github.com/MAAP-Project/maap-py).

Contact: Elizabeth Yam (JPL)