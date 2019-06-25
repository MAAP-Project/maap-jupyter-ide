# edsc_extension

Allow users to use EDSC to search for datasets. 

This extension uses an iframe in the main area of jupyter to display the MAAP instance of EDSC. Users can select
search parameters through the iframe. Once they are done creating a query, they can go to an open notebook and select
commands to paste in the search query or the granule results of the search. There are also additional features such
as setting limits and viewing parameters.


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
jupyter serverextension enable --py edsc_extension --sys-prefix

```


