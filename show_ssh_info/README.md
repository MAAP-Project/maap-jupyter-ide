# show_ssh_info

## Overview
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

## Requirements
* JupyterLab >= 2.1.4
* nodejs >= 10.13.0
* [s3fs-fuse](https://github.com/s3fs-fuse/s3fs-fuse)
    * corresponding dependencies and s3 configurations/permissions
* Eclipse Che stack/workspace must have 2 installers enabled to allow ssh-ing into the workspace
    * `org.eclipse.che.exec`
    * `org.eclise.che.ssh`
* see `package.json` for package dependencies

### Build & Install Lab Extension
```bash
cd maap-jupyter-ide/show_ssh_info
npm install
npm run build
jupyter labextension install show_ssh_info
```

### Build & Install Server Extension
```bash
pip install -e .
jupyter serverextension enable --py show_ssh_info --sys-prefix
```

### Uninstall
```bash
jupyter labextension uninstall show_ssh_info
jupyter serverextension disable --py show_ssh_info --sys-prefix
```

## Development
* dependent on AWS/cloud setup and Che configurations as well

Contact: Maya Debellis (JPL), Elizabeth Yam (JPL)