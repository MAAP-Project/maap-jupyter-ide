# submit_jobs

UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There will be 10 API endpoints (currently WIP) for communication with MAS & DPS (HySDS) from the JupyterLab workspace, which are all registered on the CommandPalette.
1. Register
	- endpoint: `hysds/register`
	- checks if user has committed unchanged `.py` or `.ipynb` files
	- sends a POST request to DPS to register a new algorithm
		- POST request sent to https://api.maap.xyz/api/mas/algorithm
	- user-provided required parameters:
		- repository URL
		- algorithm name
		- run command
	- user-provided optional parameters:	
		- algorithm description
		- inputs
	- UI-provided required parameters:
		- nb_name: path to notebook file
2. RegisterAuto
	- endpoint: `hysds/registerAuto`
	- same as Register endpoint, except no required user-provided required parameters, which are provided by UI instead
	- user is still asked to list required parameters (if any)
	- UI-provided required parameters:
		- nb_name: path to notebook file
		- algo_name: algorithm name
		- lang: language of script
	- caveat: only works when user has at least 1 notebook open
	- TODO: give user dropdown of notebooks to choose if multiple open (currently grabs 1st notebook)
3. Delete Algorithm
	- endpoint: `hysds/deleteAlgorithm`
	- sends DELETE request to remove specified algorithm
		- DELETE request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
4. GetCapabilities
	- endpoint: `hysds/getCapabilities`
	- sends a GET request to DPS for a list of HySDS jobs and algorithms available from MAAP
		- GET request sent to https://api.maap.xyz/api/dps/job
5. ListAlgorithms
	- endpoint: `hysds/listAlgorithms`
	- sends GET request to list all algorithms registered with MAS
		- GET request sent to https://api.maap.xyz/api/mas/algorithm
6. DescribeProcess
	- endpoint: `hysds/describeProcess`
	- sends a GET request to get information about the specified algorithm
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
7. Execute
	- endpoint: `hysds/execute`
	- sends a GET request to get information about specified algorithm's inputs
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}:{algorithm_version}
	- sends a POST request to run a job and return the result right away, or run a background process that can be queried for status and/or result using the returned JobID
		- POST request sent to https://api.maap.xyz/api/dps/job
	- required inputs:
		- algo_id
		- version
		- identifier
		- inputs (comma-separated list of input fields)
		- each input field
8. GetStatus
	- endpoint: `hysds/getStatus`
	- sends a GET request to check on a job's status
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}/status
9. GetResult
	- endpoint: `hysds/getResult`
	- sends a GET request to get the result of a job that has been executed in the background
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}
10. Dismiss
	- endpoint: `hysds/dismiss`
	- stop a job
	- not yet implemented

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
npm install @phosphor/widgets
npm install @jupyterlab/apputils
npm install @jupyterlab/coreutils
npm install @types/node --save
npm install @types/jquery --save
# npm install require
# npm install xml-formatter --save
```

#### Server extension

```bash
pip install -e .
jupyter serverextension enable --py submit_jobs --sys-prefix

```
