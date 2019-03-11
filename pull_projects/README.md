# pull_projects

Since _Che_ doesn't automatically import projects from the workspace setup into the JupyterLab containers, this extension accomplishes that.

There are 3 API endpoints for handling projects listed under _Che_ with the JupyterLab workspace.

1. ListAllProjects
	- registered on the Command Palette
	- endpoint `pull_projects/ListAllProjects`
	- creates a small popup Dialog with unformatted dictionary of project info
		- to be improved
2. GetProject
	- NOT on Command Palette
	- endpoint `pull_projects/getProject`
	- takes parameters `location` (e.g. git URL) and `src_type` (e.g. `git`)
		- currently only supports git URLs and links to ZIPs
3. GetAllProjects
	- registered on the Command Palette
	- endpoint `pull_projects/getAllProjects`
	- creates a small popup Dialog with result of the project import (`project import done` or `project import failed`)


## Development

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
