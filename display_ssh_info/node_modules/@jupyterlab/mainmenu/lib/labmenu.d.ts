import { IInstanceTracker } from '@jupyterlab/apputils';
import { IDisposable } from '@phosphor/disposable';
import { Menu, Widget } from '@phosphor/widgets';
/**
 * A common interface for extensible JupyterLab application menus.
 *
 * Plugins are still free to define their own menus in any way
 * they like. However, JupyterLab defines a few top-level
 * application menus that may be extended by plugins as well,
 * such as "Edit" and "View"
 */
export interface IJupyterLabMenu extends IDisposable {
    /**
     * Add a group of menu items specific to a particular
     * plugin.
     */
    addGroup(items: Menu.IItemOptions[], rank?: number): IDisposable;
}
/**
 * A base interface for a consumer of one of the menu
 * semantic extension points. The IMenuExtender gives
 * an instance tracker which is checked when the menu
 * is deciding which IMenuExtender to delegate to upon
 * selection of the menu item.
 */
export interface IMenuExtender<T extends Widget> {
    /**
     * A widget tracker for identifying the appropriate extender.
     */
    tracker: IInstanceTracker<T>;
    /**
     * An additional function that determines whether the extender
     * is enabled. By default it is considered enabled if the application
     * active widget is contained in the `tracker`. If this is also
     * provided, the criterion is equivalent to
     * `tracker.has(widget) && extender.isEnabled(widget)`
     */
    isEnabled?: (widget: T) => boolean;
}
/**
 * An extensible menu for JupyterLab application menus.
 */
export declare class JupyterLabMenu implements IJupyterLabMenu {
    /**
     * Construct a new menu.
     *
     * @param options - Options for the phosphor menu.
     *
     * @param includeSeparators - whether to include separators between the
     *   groups that are added to the menu.
     */
    constructor(options: Menu.IOptions, includeSeparators?: boolean);
    /**
     * Add a group of menu items specific to a particular
     * plugin.
     *
     * @param items - the list of menu items to add.
     *
     * @param rank - the rank in the menu in which to insert the group.
     */
    addGroup(items: Menu.IItemOptions[], rank?: number): IDisposable;
    /**
     * The underlying Phosphor menu.
     */
    readonly menu: Menu;
    /**
     * Whether the menu has been disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Dispose of the resources held by the menu.
     */
    dispose(): void;
    private _groups;
    private _isDisposed;
    private _includeSeparators;
}
