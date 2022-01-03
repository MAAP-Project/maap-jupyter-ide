// import {
//   JupyterFrontEnd, JupyterFrontEndPlugin
// } from '@jupyterlab/application';

// import {
//   ICommandPalette
// } from '@jupyterlab/apputils';

// const extension: JupyterFrontEndPlugin<void> = { 
//   id: 'user-metadata-form',
//   requires: [ICommandPalette],
//   autoStart: true,
//   activate (app: JupyterFrontEnd, palette: ICommandPalette): void {
//     /**
//      * Initialization data for the jupyterlab-ext extension.
//      */

// // mainMenu.addMenu(menu, { rank: 40 });
// //     app.commands.addCommand(command, {
// //       label: 'Share your own data',
// //       execute: () => {
// //         const url = 'https://questionnaire.maap-project.org/';
// //         window.open(url)
// //       }
// //     });

// //     palette.addItem({ command: command, category: 'Metadata' });
//     console.log("user_meta_form activated");

//   }
// };

// export default extension;

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
    const category = 'Extension Examples';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
  },
};

export default extension;