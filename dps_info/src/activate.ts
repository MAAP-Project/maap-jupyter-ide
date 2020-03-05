import { JupyterFrontEnd } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@phosphor/widgets';
import { ADEPanel } from './panel';
import { JobWidget, JobTable } from './jobinfo';
import '../style/index.css';

export const jobCache_update_command = 'jobs: panel-refresh';
export const jobWidget_command = 'jobs: main-widget';

export const jobsTable = new JobTable();
jobsTable.update();
let content = new JobWidget();
const jobsWidget = new MainAreaWidget({content});
export const jobsPanel = new ADEPanel(jobsTable);
// -------------------------------------------------------------
// panel widget activation
export function activateJobPanel(app: JupyterFrontEnd, palette: ICommandPalette, mainMenu: IMainMenu): void{
  var infoPanel = jobsPanel;
  infoPanel.id = 'job-cache-display';
  infoPanel.title.label = 'Jobs';
  infoPanel.title.caption = 'jobs sent to DPS';

  app.shell.add(infoPanel, 'left', {rank: 300});

  app.commands.addCommand(jobCache_update_command, {
    label: 'Refresh Job List',
    isEnabled: () => true,
    execute: args => {
      infoPanel.update();
    }
  });
  palette.addItem({command: jobCache_update_command, category: 'DPS/MAS'});
  console.log('HySDS JobList is activated!');
}

// activate main area widget
export function activateJobWidget(app: JupyterFrontEnd, palette: ICommandPalette) {
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  // Declare a widget variable
  // let widget: MainAreaWidget<JobWidget>;
  let widget: MainAreaWidget<JobWidget>;

  // Add an application command
  app.commands.addCommand(jobWidget_command, {
    label: 'Jobs Main Widget',
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

  // Add the command to the palette.
  palette.addItem({command: jobWidget_command, category: 'DPS/MAS' });

  // Track and restore the widget state
  // let tracker = new WidgetTracker<MainAreaWidget<JobWidget>>({
  //   namespace: 'jobs'
  // });
  // restorer.restore(tracker, {
  //   command: jobWidget_command,
  //   name: () => 'jobs'
  // });
}

// add DPS options to Menu dropdown
export function activateMenuOptions(app: JupyterFrontEnd, mainMenu: IMainMenu) {
  const { commands } = app;
  let dpsMenu = new Menu({ commands });
  dpsMenu.title.label = 'DPS UI';
  // let dpsMenu: Menu = document.getElementById('dps-mas-operations');
  [
    jobCache_update_command,
    jobWidget_command,
  ].forEach(command => {
    dpsMenu.addItem({ command });
  });
  mainMenu.addMenu(dpsMenu, { rank: 102 });
}
