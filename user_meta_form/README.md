# user_meta_form

## Overview
This extension adds a command to the command palette to open a [form]('https://questionnaire.maap-project.org/') 
in a separate browser window. This form allows users to fill out metadata info about their algorithm.

## Requirements
* JupyterLab >= 2.4.1
* nodejs >= 10.13.0 
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/user_meta_form
npm install
npm run build
jupyter labextension link .
```

### Uninstall
```bash
jupyter labextension uninstall user_meta_form
```

Contact: Alyssa Harris (devseed)
