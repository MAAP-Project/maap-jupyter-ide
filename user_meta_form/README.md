# user_meta_form


This extension adds a command to the command palette to open a [form]('https://questionnaire.maap-project.org/') 
in a separate browser window. This form allows users to fill out metadata info about their algorithm.

## Requirements

* JupyterLab >= 0.30.0 

## Install

```bash
jupyter labextension install jupyterlab-ext
```

## Contributing

### Install

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Install dependencies
yarn install
# Rebuild JupyterLab after making any changes
yarn run build build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

### Uninstall

```bash
jupyter labextension uninstall jupyterlab-ext
```

