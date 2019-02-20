"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@jupyterlab/coreutils");
const docmanager_1 = require("@jupyterlab/docmanager");
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_2 = require("@phosphor/coreutils");
const signaling_1 = require("@phosphor/signaling");
const apputils_1 = require("@jupyterlab/apputils");
/**
 * The default duration of the auto-refresh in ms
 */
const DEFAULT_REFRESH_INTERVAL = 10000;
/**
 * The enforced time between refreshes in ms.
 */
const MIN_REFRESH = 1000;
/**
 * The maximum upload size (in bytes) for notebook version < 5.1.0
 */
exports.LARGE_FILE_SIZE = 15 * 1024 * 1024;
/**
 * The size (in bytes) of the biggest chunk we should upload at once.
 */
exports.CHUNK_SIZE = 1024 * 1024;
/**
 * An implementation of a file browser model.
 *
 * #### Notes
 * All paths parameters without a leading `'/'` are interpreted as relative to
 * the current directory.  Supports `'../'` syntax.
 */
class FileBrowserModel {
    /**
     * Construct a new file browser model.
     */
    constructor(options) {
        this._connectionFailure = new signaling_1.Signal(this);
        this._fileChanged = new signaling_1.Signal(this);
        this._items = [];
        this._key = '';
        this._pathChanged = new signaling_1.Signal(this);
        this._paths = new Set();
        this._pending = null;
        this._pendingPath = null;
        this._refreshed = new signaling_1.Signal(this);
        this._lastRefresh = -1;
        this._requested = false;
        this._sessions = [];
        this._state = null;
        this._timeoutId = -1;
        this._isDisposed = false;
        this._restored = new coreutils_2.PromiseDelegate();
        this._uploads = [];
        this._uploadChanged = new signaling_1.Signal(this);
        this.manager = options.manager;
        this._driveName = options.driveName || '';
        let rootPath = this._driveName ? this._driveName + ':' : '';
        this._model = {
            path: rootPath,
            name: coreutils_1.PathExt.basename(rootPath),
            type: 'directory',
            content: undefined,
            writable: false,
            created: 'unknown',
            last_modified: 'unknown',
            mimetype: 'text/plain',
            format: 'text'
        };
        this._state = options.state || null;
        this._baseRefreshDuration =
            options.refreshInterval || DEFAULT_REFRESH_INTERVAL;
        const { services } = options.manager;
        services.contents.fileChanged.connect(this._onFileChanged, this);
        services.sessions.runningChanged.connect(this._onRunningChanged, this);
        this._unloadEventListener = (e) => {
            if (this._uploads.length > 0) {
                const confirmationMessage = 'Files still uploading';
                e.returnValue = confirmationMessage;
                return confirmationMessage;
            }
        };
        window.addEventListener('beforeunload', this._unloadEventListener);
        this._scheduleUpdate();
        this._startTimer();
    }
    /**
     * A signal emitted when the file browser model loses connection.
     */
    get connectionFailure() {
        return this._connectionFailure;
    }
    /**
     * The drive name that gets prepended to the path.
     */
    get driveName() {
        return this._driveName;
    }
    /**
     * A promise that resolves when the model is first restored.
     */
    get restored() {
        return this._restored.promise;
    }
    /**
     * Get the file path changed signal.
     */
    get fileChanged() {
        return this._fileChanged;
    }
    /**
     * Get the current path.
     */
    get path() {
        return this._model ? this._model.path : '';
    }
    /**
     * A signal emitted when the path changes.
     */
    get pathChanged() {
        return this._pathChanged;
    }
    /**
     * A signal emitted when the directory listing is refreshed.
     */
    get refreshed() {
        return this._refreshed;
    }
    /**
     * Get the kernel spec models.
     */
    get specs() {
        return this.manager.services.sessions.specs;
    }
    /**
     * Get whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * A signal emitted when an upload progresses.
     */
    get uploadChanged() {
        return this._uploadChanged;
    }
    /**
     * Create an iterator over the status of all in progress uploads.
     */
    uploads() {
        return new algorithm_1.ArrayIterator(this._uploads);
    }
    /**
     * Dispose of the resources held by the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        window.removeEventListener('beforeunload', this._unloadEventListener);
        this._isDisposed = true;
        clearTimeout(this._timeoutId);
        this._sessions.length = 0;
        this._items.length = 0;
        signaling_1.Signal.clearData(this);
    }
    /**
     * Create an iterator over the model's items.
     *
     * @returns A new iterator over the model's items.
     */
    items() {
        return new algorithm_1.ArrayIterator(this._items);
    }
    /**
     * Create an iterator over the active sessions in the directory.
     *
     * @returns A new iterator over the model's active sessions.
     */
    sessions() {
        return new algorithm_1.ArrayIterator(this._sessions);
    }
    /**
     * Force a refresh of the directory contents.
     */
    refresh() {
        this._lastRefresh = new Date().getTime();
        this._requested = false;
        return this.cd('.');
    }
    /**
     * Change directory.
     *
     * @param path - The path to the file or directory.
     *
     * @returns A promise with the contents of the directory.
     */
    cd(newValue = '.') {
        return __awaiter(this, void 0, void 0, function* () {
            if (newValue !== '.') {
                newValue = Private.normalizePath(this.manager.services.contents, this._model.path, newValue);
            }
            else {
                newValue = this._pendingPath || this._model.path;
            }
            if (this._pending) {
                // Collapse requests to the same directory.
                if (newValue === this._pendingPath) {
                    return this._pending;
                }
                // Otherwise wait for the pending request to complete before continuing.
                yield this._pending;
            }
            let oldValue = this.path;
            let options = { content: true };
            this._pendingPath = newValue;
            if (oldValue !== newValue) {
                this._sessions.length = 0;
            }
            let services = this.manager.services;
            this._pending = services.contents
                .get(newValue, options)
                .then(contents => {
                if (this.isDisposed) {
                    return;
                }
                this._refreshDuration = this._baseRefreshDuration;
                this._handleContents(contents);
                this._pendingPath = null;
                if (oldValue !== newValue) {
                    // If there is a state database and a unique key, save the new path.
                    if (this._state && this._key) {
                        this._state.save(this._key, { path: newValue });
                    }
                    this._pathChanged.emit({
                        name: 'path',
                        oldValue,
                        newValue
                    });
                }
                this._onRunningChanged(services.sessions, services.sessions.running());
                this._refreshed.emit(void 0);
            })
                .catch(error => {
                this._pendingPath = null;
                if (error.message === 'Not Found') {
                    error.message = `Directory not found: "${this._model.path}"`;
                    console.error(error);
                    this._connectionFailure.emit(error);
                    return this.cd('/');
                }
                else {
                    this._refreshDuration = this._baseRefreshDuration * 10;
                    this._connectionFailure.emit(error);
                }
            });
            return this._pending;
        });
    }
    /**
     * Download a file.
     *
     * @param path - The path of the file to be downloaded.
     *
     * @returns A promise which resolves when the file has begun
     *   downloading.
     */
    download(path) {
        return this.manager.services.contents.getDownloadUrl(path).then(url => {
            let element = document.createElement('a');
            document.body.appendChild(element);
            element.setAttribute('href', url);
            element.setAttribute('download', '');
            element.click();
            document.body.removeChild(element);
            return void 0;
        });
    }
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
    restore(id) {
        const state = this._state;
        const restored = !!this._key;
        if (!state || restored) {
            return Promise.resolve(void 0);
        }
        const manager = this.manager;
        const key = `file-browser-${id}:cwd`;
        const ready = manager.services.ready;
        return Promise.all([state.fetch(key), ready])
            .then(([cwd]) => {
            if (!cwd) {
                this._restored.resolve(void 0);
                return;
            }
            const path = cwd['path'];
            const localPath = manager.services.contents.localPath(path);
            return manager.services.contents
                .get(path)
                .then(() => this.cd(localPath))
                .catch(() => state.remove(key));
        })
            .catch(() => state.remove(key))
            .then(() => {
            this._key = key;
            this._restored.resolve(void 0);
        }); // Set key after restoration is done.
    }
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
    upload(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const supportsChunked = coreutils_1.PageConfig.getNotebookVersion() >= [5, 1, 0];
            const largeFile = file.size > exports.LARGE_FILE_SIZE;
            if (largeFile && !supportsChunked) {
                let msg = `Cannot upload file (>${exports.LARGE_FILE_SIZE / (1024 * 1024)} MB). ${file.name}`;
                console.warn(msg);
                throw msg;
            }
            const err = 'File not uploaded';
            if (largeFile && !(yield this._shouldUploadLarge(file))) {
                throw 'Cancelled large file upload';
            }
            yield this._uploadCheckDisposed();
            yield this.refresh();
            yield this._uploadCheckDisposed();
            if (algorithm_1.find(this._items, i => i.name === file.name) &&
                !(yield docmanager_1.shouldOverwrite(file.name))) {
                throw err;
            }
            yield this._uploadCheckDisposed();
            const chunkedUpload = supportsChunked && file.size > exports.CHUNK_SIZE;
            return yield this._upload(file, chunkedUpload);
        });
    }
    _shouldUploadLarge(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const { button } = yield apputils_1.showDialog({
                title: 'Large file size warning',
                body: `The file size is ${Math.round(file.size / (1024 * 1024))} MB. Do you still want to upload it?`,
                buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.warnButton({ label: 'UPLOAD' })]
            });
            return button.accept;
        });
    }
    /**
     * Perform the actual upload.
     */
    _upload(file, chunked) {
        return __awaiter(this, void 0, void 0, function* () {
            // Gather the file model parameters.
            let path = this._model.path;
            path = path ? path + '/' + file.name : file.name;
            let name = file.name;
            let type = 'file';
            let format = 'base64';
            const uploadInner = (blob, chunk) => __awaiter(this, void 0, void 0, function* () {
                yield this._uploadCheckDisposed();
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                yield new Promise((resolve, reject) => {
                    reader.onload = resolve;
                    reader.onerror = event => reject(`Failed to upload "${file.name}":` + event);
                });
                yield this._uploadCheckDisposed();
                // remove header https://stackoverflow.com/a/24289420/907060
                const content = reader.result.split(',')[1];
                let model = {
                    type,
                    format,
                    name,
                    chunk,
                    content
                };
                return yield this.manager.services.contents.save(path, model);
            });
            if (!chunked) {
                try {
                    return yield uploadInner(file);
                }
                catch (err) {
                    algorithm_1.ArrayExt.removeFirstWhere(this._uploads, uploadIndex => {
                        return file.name === uploadIndex.path;
                    });
                    throw err;
                }
            }
            let finalModel;
            let upload = { path, progress: 0 };
            this._uploadChanged.emit({
                name: 'start',
                newValue: upload,
                oldValue: null
            });
            for (let start = 0; !finalModel; start += exports.CHUNK_SIZE) {
                const end = start + exports.CHUNK_SIZE;
                const lastChunk = end >= file.size;
                const chunk = lastChunk ? -1 : end / exports.CHUNK_SIZE;
                const newUpload = { path, progress: start / file.size };
                this._uploads.splice(this._uploads.indexOf(upload));
                this._uploads.push(newUpload);
                this._uploadChanged.emit({
                    name: 'update',
                    newValue: newUpload,
                    oldValue: upload
                });
                upload = newUpload;
                let currentModel;
                try {
                    currentModel = yield uploadInner(file.slice(start, end), chunk);
                }
                catch (err) {
                    algorithm_1.ArrayExt.removeFirstWhere(this._uploads, uploadIndex => {
                        return file.name === uploadIndex.path;
                    });
                    this._uploadChanged.emit({
                        name: 'failure',
                        newValue: upload,
                        oldValue: null
                    });
                    throw err;
                }
                if (lastChunk) {
                    finalModel = currentModel;
                }
            }
            this._uploads.splice(this._uploads.indexOf(upload));
            this._uploadChanged.emit({
                name: 'finish',
                newValue: null,
                oldValue: upload
            });
            return finalModel;
        });
    }
    _uploadCheckDisposed() {
        if (this.isDisposed) {
            return Promise.reject('Filemanager disposed. File upload canceled');
        }
        return Promise.resolve();
    }
    /**
     * Handle an updated contents model.
     */
    _handleContents(contents) {
        // Update our internal data.
        this._model = {
            name: contents.name,
            path: contents.path,
            type: contents.type,
            content: undefined,
            writable: contents.writable,
            created: contents.created,
            last_modified: contents.last_modified,
            mimetype: contents.mimetype,
            format: contents.format
        };
        this._items = contents.content;
        this._paths.clear();
        contents.content.forEach((model) => {
            this._paths.add(model.path);
        });
    }
    /**
     * Handle a change to the running sessions.
     */
    _onRunningChanged(sender, models) {
        this._populateSessions(models);
        this._refreshed.emit(void 0);
    }
    /**
     * Handle a change on the contents manager.
     */
    _onFileChanged(sender, change) {
        let path = this._model.path;
        let { sessions } = this.manager.services;
        let { oldValue, newValue } = change;
        let value = oldValue && oldValue.path && coreutils_1.PathExt.dirname(oldValue.path) === path
            ? oldValue
            : newValue && newValue.path && coreutils_1.PathExt.dirname(newValue.path) === path
                ? newValue
                : undefined;
        // If either the old value or the new value is in the current path, update.
        if (value) {
            this._scheduleUpdate();
            this._populateSessions(sessions.running());
            this._fileChanged.emit(change);
            return;
        }
    }
    /**
     * Populate the model's sessions collection.
     */
    _populateSessions(models) {
        this._sessions.length = 0;
        algorithm_1.each(models, model => {
            if (this._paths.has(model.path)) {
                this._sessions.push(model);
            }
        });
    }
    /**
     * Start the internal refresh timer.
     */
    _startTimer() {
        this._timeoutId = window.setInterval(() => {
            if (this._requested) {
                this.refresh();
                return;
            }
            if (document.hidden) {
                // Don't poll when nobody's looking.
                return;
            }
            let date = new Date().getTime();
            if (date - this._lastRefresh > this._refreshDuration) {
                this.refresh();
            }
        }, MIN_REFRESH);
    }
    /**
     * Handle internal model refresh logic.
     */
    _scheduleUpdate() {
        let date = new Date().getTime();
        if (date - this._lastRefresh > MIN_REFRESH) {
            this.refresh();
        }
        else {
            this._requested = true;
        }
    }
}
exports.FileBrowserModel = FileBrowserModel;
/**
 * The namespace for the file browser model private data.
 */
var Private;
(function (Private) {
    /**
     * Normalize a path based on a root directory, accounting for relative paths.
     */
    function normalizePath(contents, root, path) {
        const driveName = contents.driveName(root);
        const localPath = contents.localPath(root);
        const resolved = coreutils_1.PathExt.resolve(localPath, path);
        return driveName ? `${driveName}:${resolved}` : resolved;
    }
    Private.normalizePath = normalizePath;
})(Private || (Private = {}));
