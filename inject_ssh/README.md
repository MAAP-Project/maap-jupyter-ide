# inject_ssh

This extension grabs the user's public ssh key from the keycloak object that exists in the context of the browser. This extension was developed in javascript rather than typescript becuase typescript's global scope is different and doesn't allow you to access custom elements on the window.

## Development

#### Lab extension
For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm install
jupyter labextension link .
```


#### Server extension

```bash
pip install -e .
jupyter serverextension enable --py inject_ssh --sys-prefix

```
