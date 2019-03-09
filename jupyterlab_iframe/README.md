# esdc_iframe

Injects Earthdata Search Client into Jupyter Lab interface. Uses an iframe to display esdc. This functions through a proxy that is hosted on the che server that sends the webpage back information on the paramters the user has selected in the iframe.

Users can then use the information selected in ESDC to make calls to the MAAP API. This is done through the [maap-py](https://github.com/MAAP-Project/maap-py) library. Users can copy the results of a search, or copy the search query itself to paste into their notebooks.


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
jupyter serverextension enable --py jupyterlab_iframe --sys-prefix

```

This extension was built off of [jupyterlab_iframe](https://github.com/timkpaine/jupyterlab_iframe).