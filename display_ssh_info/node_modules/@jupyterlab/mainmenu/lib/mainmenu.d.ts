import { CommandRegistry } from '@phosphor/commands';
import { Token } from '@phosphor/coreutils';
import { Menu, MenuBar } from '@phosphor/widgets';
import { IFileMenu, FileMenu } from './file';
import { IEditMenu, EditMenu } from './edit';
import { IHelpMenu, HelpMenu } from './help';
import { IKernelMenu, KernelMenu } from './kernel';
import { IRunMenu, RunMenu } from './run';
import { ISettingsMenu, SettingsMenu } from './settings';
import { IViewMenu, ViewMenu } from './view';
import { ITabsMenu, TabsMenu } from './tabs';
/**
 * The main menu token.
 */
export declare const IMainMenu: Token<IMainMenu>;
/**
 * The main menu interface.
 */
export interface IMainMenu {
    /**
     * Add a new menu to the main menu bar.
     */
    addMenu(menu: Menu, options?: IMainMenu.IAddOptions): void;
    /**
     * The application "File" menu.
     */
    readonly fileMenu: IFileMenu;
    /**
     * The application "Edit" menu.
     */
    readonly editMenu: IEditMenu;
    /**
     * The application "View" menu.
     */
    readonly viewMenu: IViewMenu;
    /**
     * The application "Help" menu.
     */
    readonly helpMenu: IHelpMenu;
    /**
     * The application "Kernel" menu.
     */
    readonly kernelMenu: IKernelMenu;
    /**
     * The application "Run" menu.
     */
    readonly runMenu: IRunMenu;
    /**
     * The application "Settings" menu.
     */
    readonly settingsMenu: ISettingsMenu;
    /**
     * The application "Tabs" menu.
     */
    readonly tabsMenu: ITabsMenu;
}
/**
 * The namespace for IMainMenu attached interfaces.
 */
export declare namespace IMainMenu {
    /**
     * The options used to add a menu to the main menu.
     */
    interface IAddOptions {
        /**
         * The rank order of the menu among its siblings.
         */
        rank?: number;
    }
}
/**
 * The main menu class.  It is intended to be used as a singleton.
 */
export declare class MainMenu extends MenuBar implements IMainMenu {
    /**
     * Construct the main menu bar.
     */
    constructor(commands: CommandRegistry);
    /**
     * The application "Edit" menu.
     */
    readonly editMenu: EditMenu;
    /**
     * The application "File" menu.
     */
    readonly fileMenu: FileMenu;
    /**
     * The application "Help" menu.
     */
    readonly helpMenu: HelpMenu;
    /**
     * The application "Kernel" menu.
     */
    readonly kernelMenu: KernelMenu;
    /**
     * The application "Run" menu.
     */
    readonly runMenu: RunMenu;
    /**
     * The application "Settings" menu.
     */
    readonly settingsMenu: SettingsMenu;
    /**
     * The application "View" menu.
     */
    readonly viewMenu: ViewMenu;
    /**
     * The application "Tabs" menu.
     */
    readonly tabsMenu: TabsMenu;
    /**
     * Add a new menu to the main menu bar.
     */
    addMenu(menu: Menu, options?: IMainMenu.IAddOptions): void;
    /**
     * Dispose of the resources held by the menu bar.
     */
    dispose(): void;
    /**
     * Handle the disposal of a menu.
     */
    private _onMenuDisposed;
    private _items;
}
