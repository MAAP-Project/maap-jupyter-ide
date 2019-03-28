# submit_jobs

UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There will be 7 API endpoints (currently WIP) for communication with MAS & DPS (HySDS) from the JupyterLab workspace, which are all registered on the CommandPalette.
1. Register
	- endpoint: `hysds/register`
	- sends a POST request to DPS to register a new algorithm
		- POST request sent to https://api.maap.xyz/api/mas/algorithm
2. GetCapabilities
	- endpoint: `hysds/getCapabilities`
	- sends a GET request to DPS for a list of HySDS jobs and algorithms available from MAAP
		- GET request sent to https://api.maap.xyz/api/dps/job
3. DescribeProcess
	- endpoint: `hysds/describeProcess`
	- sends a GET request to get information about the specified algorithm
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}]
4. Execute
	- endpoint: `hysds/execute`
	- sends a GET request to get information about specified algorithm's inputs
		- GET request sent to https://api.maap.xyz/api/mas/algorithm/{algorithm_id}
	- sends a POST request to run a job and return the result right away, or run a background process that can be queried for status and/or result using the returned JobID
		- POST request sent to https://api.maap.xyz/api/dps/job
5. GetStatus
	- endpoint: `hysds/getStatus`
	- sends a GET request to check on a job's status
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}/status
6. GetResult
	- endpoint: `hysds/getResult`
	- sends a GET request to get the result of a job that has been executed in the background
		- GET request sent to https://api.maap.xyz/api/dps/job/{job_id}
7. Dismiss
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
