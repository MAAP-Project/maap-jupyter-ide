# show_ssh_info

This extension has become a general user mamagement extension. It's capabilities:

- Displays ssh info for a user to get onto the kubernetes cluster container for 
their workspace. 
- Injects the users SSH key into their workspace from their auth 
profile (keycloak). This injection happens automatically when any user opens up the workspace, so no additional
step is needed to allow a user to ssh into the container.
- Mount user and org s3 buckets
- Provide user sharable signed s3 link 
- Update keycloak token at set time interval so users don't get blocked from using token enabled features
after a few minutes

This extension is dependent upon being run inside the Eclipse Che environment and having the keycloak user profile info.


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

