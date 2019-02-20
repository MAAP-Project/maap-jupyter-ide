import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { Contents, Kernel, ServiceManager } from '@jupyterlab/services';
import { Token } from '@phosphor/coreutils';
import { IDisposable } from '@phosphor/disposable';
import { ISignal } from '@phosphor/signaling';
import { Widget } from '@phosphor/widgets';
/**
 * The document registry token.
 */
export declare const IDocumentManager: Token<IDocumentManager>;
/**
 * The interface for a document manager.
 */
export interface IDocumentManager extends DocumentManager {
}
/**
 * The document manager.
 *
 * #### Notes
 * The document manager is used to register model and widget creators,
 * and the file browser uses the document manager to create widgets. The
 * document manager maintains a context for each path and model type that is
 * open, and a list of widgets for each context. The document manager is in
 * control of the proper closing and disposal of the widgets and contexts.
 */
export declare class DocumentManager implements IDisposable {
    /**
     * Construct a new document manager.
     */
    constructor(options: DocumentManager.IOptions);
    /**
     * The registry used by the manager.
     */
    readonly registry: DocumentRegistry;
    /**
     * The service manager used by the manager.
     */
    readonly services: ServiceManager.IManager;
    /**
     * A signal emitted when one of the documents is activated.
     */
    readonly activateRequested: ISignal<this, string>;
    /**
     * Whether to autosave documents.
     */
    autosave: boolean;
    /**
     * Get whether the document manager has been disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Dispose of the resources held by the document manager.
     */
    dispose(): void;
    /**
     * Clone a widget.
     *
     * @param widget - The source widget.
     *
     * @returns A new widget or `undefined`.
     *
     * #### Notes
     *  Uses the same widget factory and context as the source, or returns
     *  `undefined` if the source widget is not managed by this manager.
     */
    cloneWidget(widget: Widget): IDocumentWidget | undefined;
    /**
     * Close all of the open documents.
     *
     * @returns A promise resolving when the widgets are closed.
     */
    closeAll(): Promise<void>;
    /**
     * Close the widgets associated with a given path.
     *
     * @param path - The target path.
     *
     * @returns A promise resolving when the widgets are closed.
     */
    closeFile(path: string): Promise<void>;
    /**
     * Get the document context for a widget.
     *
     * @param widget - The widget of interest.
     *
     * @returns The context associated with the widget, or `undefined` if no such
     * context exists.
     */
    contextForWidget(widget: Widget): DocumentRegistry.Context | undefined;
    /**
     * Copy a file.
     *
     * @param fromFile - The full path of the original file.
     *
     * @param toDir - The full path to the target directory.
     *
     * @returns A promise which resolves to the contents of the file.
     */
    copy(fromFile: string, toDir: string): Promise<Contents.IModel>;
    /**
     * Create a new file and return the widget used to view it.
     *
     * @param path - The file path to create.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    createNew(path: string, widgetName?: string, kernel?: Partial<Kernel.IModel>): Widget;
    /**
     * Delete a file.
     *
     * @param path - The full path to the file to be deleted.
     *
     * @returns A promise which resolves when the file is deleted.
     *
     * #### Notes
     * If there is a running session associated with the file and no other
     * sessions are using the kernel, the session will be shut down.
     */
    deleteFile(path: string): Promise<void>;
    /**
     * See if a widget already exists for the given path and widget name.
     *
     * @param path - The file path to use.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @returns The found widget, or `undefined`.
     *
     * #### Notes
     * This can be used to find an existing widget instead of opening
     * a new widget.
     */
    findWidget(path: string, widgetName?: string): IDocumentWidget | undefined;
    /**
     * Create a new untitled file.
     *
     * @param options - The file content creation options.
     */
    newUntitled(options: Contents.ICreateOptions): Promise<Contents.IModel>;
    /**
     * Open a file and return the widget used to view it.
     *
     * @param path - The file path to open.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    open(path: string, widgetName?: string, kernel?: Partial<Kernel.IModel>, options?: DocumentRegistry.IOpenOptions): IDocumentWidget | undefined;
    /**
     * Open a file and return the widget used to view it.
     * Reveals an already existing editor.
     *
     * @param path - The file path to open.
     *
     * @param widgetName - The name of the widget factory to use. 'default' will use the default widget.
     *
     * @param kernel - An optional kernel name/id to override the default.
     *
     * @returns The created widget, or `undefined`.
     *
     * #### Notes
     * This function will return `undefined` if a valid widget factory
     * cannot be found.
     */
    openOrReveal(path: string, widgetName?: string, kernel?: Partial<Kernel.IModel>, options?: DocumentRegistry.IOpenOptions): IDocumentWidget | undefined;
    /**
     * Overwrite a file.
     *
     * @param oldPath - The full path to the original file.
     *
     * @param newPath - The full path to the new file.
     *
     * @returns A promise containing the new file contents model.
     */
    overwrite(oldPath: string, newPath: string): Promise<Contents.IModel>;
    /**
     * Rename a file or directory.
     *
     * @param oldPath - The full path to the original file.
     *
     * @param newPath - The full path to the new file.
     *
     * @returns A promise containing the new file contents model.  The promise
     * will reject if the newPath already exists.  Use [[overwrite]] to overwrite
     * a file.
     */
    rename(oldPath: string, newPath: string): Promise<Contents.IModel>;
    /**
     * Find a context for a given path and factory name.
     */
    private _findContext;
    /**
     * Get the contexts for a given path.
     *
     * #### Notes
     * There may be more than one context for a given path if the path is open
     * with multiple model factories (for example, a notebook can be open with a
     * notebook model factory and a text model factory).
     */
    private _contextsForPath;
    /**
     * Create a context from a path and a model factory.
     */
    private _createContext;
    /**
     * Handle a context disposal.
     */
    private _onContextDisposed;
    /**
     * Get the widget factory for a given widget name.
     */
    private _widgetFactoryFor;
    /**
     * Creates a new document, or loads one from disk, depending on the `which` argument.
     * If `which==='create'`, then it creates a new document. If `which==='open'`,
     * then it loads the document from disk.
     *
     * The two cases differ in how the document context is handled, but the creation
     * of the widget and launching of the kernel are identical.
     */
    private _createOrOpenDocument;
    /**
     * Handle an activateRequested signal from the widget manager.
     */
    private _onActivateRequested;
    private _activateRequested;
    private _contexts;
    private _opener;
    private _widgetManager;
    private _isDisposed;
    private _autosave;
    private _when;
    private _setBusy;
}
/**
 * A namespace for document manager statics.
 */
export declare namespace DocumentManager {
    /**
     * The options used to initialize a document manager.
     */
    interface IOptions {
        /**
         * A document registry instance.
         */
        registry: DocumentRegistry;
        /**
         * A service manager instance.
         */
        manager: ServiceManager.IManager;
        /**
         * A widget opener for sibling widgets.
         */
        opener: IWidgetOpener;
        /**
         * A promise for when to start using the manager.
         */
        when?: Promise<void>;
        /**
         * A function called when a kernel is busy.
         */
        setBusy?: () => IDisposable;
    }
    /**
     * An interface for a widget opener.
     */
    interface IWidgetOpener {
        /**
         * Open the given widget.
         */
        open(widget: IDocumentWidget, options?: DocumentRegistry.IOpenOptions): void;
    }
}
