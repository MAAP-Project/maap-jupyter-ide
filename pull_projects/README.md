# pull_projects

## Overview
Since _Che_ doesn't automatically import projects from the workspace setup into the JupyterLab containers, this extension accomplishes that.  Currently, if a user has any projects added to the workspace, the extension is set up to automatically pull in all projects.<br>

Features: 
- Clone user's gitlab project's into their workspace (uses gitlab token from keycloak to clone private repos)<br>

There are 3 API endpoints for handling projects listed under _Che_ with the JupyterLab workspace.

1. `pull_projects/list`
	- registered on the Command Palette
	- creates a small popup Dialog with unformatted dictionary of project info
		- to be improved
2. `pull_projects/getProject`
	- NOT on Command Palette
	- takes parameters `location` (e.g. git URL) and `src_type` (e.g. `git`)
		- currently only supports git URLs and links to ZIPs
3. `pull_projects/getAllProjects`
	- registered on the Command Palette
	- creates a small popup Dialog with result of the project import (`project import done` or `project import failed`)

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/pull_projects
npm install
npm run build
jupyter labextension link .
```

### Build & Install Server Extension
```bash
cd maap-jupyter-ide/pull_projects
pip install -e .
jupyter serverextension enable --py pull_projects --sys-prefix
```

### Uninstall
```bashpull_projects
jupyter labextension uninstall pull_projects
jupyter serverextension disable --py pull_projects --sys-prefix
```

## Development

Contacts: Elizabeth Yam (JPL), Maya Debellis (JPL)
