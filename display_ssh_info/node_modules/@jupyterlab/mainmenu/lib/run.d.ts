import { Menu, Widget } from '@phosphor/widgets';
import { IJupyterLabMenu, IMenuExtender, JupyterLabMenu } from './labmenu';
/**
 * An interface for a Run menu.
 */
export interface IRunMenu extends IJupyterLabMenu {
    /**
     * A set storing ICodeRunner for the Run menu.
     *
     * ### Notes
     * The key for the set may be used in menu labels.
     */
    readonly codeRunners: Set<IRunMenu.ICodeRunner<Widget>>;
}
/**
 * An extensible Run menu for the application.
 */
export declare class RunMenu extends JupyterLabMenu implements IRunMenu {
    /**
     * Construct the run menu.
     */
    constructor(options: Menu.IOptions);
    /**
     * A set storing ICodeRunner for the Run menu.
     *
     * ### Notes
     * The key for the set may be used in menu labels.
     */
    readonly codeRunners: Set<IRunMenu.ICodeRunner<Widget>>;
    /**
     * Dispose of the resources held by the run menu.
     */
    dispose(): void;
}
/**
 * A namespace for RunMenu statics.
 */
export declare namespace IRunMenu {
    /**
     * An object that runs code, which may be
     * registered with the Run menu.
     */
    interface ICodeRunner<T extends Widget> extends IMenuExtender<T> {
        /**
         * A string label for the thing that is being run,
         * which is used to populate the menu labels.
         */
        noun: string;
        /**
         * A function to run a chunk of code.
         */
        run?: (widget: T) => Promise<void>;
        /**
         * A function to run the entirety of the code hosted by the widget.
         */
        runAll?: (widget: T) => Promise<void>;
        /**
         * A function to restart and run all the code hosted by the widget, which
         * returns a promise of whether the action was performed.
         */
        restartAndRunAll?: (widget: T) => Promise<boolean>;
    }
}
