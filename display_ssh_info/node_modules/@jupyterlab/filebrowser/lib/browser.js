"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const services_1 = require("@jupyterlab/services");
const widgets_1 = require("@phosphor/widgets");
const crumbs_1 = require("./crumbs");
const listing_1 = require("./listing");
const upload_1 = require("./upload");
/**
 * The class name added to file browsers.
 */
const FILE_BROWSER_CLASS = 'jp-FileBrowser';
/**
 * The class name added to the filebrowser crumbs node.
 */
const CRUMBS_CLASS = 'jp-FileBrowser-crumbs';
/**
 * The class name added to the filebrowser toolbar node.
 */
const TOOLBAR_CLASS = 'jp-FileBrowser-toolbar';
/**
 * The class name added to the filebrowser listing node.
 */
const LISTING_CLASS = 'jp-FileBrowser-listing';
/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retrieve contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
class FileBrowser extends widgets_1.Widget {
    /**
     * Construct a new file browser.
     *
     * @param model - The file browser view model.
     */
    constructor(options) {
        super();
        this._showingError = false;
        this.addClass(FILE_BROWSER_CLASS);
        this.id = options.id;
        const model = (this.model = options.model);
        const renderer = options.renderer;
        model.connectionFailure.connect(this._onConnectionFailure, this);
        this._manager = model.manager;
        this._crumbs = new crumbs_1.BreadCrumbs({ model });
        this.toolbar = new apputils_1.Toolbar();
        let directoryPending = false;
        let newFolder = new apputils_1.ToolbarButton({
            iconClassName: 'jp-NewFolderIcon jp-Icon jp-Icon-16',
            onClick: () => {
                if (directoryPending === true) {
                    return;
                }
                directoryPending = true;
                this._manager
                    .newUntitled({
                    path: model.path,
                    type: 'directory'
                })
                    .then(model => {
                    this._listing.selectItemByName(model.name);
                    directoryPending = false;
                })
                    .catch(err => {
                    directoryPending = false;
                });
            },
            tooltip: 'New Folder'
        });
        let uploader = new upload_1.Uploader({ model });
        let refresher = new apputils_1.ToolbarButton({
            iconClassName: 'jp-RefreshIcon jp-Icon jp-Icon-16',
            onClick: () => {
                model.refresh();
            },
            tooltip: 'Refresh File List'
        });
        this.toolbar.addItem('newFolder', newFolder);
        this.toolbar.addItem('upload', uploader);
        this.toolbar.addItem('refresher', refresher);
        this._listing = new listing_1.DirListing({ model, renderer });
        this._crumbs.addClass(CRUMBS_CLASS);
        this.toolbar.addClass(TOOLBAR_CLASS);
        this._listing.addClass(LISTING_CLASS);
        let layout = new widgets_1.PanelLayout();
        layout.addWidget(this.toolbar);
        layout.addWidget(this._crumbs);
        layout.addWidget(this._listing);
        this.layout = layout;
        model.restore(this.id);
    }
    /**
     * Create an iterator over the listing's selected items.
     *
     * @returns A new iterator over the listing's selected items.
     */
    selectedItems() {
        return this._listing.selectedItems();
    }
    /**
     * Rename the first currently selected item.
     *
     * @returns A promise that resolves with the new name of the item.
     */
    rename() {
        return this._listing.rename();
    }
    /**
     * Cut the selected items.
     */
    cut() {
        this._listing.cut();
    }
    /**
     * Copy the selected items.
     */
    copy() {
        this._listing.copy();
    }
    /**
     * Paste the items from the clipboard.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    paste() {
        return this._listing.paste();
    }
    /**
     * Delete the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    delete() {
        return this._listing.delete();
    }
    /**
     * Duplicate the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    duplicate() {
        return this._listing.duplicate();
    }
    /**
     * Download the currently selected item(s).
     */
    download() {
        this._listing.download();
    }
    /**
     * Shut down kernels on the applicable currently selected items.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    shutdownKernels() {
        return this._listing.shutdownKernels();
    }
    /**
     * Select next item.
     */
    selectNext() {
        this._listing.selectNext();
    }
    /**
     * Select previous item.
     */
    selectPrevious() {
        this._listing.selectPrevious();
    }
    /**
     * Find a model given a click.
     *
     * @param event - The mouse event.
     *
     * @returns The model for the selected file.
     */
    modelForClick(event) {
        return this._listing.modelForClick(event);
    }
    /**
     * Handle a connection lost signal from the model.
     */
    _onConnectionFailure(sender, args) {
        if (this._showingError) {
            return;
        }
        this._showingError = true;
        let title = 'Server Connection Error';
        let networkMsg = 'A connection to the Jupyter server could not be established.\n' +
            'JupyterLab will continue trying to reconnect.\n' +
            'Check your network connection or Jupyter server configuration.\n';
        // Check for a fetch error.
        if (args instanceof services_1.ServerConnection.NetworkError) {
            args.message = networkMsg;
        }
        else if (args instanceof services_1.ServerConnection.ResponseError) {
            if (args.response.status === 404) {
                title = 'Directory not found';
                args.message = `Directory not found: "${this.model.path}"`;
            }
        }
        apputils_1.showErrorMessage(title, args).then(() => {
            this._showingError = false;
        });
    }
}
exports.FileBrowser = FileBrowser;
