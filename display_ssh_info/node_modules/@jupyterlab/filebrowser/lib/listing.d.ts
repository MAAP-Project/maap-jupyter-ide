import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';
import { IIterator } from '@phosphor/algorithm';
import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { FileBrowserModel } from './model';
/**
 * A widget which hosts a file list area.
 */
export declare class DirListing extends Widget {
    /**
     * Construct a new file browser directory listing widget.
     *
     * @param model - The file browser view model.
     */
    constructor(options: DirListing.IOptions);
    /**
     * Dispose of the resources held by the directory listing.
     */
    dispose(): void;
    /**
     * Get the model used by the listing.
     */
    readonly model: FileBrowserModel;
    /**
     * Get the dir listing header node.
     *
     * #### Notes
     * This is the node which holds the header cells.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    readonly headerNode: HTMLElement;
    /**
     * Get the dir listing content node.
     *
     * #### Notes
     * This is the node which holds the item nodes.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    readonly contentNode: HTMLElement;
    /**
     * The renderer instance used by the directory listing.
     */
    readonly renderer: DirListing.IRenderer;
    /**
     * The current sort state.
     */
    readonly sortState: DirListing.ISortState;
    /**
     * Create an iterator over the listing's selected items.
     *
     * @returns A new iterator over the listing's selected items.
     */
    selectedItems(): IIterator<Contents.IModel>;
    /**
     * Create an iterator over the listing's sorted items.
     *
     * @returns A new iterator over the listing's sorted items.
     */
    sortedItems(): IIterator<Contents.IModel>;
    /**
     * Sort the items using a sort condition.
     */
    sort(state: DirListing.ISortState): void;
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
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectNext(keepExisting?: boolean): void;
    /**
     * Select previous item.
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectPrevious(keepExisting?: boolean): void;
    /**
     * Select the first item that starts with prefix being typed.
     */
    selectByPrefix(): void;
    /**
     * Get whether an item is selected by name.
     *
     * @param name - The name of of the item.
     *
     * @returns Whether the item is selected.
     */
    isSelected(name: string): boolean;
    /**
     * Find a model given a click.
     *
     * @param event - The mouse event.
     *
     * @returns The model for the selected file.
     */
    modelForClick(event: MouseEvent): Contents.IModel | undefined;
    /**
     * Select an item by name.
     *
     * @parem name - The name of the item to select.
     *
     * @returns A promise that resolves when the name is selected.
     */
    selectItemByName(name: string): Promise<void>;
    /**
     * Handle the DOM events for the directory listing.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the panel's DOM node. It should
     * not be called directly by user code.
     */
    handleEvent(event: Event): void;
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * A message handler invoked on an `'after-show'` message.
     */
    protected onAfterShow(msg: Message): void;
    /**
     * A handler invoked on an `'update-request'` message.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle the `'click'` event for the widget.
     */
    private _evtClick;
    /**
     * Handle the `'scroll'` event for the widget.
     */
    private _evtScroll;
    /**
     * Handle the `'mousedown'` event for the widget.
     */
    private _evtMousedown;
    /**
     * Handle the `'mouseup'` event for the widget.
     */
    private _evtMouseup;
    /**
     * Handle the `'mousemove'` event for the widget.
     */
    private _evtMousemove;
    /**
     * Handle the `'keydown'` event for the widget.
     */
    private _evtKeydown;
    /**
     * Handle the `'dblclick'` event for the widget.
     */
    private _evtDblClick;
    /**
     * Handle the `drop` event for the widget.
     */
    private _evtNativeDrop;
    /**
     * Handle the `'p-dragenter'` event for the widget.
     */
    private _evtDragEnter;
    /**
     * Handle the `'p-dragleave'` event for the widget.
     */
    private _evtDragLeave;
    /**
     * Handle the `'p-dragover'` event for the widget.
     */
    private _evtDragOver;
    /**
     * Handle the `'p-drop'` event for the widget.
     */
    private _evtDrop;
    /**
     * Start a drag event.
     */
    private _startDrag;
    /**
     * Handle selection on a file node.
     */
    private _handleFileSelect;
    /**
     * Handle a multiple select on a file item node.
     */
    private _handleMultiSelect;
    /**
     * Copy the selected items, and optionally cut as well.
     */
    private _copy;
    /**
     * Delete the files with the given names.
     */
    private _delete;
    /**
     * Allow the user to rename item on a given row.
     */
    private _doRename;
    /**
     * Select a given item.
     */
    private _selectItem;
    /**
     * Handle the `refreshed` signal from the model.
     */
    private _onModelRefreshed;
    /**
     * Handle a `pathChanged` signal from the model.
     */
    private _onPathChanged;
    /**
     * Handle a `fileChanged` signal from the model.
     */
    private _onFileChanged;
    /**
     * Handle an `activateRequested` signal from the manager.
     */
    private _onActivateRequested;
    private _model;
    private _editNode;
    private _items;
    private _sortedItems;
    private _sortState;
    private _drag;
    private _dragData;
    private _selectTimer;
    private _isCut;
    private _prevPath;
    private _clipboard;
    private _manager;
    private _softSelection;
    private _selection;
    private _renderer;
    private _searchPrefix;
    private _searchPrefixTimer;
    private _inRename;
    private _isDirty;
}
/**
 * The namespace for the `DirListing` class statics.
 */
