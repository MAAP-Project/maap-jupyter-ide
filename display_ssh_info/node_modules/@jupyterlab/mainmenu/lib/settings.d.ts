import { Menu } from '@phosphor/widgets';
import { IJupyterLabMenu, JupyterLabMenu } from './labmenu';
/**
 * An interface for a Settings menu.
 */
export interface ISettingsMenu extends IJupyterLabMenu {
}
/**
 * An extensible Settings menu for the application.
 */
export declare class SettingsMenu extends JupyterLabMenu implements ISettingsMenu {
    /**
     * Construct the settings menu.
     */
    constructor(options: Menu.IOptions);
}
