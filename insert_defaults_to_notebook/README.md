# insert_defaults_to_notebook

insert the default libraries for MAAP into users notebooks


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install insert_defaults_to_notebook
```

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

