# maapsec

## Overview
Login to MAAP CAS and access user's MAAP profile information.


## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* jupyterlab_toastify = 3.0.0
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/maapsec
npm install
npm run build
jupyter labextension install maapsec
```

### Build & Install Server Extension
```bash
cd maap-jupyter-ide/maapsec
pip install -e .
jupyter serverextension enable --py maapsec --sys-prefix
```

### Uninstall
```bash
jupyter labextension uninstall maapsec
jupyter serverextension disable --py maapsec --sys-prefix
```

## Development
Stores user CAS profile in a Jupyter IStateDB object with id `maapsec-extension:IMaapProfile`
Other extensions can grab that object to access user information.

Contact: Brian Satorius (JPL)