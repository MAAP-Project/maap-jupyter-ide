import { Toolbar } from '@jupyterlab/apputils';
import { Contents } from '@jupyterlab/services';
import { IIterator } from '@phosphor/algorithm';
import { CommandRegistry } from '@phosphor/commands';
import { Widget } from '@phosphor/widgets';
import { DirListing } from './listing';
import { FileBrowserModel } from './model';
/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retrieve contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export declare class FileBrowser extends Widget {
    /**
     * Construct a new file browser.
     *
     * @param model - The file browser view model.
     */
    constructor(options: FileBrowser.IOptions);
    /**
     * The model used by the file browser.
     */
    readonly model: FileBrowserModel;
    /**
     * The toolbar used by the file browser.
     */
    readonly toolbar: Toolbar<Widget>;
    /**
     * Create an iterator over the listing's selected items.
     *
     * @returns A new iterator over the listing's selected items.
     */
    selectedItems(): IIterator<Contents.IModel>;
    /**
     * Rename the first currently selected item.
     *
     * @returns A promise that resolves with the new name of the item.
     */
    rename(): Promise<string>;
    /**
     * Cut the selected items.
     */
    cut(): void;
    /**
     * Copy the selected items.
     */
    copy(): void;
    /**
     * Paste the items from the clipboard.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    paste(): Promise<void>;
    /**
     * Delete the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    delete(): Promise<void>;
    /**
     * Duplicate the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    duplicate(): Promise<void>;
    /**
     * Download the currently selected item(s).
     */
    download(): void;
    /**
     * Shut down kernels on the applicable currently selected items.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    shutdownKernels(): Promise<void>;
    /**
     * Select next item.
     */
    selectNext(): void;
    /**
     * Select previous item.
     */
    selectPrevious(): void;
    /**
     * Find a model given a click.
     *
     * @param event - The mouse event.
     *
     * @returns The model for the selected file.
     */
    modelForClick(event: MouseEvent): Contents.IModel | undefined;
    /**
     * Handle a connection lost signal from the model.
     */
    private _onConnectionFailure;
    private _crumbs;
    private _listing;
    private _manager;
    private _showingError;
}
/**
 * The namespace for the `FileBrowser` class statics.
 */
export declare namespace FileBrowser {
    /**
     * An options object for initializing a file browser widget.
     */
    interface IOptions {
        /**
         * The command registry for use with the file browser.
         */
        commands: CommandRegistry;
        /**
         * The widget/DOM id of the file browser.
         */
        id: string;
        /**
         * A file browser model instance.
         */
        model: FileBrowserModel;
        /**
         * An optional renderer for the directory listing area.
         *
         * The default is a shared instance of `DirListing.Renderer`.
         */
        renderer?: DirListing.IRenderer;
    }
}
