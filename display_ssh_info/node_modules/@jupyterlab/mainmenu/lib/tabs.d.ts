import { Menu } from '@phosphor/widgets';
import { IJupyterLabMenu, JupyterLabMenu } from './labmenu';
/**
 * An interface for a Tabs menu.
 */
export interface ITabsMenu extends IJupyterLabMenu {
}
/**
 * An extensible Tabs menu for the application.
 */
export declare class TabsMenu extends JupyterLabMenu implements ITabsMenu {
    /**
     * Construct the tabs menu.
     */
    constructor(options: Menu.IOptions);
}
