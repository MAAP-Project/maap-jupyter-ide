# submit_jobs

UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There will be 5 API endpoints (all WIP) for communication with DPS (HySDS) from the JupyterLab workspace, which are all registered on the CommandPalette.

1. GetCapabilities
	- endpoint: `hysds/getCapabilities`
	- sends a GET request to DPS for a list of HySDS jobs and algorithms available from MAAP
2. GetStatus
	- endpoint: `hysds/getStatus`
	- sends a GET request to check on a job's status
3. GetResult
	- endpoint: `hysds/getResult`
	- sets a GET request to get the result of a job that has been executed in the background
4. Execute
	- endpoint: `hysds/execute`
	- run a job and return the result right away, or run a background process that can be queried for status and/or result
5. Dismiss
	- endpoint: `hysds/dismiss`
	- stop a job

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


#### Server extension

```bash
pip install -e .
jupyter serverextension enable --py submit_jobs --sys-prefix

```
