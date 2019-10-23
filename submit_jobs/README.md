# submit_jobs

UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There will be 10 API endpoints (currently WIP) for communication with MAS & DPS (HySDS) from the JupyterLab workspace.  All of the user-facing endpoints are registered on the CommandPalette.
1. Get Capabilities
	- endpoint: `hysds/getCapabilities`
	- sends a GET request to DPS for a list of HySDS jobs and algorithms available from MAAP
		- GET request sent to https://api.maap.xyz/api/dps/job
2. Register
	- endpoint: `hysds/register`
	- first sends a GET request to `pull_projects/listFiles` to get a list of supported files (currently `.py` and `.ipynb`) and populates a dropdown menu for user to choose from
	- after user has chosen a file, sends a GET request to `hysds/defaultValues` to prepopulate registration fields for user to go over
	- checks if user has committed unchanged `.py` or `.ipynb` files
	- sends a POST request to DPS to register a new algorithm
		- POST request sent to https://api.maap.xyz/api/mas/algorithm
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
3. Delete Algorithm
	- endpoint: `hysds/deleteAlgorithm`
	- sends DELETE request to remove specified algorithm
		- DELETE request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
4. List Algorithms
	- endpoint: `hysds/listAlgorithms`
	- sends GET request to list all algorithms registered with MAS
		- GET request sent to https://api.maap.xyz/api/mas/algorithm
5. Describe Process
	- endpoint: `hysds/describeProcess`
	- sends a GET request to get information about the specified algorithm
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
6. Execute
	- first sends a GET request to `hysds/listAlgorithms` to get a list of registered algoirthms and populates a dropdown menu for user to choose from
	- after user has chosen an algorithm, gets algorithm information and required inputs for user to populate and submit
	- endpoint pt1: `hysds/executeInputs`
	- sends a GET request to get information about specified algorithm's inputs
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
	<br>

	- endpoint pt2:: `hysds/execute`
	- use this endpoint if calling API directly
	- sends a POST request to run a job and return the result right away, or run a background process that can be queried for status and/or result using the returned JobID
		- POST request sent to https://api.maap.xyz/api/dps/job
	- required inputs:
		- algo_id
		- version
		- identifier
		- inputs (comma-separated list of input fields)
		- each input field
7. Get Status
	- endpoint: `hysds/getStatus`
	- sends a GET request to check on a job's status
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}/status
8. Get Result
	- endpoint: `hysds/getResult`
	- sends a GET request to get the result of a job that has been executed in the background
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}
9. Dismiss
	- endpoint: `hysds/dismiss`
	- stop a job
	- not yet implemented
10. Default Values
	- NOT user-facing; helper for `Register Algorithm`
	- used to pre-populate registration fields when provided with a filepath
11. List Jobs
	- endpoint: `hysds/listJobs`
	- sends a GET request to get a user's list of jobs
		- GET request sent to https://api.maap.xyz/api/dps/job/{username}/list
	- helper for creating table of user's submitted jobs
	- returns table in HTML, joblist as list of dictionaries, and dictionary of job-id as key mapped to printable display info


#### Lab extension
For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter labextension link .
```

Install Required Module Dependencies:
```bash
npm install typescript
npm install jquery

npm install @jupyterlab/application
npm install @jupyterlab/launcher
npm install @jupyterlab/filebrowser
npm install @phosphor/widgets
npm install @jupyterlab/apputils
npm install @jupyterlab/coreutils
npm install @types/node --save
npm install @types/jquery --save
npm install jupyterlab_toastify
# npm install require
# npm install xml-formatter --save
```

#### Server extension

```bash
pip install -e .
jupyter serverextension enable --py submit_jobs --sys-prefix

```
