# edsc_extension

## Overview
Allow users to use EDSC to search for datasets. 

This extension uses an iframe in the main area of Jupyter to display the MAAP instance of EDSC. Users can select search parameters through the iframe. Once they are done creating a query, they can go to an open notebook and select commands to paste in the search query or the granule results of the search. There are also additional features such as setting limits and viewing parameters.

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* jupyterlab_toastify = 2.3.0
* requires a connection to the MAAP CMR instance
* `maap-py` library https://github.com/MAAP-Project/maap-py
* see `package.json` for package dependencies


### Build & Install Lab Extension
Make sure you have jupyterlab_toastify installed (see repo README).

```bash
cd maap-jupyter-ide/edsc_extension
npm install
npm run build
jupyter labextension link .
```

### Build & Install Server Extension
Make sure you have the `maap-py` library installed.

```bash
cd maap-jupyter-ide/edsc_extension
pip install -e .
jupyter serverextension enable --py edsc_extension --sys-prefix
```

### Uninstall

```bash
jupyter labextension uninstall edsc_extension
jupyter serverextension disable --py edsc_extension --sys-prefix
```

## Development
* dependent on a connetion to the MAAP CMR instance

Contact: Maya Debellis (JPL)
