import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

/**
 * Initialization data for the command palette example.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'command-palette',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    const { commands } = app;

    const command = 'user-metadata-form:command-palette';

    // Add a command
    commands.addCommand(command, {
      label: 'Open User Metadata Form',
      caption: 'Open User Metadata Form',
      execute: (args: any) => {
        console.log(
          `user-metadata-form:command-palette has been called ${args['origin']}.`
        );
        const url = 'https://questionnaire.maap-project.org/'
        window.open(url)
      },
    });

    // Add the command to the command palette
    const category = 'Metadata';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
  },
};

export default extension;