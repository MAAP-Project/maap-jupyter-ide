# submit_jobs

UI form for users to submit jobs to HySDS/DPS

This connects the JupyterLab UI with the HySDS/DPS backend.  There is currently only one endpoint WIP, which creates a popup form with fields and will call the API endpoint `hysds/submit` with the fields as parameters.  This endpoint will call the HySDS API.  It is also registered with the Command Palette

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
jupyter serverextension enable --py pull_projects --sys-prefix

```
