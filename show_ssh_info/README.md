# show_ssh_info

This extension displays ssh info for a user to get onto the kubernetes cluster container for 
their workspace. It also injects the users SSH key into their workspace from their auth 
profile (keycloak). This injection happens automatically when any user opens up the workspace, so no additional
step is needed to allow a user to ssh into the container.

This extension is dependent upon being run inside the Eclipse Che environment.


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
jupyter serverextension enable --py show_ssh_info --sys-prefix

```

