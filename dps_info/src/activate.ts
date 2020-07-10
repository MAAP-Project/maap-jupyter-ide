import { JupyterFrontEnd } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { IStateDB } from '@jupyterlab/statedb';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { ADEPanel } from './panel';
import { JobWidget, JobPanel } from './jobinfo';
import { getUsernameToken } from './funcs';
import '../style/index.css';

const profileId = 'maapsec-extension:IMaapProfile';
export const jobCache_update_command = 'jobs: panel-refresh';
export const jobWidget_open_command = 'jobs: main-widget';
export const jobWidget_update_command = 'jobs: main-widget-update';

// -------------------------------------------------------------
// panel widget activation
export function activateJobPanel(app: JupyterFrontEnd, palette: ICommandPalette, state: IStateDB, mainMenu: IMainMenu): void{
  // need username to create job table
  getUsernameToken(state, profileId, function(uname,token) {
    var jobsTable = new JobPanel(uname);
    jobsTable.update()
    var jobsPanel = new ADEPanel(jobsTable);

    // set jobsTable metadata
    jobsPanel.id = 'job-cache-display';
    jobsPanel.title.label = 'Jobs';
    jobsPanel.title.caption = 'jobs sent to DPS';
    jobsPanel.update();

    // add to app
    app.shell.add(jobsPanel, 'left', {rank: 300});

    // add update command
    app.commands.addCommand(jobCache_update_command, {
      label: 'Refresh Job List',
      isEnabled: () => true,
      execute: args => {
        jobsPanel.update();
      }
    });
    palette.addItem({command: jobCache_update_command, category: 'DPS/MAS'});
    // console.log('HySDS JobList panel is activated!');
  });
}

// activate main area widget
export function activateJobWidget(app: JupyterFrontEnd, palette: ICommandPalette, state: IStateDB) {
  // need username to create job table
  getUsernameToken(state, profileId, function(uname,token) {
    let content = new JobWidget(uname);
    const jobsWidget = new MainAreaWidget({content});

    // Declare a widget variable
    let widget: MainAreaWidget<JobWidget>;

    // add open/update command
    app.commands.addCommand(jobWidget_open_command, {
      label: 'Open Jobs Main Widget',
      execute: () => {
        if (!widget) {
          console.log('setting widget attr');
          widget = jobsWidget;
          widget.id = 'jobs-main-widget';
          widget.title.label = 'Jobs Main Widget';
          widget.title.closable = true;
        }
        // if (!tracker.has(widget)) {
        //   // Track the state of the widget for later restoration
        //   tracker.add(widget);
        // }
        if (!widget.isAttached) {
          console.log('attaching widget');
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        widget.content.update();

        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    app.commands.addCommand(jobWidget_update_command, {
      label: 'Update Jobs Main Widget',
      execute: () => {
        if (widget) {
          widget.content.update();
        }
      }
    });

    // Add the command to the palette.
    palette.addItem({command: jobWidget_open_command, category: 'DPS/MAS' });
    palette.addItem({command: jobWidget_update_command, category: 'DPS/MAS'});

    // Track and restore the widget state
    // let tracker = new WidgetTracker<MainAreaWidget<JobWidget>>({
    //   namespace: 'jobs'
    // });
    // restorer.restore(tracker, {
    //   command: jobWidget_command,
    //   name: () => 'jobs'
    // });
    // console.log('HySDS Mainarea Job Widget is activated!');
  });
}

// add DPS options to Menu dropdown
export function activateMenuOptions(app: JupyterFrontEnd, mainMenu: IMainMenu) {
  const { commands } = app;
  let dpsMenu = new Menu({ commands });
  dpsMenu.title.label = 'DPS UI';
  // let dpsMenu: Menu = document.getElementById('dps-mas-operations');
  [
    jobCache_update_command,
    jobWidget_open_command,
    jobWidget_update_command
  ].forEach(command => {
    dpsMenu.addItem({ command });
  });
  mainMenu.addMenu(dpsMenu, { rank: 102 });
}
