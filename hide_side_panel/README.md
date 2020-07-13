# hide_side_panel

## Overview
Hide or show the che side panel from the Jupyter IDE - this extension is only relevant in the context of Eclipse Che.

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* instance running inside an Eclipse Che workspace
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/hide_side_panel
npm install
npm run build
jupyter labextension link .
```

### Uninstall
```bash
jupyter labextension uninstall hide_side_panel
```

Contact: Maya Debellis (JPL)
