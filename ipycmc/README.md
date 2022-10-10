# ipycmc

[![Build Status](https://travis-ci.org/MAAP-Project/ipycmc.svg?branch=master)](https://travis-ci.org/MAAP-Project/ipycmc)
[![codecov](https://codecov.io/gh/MAAP-Project/ipycmc/branch/master/graph/badge.svg)](https://codecov.io/gh/MAAP-Project/ipycmc)

## Overview
A Jupyter Lab widget for embedding the Common Mapping Client into a Python Jupyter Notebook.

## Requirements
* JupyterLab >= 3.4.7
* nodejs >= 15.8.0
* maap-common-mapping-client `stable-pub`
* see `package.json` for package dependencies

### Build & Install nbextension
```bash
cd maap-jupyter-ide/ipycmc 
npm install 
npm run build
sudo pip install -e .
jupyter nbextension install --py --symlink --sys-prefix ipycmc
jupyter nbextension enable --py --sys-prefix ipycmc
jupyter labextension install --no-build
```

### Uninstall
```bash
jupyter labextension uninstall ipycmc
jupyter nbextension disable --py --sys-prefix ipycmc
```

### Launching jupyter lab
If you see "Error displaying widget: model not found" or a javascript error, you need to give the build a minute complete.

## NOTES
 * `jupyter labextension install @jupyter-widgets/jupyterlab-manager`
 * `jupyter labextension install @jupyterlab/plotly-extension`
 * `npm run everything`

*third party libs*
 * https://github.com/jupyterlab/jupyter-renderers/tree/master/packages/plotly-extension
 * https://github.com/plotly/plotly.py
 * https://2.python-requests.org/en/master/

Contact: Flynn Platt (JPL)
