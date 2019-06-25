# insert_defaults_to_notebook

Add a button to the notebook toolbar. When clicked it will insert the default libraries for MAAP
as the top cell in user's notebook.


## Prerequisites

* JupyterLab


## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