export declare namespace DirListing {
    /**
     * An options object for initializing a file browser directory listing.
     */
    interface IOptions {
        /**
         * A file browser model instance.
         */
        model: FileBrowserModel;
        /**
         * A renderer for file items.
         *
         * The default is a shared `Renderer` instance.
         */
        renderer?: IRenderer;
    }
    /**
     * A sort state.
     */
    interface ISortState {
        /**
         * The direction of sort.
         */
        direction: 'ascending' | 'descending';
        /**
         * The sort key.
         */
        key: 'name' | 'last_modified';
    }
    /**
     * The render interface for file browser listing options.
     */
    interface IRenderer {
        /**
         * Create the DOM node for a dir listing.
         */
        createNode(): HTMLElement;
        /**
         * Populate and empty header node for a dir listing.
         *
         * @param node - The header node to populate.
         */
        populateHeaderNode(node: HTMLElement): void;
        /**
         * Handle a header click.
         *
         * @param node - A node populated by [[populateHeaderNode]].
         *
         * @param event - A click event on the node.
         *
         * @returns The sort state of the header after the click event.
         */
        handleHeaderClick(node: HTMLElement, event: MouseEvent): ISortState;
        /**
         * Create a new item node for a dir listing.
         *
         * @returns A new DOM node to use as a content item.
         */
        createItemNode(): HTMLElement;
        /**
         * Update an item node to reflect the current state of a model.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param model - The model object to use for the item state.
         *
         * @param fileType - The file type of the item, if applicable.
         */
        updateItemNode(node: HTMLElement, model: Contents.IModel, fileType?: DocumentRegistry.IFileType): void;
        /**
         * Get the node containing the file name.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @returns The node containing the file name.
         */
        getNameNode(node: HTMLElement): HTMLElement;
        /**
         * Create an appropriate drag image for an item.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param count - The number of items being dragged.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         * @returns An element to use as the drag image.
         */
        createDragImage(node: HTMLElement, count: number, fileType?: DocumentRegistry.IFileType): HTMLElement;
    }
    /**
     * The default implementation of an `IRenderer`.
     */
    class Renderer implements IRenderer {
        /**
         * Create the DOM node for a dir listing.
         */
        createNode(): HTMLElement;
        /**
         * Populate and empty header node for a dir listing.
         *
         * @param node - The header node to populate.
         */
        populateHeaderNode(node: HTMLElement): void;
        /**
         * Handle a header click.
         *
         * @param node - A node populated by [[populateHeaderNode]].
         *
         * @param event - A click event on the node.
         *
         * @returns The sort state of the header after the click event.
         */
        handleHeaderClick(node: HTMLElement, event: MouseEvent): ISortState;
        /**
         * Create a new item node for a dir listing.
         *
         * @returns A new DOM node to use as a content item.
         */
        createItemNode(): HTMLElement;
        /**
         * Update an item node to reflect the current state of a model.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param model - The model object to use for the item state.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         */
        updateItemNode(node: HTMLElement, model: Contents.IModel, fileType?: DocumentRegistry.IFileType): void;
        /**
         * Get the node containing the file name.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @returns The node containing the file name.
         */
        getNameNode(node: HTMLElement): HTMLElement;
        /**
         * Create a drag image for an item.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param count - The number of items being dragged.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         * @returns An element to use as the drag image.
         */
        createDragImage(node: HTMLElement, count: number, fileType?: DocumentRegistry.IFileType): HTMLElement;
        /**
         * Create a node for a header item.
         */
        private _createHeaderItemNode;
    }
    /**
     * The default `IRenderer` instance.
     */
    const defaultRenderer: Renderer;
}
