import { Menu, Widget } from '@phosphor/widgets';
import { IJupyterLabMenu, IMenuExtender, JupyterLabMenu } from './labmenu';
/**
 * An interface for a File menu.
 */
export interface IFileMenu extends IJupyterLabMenu {
    /**
     * Option to add a `Quit` entry in the File menu
     */
    quitEntry: boolean;
    /**
     * A submenu for creating new files/launching new activities.
     */
    readonly newMenu: IJupyterLabMenu;
    /**
     * The close and cleanup extension point.
     */
    readonly closeAndCleaners: Set<IFileMenu.ICloseAndCleaner<Widget>>;
    /**
     * The persist and save extension point.
     */
    readonly persistAndSavers: Set<IFileMenu.IPersistAndSave<Widget>>;
    /**
     * A set storing IConsoleCreators for the File menu.
     */
    readonly consoleCreators: Set<IFileMenu.IConsoleCreator<Widget>>;
}
/**
 * An extensible FileMenu for the application.
 */
export declare class FileMenu extends JupyterLabMenu implements IFileMenu {
    constructor(options: Menu.IOptions);
    /**
     * The New submenu.
     */
    readonly newMenu: JupyterLabMenu;
    /**
     * The close and cleanup extension point.
     */
    readonly closeAndCleaners: Set<IFileMenu.ICloseAndCleaner<Widget>>;
    /**
     * The persist and save extension point.
     */
    readonly persistAndSavers: Set<IFileMenu.IPersistAndSave<Widget>>;
    /**
     * A set storing IConsoleCreators for the Kernel menu.
     */
    readonly consoleCreators: Set<IFileMenu.IConsoleCreator<Widget>>;
    /**
     * Dispose of the resources held by the file menu.
     */
    dispose(): void;
    /**
     * Option to add a `Quit` entry in File menu
     */
    quitEntry: boolean;
}
/**
 * Namespace for IFileMenu
 */
export declare namespace IFileMenu {
    /**
     * Interface for an activity that has some cleanup action associated
     * with it in addition to merely closing its widget in the main area.
     */
    interface ICloseAndCleaner<T extends Widget> extends IMenuExtender<T> {
        /**
         * A label to use for the activity that is being cleaned up.
         */
        name: string;
        /**
         * A label to use for the cleanup action.
         */
        action: string;
        /**
         * A function to perform the close and cleanup action.
         */
        closeAndCleanup: (widget: T) => Promise<void>;
    }
    /**
     * Interface for an activity that has some persistence action
     * before saving.
     */
    interface IPersistAndSave<T extends Widget> extends IMenuExtender<T> {
        /**
         * A label to use for the activity that is being saved.
         */
        name: string;
        /**
         * A label to describe what is being persisted before saving.
         */
        action: string;
        /**
         * A function to perform the persistence.
         */
        persistAndSave: (widget: T) => Promise<void>;
    }
    /**
     * Interface for a command to create a console for an activity.
     */
    interface IConsoleCreator<T extends Widget> extends IMenuExtender<T> {
        /**
         * A label to use for the activity for which a console is being created.
         */
        name: string;
        /**
         * The function to create the console.
         */
        createConsole: (widget: T) => Promise<void>;
    }
}
