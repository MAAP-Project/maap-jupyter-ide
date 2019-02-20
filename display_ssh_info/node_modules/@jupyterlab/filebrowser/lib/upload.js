"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
/**
 * A widget which provides an upload button.
 */
class Uploader extends apputils_1.ToolbarButton {
    /**
     * Construct a new file browser buttons widget.
     */
    constructor(options) {
        super({
            iconClassName: 'jp-FileUploadIcon jp-Icon jp-Icon-16',
            onClick: () => {
                this._input.click();
            },
            tooltip: 'Upload Files'
        });
        /**
         * The 'change' handler for the input field.
         */
        this._onInputChanged = () => {
            let files = Array.prototype.slice.call(this._input.files);
            let pending = files.map(file => this.fileBrowserModel.upload(file));
            Promise.all(pending).catch(error => {
                apputils_1.showErrorMessage('Upload Error', error);
            });
        };
        /**
         * The 'click' handler for the input field.
         */
        this._onInputClicked = () => {
            // In order to allow repeated uploads of the same file (with delete in between),
            // we need to clear the input value to trigger a change event.
            this._input.value = '';
        };
        this._input = Private.createUploadInput();
        this.fileBrowserModel = options.model;
        this._input.onclick = this._onInputClicked;
        this._input.onchange = this._onInputChanged;
        this.addClass('jp-id-upload');
    }
}
exports.Uploader = Uploader;
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * Create the upload input node for a file buttons widget.
     */
    function createUploadInput() {
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        return input;
    }
    Private.createUploadInput = createUploadInput;
})(Private || (Private = {}));
