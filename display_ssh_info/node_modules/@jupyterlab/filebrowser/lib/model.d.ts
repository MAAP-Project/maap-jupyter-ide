import { IChangedArgs, IStateDB } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Contents, Kernel, Session } from '@jupyterlab/services';
import { IIterator } from '@phosphor/algorithm';
import { IDisposable } from '@phosphor/disposable';
import { ISignal } from '@phosphor/signaling';
/**
 * The maximum upload size (in bytes) for notebook version < 5.1.0
 */
export declare const LARGE_FILE_SIZE: number;
/**
 * The size (in bytes) of the biggest chunk we should upload at once.
 */
export declare const CHUNK_SIZE: number;
/**
 * An upload progress event for a file at `path`.
 */
export interface IUploadModel {
    path: string;
    /**
     * % uploaded [0, 1)
     */
    progress: number;
}
/**
 * An implementation of a file browser model.
 *
 * #### Notes
 * All paths parameters without a leading `'/'` are interpreted as relative to
 * the current directory.  Supports `'../'` syntax.
 */
export declare class FileBrowserModel implements IDisposable {
    /**
     * Construct a new file browser model.
     */
    constructor(options: FileBrowserModel.IOptions);
    /**
     * The document manager instance used by the file browser model.
     */
    readonly manager: IDocumentManager;
    /**
     * A signal emitted when the file browser model loses connection.
     */
    readonly connectionFailure: ISignal<this, Error>;
    /**
     * The drive name that gets prepended to the path.
     */
    readonly driveName: string;
    /**
     * A promise that resolves when the model is first restored.
     */
    readonly restored: Promise<void>;
    /**
     * Get the file path changed signal.
     */
    readonly fileChanged: ISignal<this, Contents.IChangedArgs>;
    /**
     * Get the current path.
     */
    readonly path: string;
    /**
     * A signal emitted when the path changes.
     */
    readonly pathChanged: ISignal<this, IChangedArgs<string>>;
    /**
     * A signal emitted when the directory listing is refreshed.
     */
    readonly refreshed: ISignal<this, void>;
    /**
     * Get the kernel spec models.
     */
    readonly specs: Kernel.ISpecModels | null;
    /**
     * Get whether the model is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * A signal emitted when an upload progresses.
     */
    readonly uploadChanged: ISignal<this, IChangedArgs<IUploadModel>>;
    /**
     * Create an iterator over the status of all in progress uploads.
     */
    uploads(): IIterator<IUploadModel>;
    /**
     * Dispose of the resources held by the model.
     */
    dispose(): void;
    /**
     * Create an iterator over the model's items.
     *
     * @returns A new iterator over the model's items.
     */
    items(): IIterator<Contents.IModel>;
    /**
     * Create an iterator over the active sessions in the directory.
     *
     * @returns A new iterator over the model's active sessions.
     */
    sessions(): IIterator<Session.IModel>;
    /**
     * Force a refresh of the directory contents.
     */
    refresh(): Promise<void>;
    /**
     * Change directory.
     *
     * @param path - The path to the file or directory.
     *
     * @returns A promise with the contents of the directory.
     */
    cd(newValue?: string): Promise<void>;
    /**
     * Download a file.
     *
     * @param path - The path of the file to be downloaded.
     *
     * @returns A promise which resolves when the file has begun
     *   downloading.
     */
    download(path: string): Promise<void>;
    /**
     * Restore the state of the file browser.
     *
     * @param id - The unique ID that is used to construct a state database key.
     *
     * @returns A promise when restoration is complete.
     *
     * #### Notes
     * This function will only restore the model *once*. If it is called multiple
     * times, all subsequent invocations are no-ops.
     */
    restore(id: string): Promise<void>;
    /**
     * Upload a `File` object.
     *
     * @param file - The `File` object to upload.
     *
     * @returns A promise containing the new file contents model.
     *
     * #### Notes
     * On Notebook version < 5.1.0, this will fail to upload files that are too
     * big to be sent in one request to the server. On newer versions, it will
     * ask for confirmation then upload the file in 1 MB chunks.
     */
    upload(file: File): Promise<Contents.IModel>;
    private _shouldUploadLarge;
    /**
     * Perform the actual upload.
     */
    private _upload;
    private _uploadCheckDisposed;
    /**
     * Handle an updated contents model.
     */
    private _handleContents;
    /**
     * Handle a change to the running sessions.
     */
    private _onRunningChanged;
    /**
     * Handle a change on the contents manager.
     */
    private _onFileChanged;
    /**
     * Populate the model's sessions collection.
     */
    private _populateSessions;
    /**
     * Start the internal refresh timer.
     */
    private _startTimer;
    /**
     * Handle internal model refresh logic.
     */
    private _scheduleUpdate;
    private _connectionFailure;
    private _fileChanged;
    private _items;
    private _key;
    private _model;
    private _pathChanged;
    private _paths;
    private _pending;
    private _pendingPath;
    private _refreshed;
    private _lastRefresh;
    private _requested;
    private _sessions;
    private _state;
    private _timeoutId;
    private _refreshDuration;
    private _baseRefreshDuration;
    private _driveName;
    private _isDisposed;
    private _restored;
    private _uploads;
    private _uploadChanged;
    private _unloadEventListener;
}
/**
 * The namespace for the `FileBrowserModel` class statics.
 */
export declare namespace FileBrowserModel {
    /**
     * An options object for initializing a file browser.
     */
    interface IOptions {
        /**
         * A document manager instance.
         */
        manager: IDocumentManager;
        /**
         * An optional `Contents.IDrive` name for the model.
         * If given, the model will prepend `driveName:` to
         * all paths used in file operations.
         */
        driveName?: string;
        /**
         * An optional state database. If provided, the model will restore which
         * folder was last opened when it is restored.
         */
        state?: IStateDB;
        /**
         * The time interval for browser refreshing, in ms.
         */
        refreshInterval?: number;
    }
}
