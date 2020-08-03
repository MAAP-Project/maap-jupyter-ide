# insert_defaults_to_notebook

## Overview
Add a button to the Jupyter Notebook toolbar. When clicked it will insert the default libraries for MAAP as the top cell in user's notebook.

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/insert_defaults_to_notebook
npm install
npm run build
jupyter labextension link .
```

### Uninstall
```bash
jupyter labextension uninstall insert_defaults_to_notebook
```

## Development

Contact: Maya Debellis (JPL)
