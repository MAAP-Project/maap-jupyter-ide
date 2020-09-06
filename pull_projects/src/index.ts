import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { ProjectsPull, ProjectsList } from './widgets'
import { popup } from './popup'


///////////////////////////////////////////////////////////////
//
// Pull Projects extension
//
///////////////////////////////////////////////////////////////
const pull_extension: JupyterFrontEndPlugin<void> = {
  id: 'pull_projects',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate_pull
};

function activate_pull(app: JupyterFrontEnd,
                  palette: ICommandPalette,
                  launcher: ILauncher | null) {

   // Add an application command
  const open_command = 'pull_projects:pull';

  app.commands.addCommand(open_command, {
    label: 'Pull All Projects',
    isEnabled: () => true,
    execute: args => {
      new ProjectsPull();
    }
  });

  palette.addItem({command: open_command, category: 'Projects'});

  console.log('JupyterFrontEnd pull is activated! Auto-pulling projects.');
  new ProjectsPull();
  // console.log('Autopulled projects');
};


///////////////////////////////////////////////////////////////
//
// List Projects extension
//
///////////////////////////////////////////////////////////////
const list_extension: JupyterFrontEndPlugin<void> = {
  id: 'list_projects',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activate_list
};

function activate_list(app: JupyterFrontEnd,
                  palette: ICommandPalette,
                  launcher: ILauncher | null) {

   // Add an application command
  const open_command = 'pull_projects:list';

  app.commands.addCommand(open_command, {
    label: 'List All Projects',
    isEnabled: () => true,
    execute: args => {
      popup(new ProjectsList(), "List All Projects");
    }
  });

  palette.addItem({command: open_command, category: 'Projects'});

  console.log('JupyterFrontEnd list is activated!');
};


export default [pull_extension, list_extension];
