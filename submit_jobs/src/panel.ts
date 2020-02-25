import { Panel } from '@phosphor/widgets';
// import { activateMenuOptions } from './funcs';

export const WIDGET_CLASS = 'jp-Widget';
export const CONTENT_CLASS = 'jp-Inspector-content';
// const palette_command = 'palette-command';

// Generic Panel that can be created with any content
export class ADEPanel extends Panel{
  content: any;
  updates: any[];
  constructor(content: any, updates: any[]) {
    super();
    this.content = content;
    this.updates = updates;
    // this.node.appendChild(content);
    this.addClass(CONTENT_CLASS);
    this.addClass(WIDGET_CLASS);
  }

  update() {
    this.content.update();
    for (var item of this.updates) {
      item.update();
    }
  }
}

// export function activateJobPanel(app: JupyterFrontEnd, palette: ICommandPalette, mainMenu: IMainMenu): void{
//   var infoPanel = jobsPanel;
//   infoPanel.id = 'panel-id';
//   infoPanel.title.label = 'panel-label';
//   infoPanel.title.caption = 'panel-caption';

//   // attach the panel
//   app.shell.add(infoPanel, 'left', {rank: 300});

//   app.commands.addCommand(palette_command, {
//     label: 'Refresh Job List',
//     isEnabled: () => true,
//     execute: args => {
//       infoPanel.update();
//     }
//   });
//   palette.addItem({command: palette_command, category: 'DPS/MAS'});
//   // jobsTable.updateDisplay();
//   console.log('Panel is activated!');

//   activateMenuOptions(app,mainMenu);
// }