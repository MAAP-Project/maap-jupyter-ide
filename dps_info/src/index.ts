import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IStateDB } from '@jupyterlab/statedb';
import { Menu } from '@lumino/widgets';
import { JobTable, JobWidget } from './jobinfo';
import { getUsernameToken } from './funcs';

export const jPanel_update_command = 'jobs: panel-refresh';
export const jWidget_command = 'jobs: main-widget';
const profileId = 'maapsec-extension:IMaapProfile';

/**
 * Initialization data for the dps_info extension.
 */
const extensionPanel: JupyterFrontEndPlugin<void> = {
    id: 'jobs_panel',
    autoStart: true,
    requires: [ICommandPalette, IStateDB],
    activate: (app: JupyterFrontEnd, palette: ICommandPalette, state: IStateDB) => {

        getUsernameToken(state,profileId).then((res) => {
            let username = res[0];
            let jPanel = new JobTable(username, state);
            jPanel.id = 'job-cache-display';
        
            jPanel.title.label = 'Jobs';
            jPanel.title.caption = 'Jobs sent to DPS';
            app.shell.add(jPanel, 'left', {rank: 300});
        
            app.commands.addCommand(jPanel_update_command, {
                label: 'Refresh Job List',
                isEnabled: () => true,
                execute: args => {
                    jPanel.update();
                }
            });
        
            palette.addItem({command: jPanel_update_command, category: 'DPS/MAS'});
            console.log('JupyterLab extension dps_info jobs panel is activated!');
            setTimeout(() => { jPanel.update(); }, 2000);
        });
    }
};

const extensionTabUI: JupyterFrontEndPlugin<void> = {
    id: 'jobs_ui',
    autoStart: true,
    requires: [ICommandPalette, IStateDB],
    activate: (app: JupyterFrontEnd, palette: ICommandPalette, state: IStateDB) => {
        getUsernameToken(state,profileId).then((res) => {
            let username = res[0];
            let content = new JobWidget(username, state);
            const jobsWidget: MainAreaWidget<JobWidget> = new MainAreaWidget({content});
    
            app.commands.addCommand(jWidget_command, {
                label: 'DPS Jobs UI',
                isEnabled: () => true,
                execute: args => {
                    if (!jobsWidget) {
                        jobsWidget.id = 'jobs-main-widget';
                        jobsWidget.title.label = 'DPS Jobs UI';
                        jobsWidget.title.closable = true;
                        jobsWidget.content.update();
                    } else {
                        jobsWidget.content.update();
                    }
                    // if (!tracker.has(widget)) {
                    //   // Track the state of the widget for later restoration
                    //   tracker.add(widget);
                    // }
                    if (!jobsWidget.isAttached) {
                        console.log('attaching widget');
                        app.shell.add(jobsWidget, 'main');
                    }
                    console.log(jobsWidget);
                    
                    app.shell.activateById(jobsWidget.id);
                }
            });
            
            palette.addItem({command: jWidget_command, category: 'DPS/MAS'});
            console.log('JupyterLab extension dps_info job widget ui is activated!'); 
            setTimeout(() => { jobsWidget.content.update(); }, 2000);
        });
    }
}

const extensionDPSUIMenu: JupyterFrontEndPlugin<void> = {
    id: 'dps-ui-menu',
    autoStart: true,
    requires: [IMainMenu],
    activate: (app: JupyterFrontEnd, mainMenu: IMainMenu) => {
        const { commands } = app;
        let uiMenu = new Menu({ commands});
        uiMenu.id = 'dps-ui-operations';
        uiMenu.title.label = 'DPS UI Menu';
        [
            jPanel_update_command,
            jWidget_command
        ].forEach(command => {
            uiMenu.addItem({ command});
        });
        mainMenu.addMenu(uiMenu, {rank: 102 });

        console.log('Added dps UI menu options');
    }
}

export default [extensionPanel,extensionTabUI,extensionDPSUIMenu];
