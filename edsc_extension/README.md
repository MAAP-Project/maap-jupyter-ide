# edsc_extension

Allow users to use EDSC to search for datasets. Generate query or give the user the list of granule results.


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install esdc_extension
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

