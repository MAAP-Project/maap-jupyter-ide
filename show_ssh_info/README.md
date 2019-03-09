# show_ssh_info

This extension displays ssh info for a kubernetes cluster container. This won't work unless it is being run in the Jupyter Lab instance inside Che.


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

