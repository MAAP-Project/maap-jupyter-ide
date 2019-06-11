# hide_side_panel

Hide or show the che side panel from jupyter IDE - this extension is only relevant in the context of Eclipse Che.


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

