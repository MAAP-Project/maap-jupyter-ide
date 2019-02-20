import { ToolbarButton } from '@jupyterlab/apputils';
import { FileBrowserModel } from './model';
/**
 * A widget which provides an upload button.
 */
export declare class Uploader extends ToolbarButton {
    /**
     * Construct a new file browser buttons widget.
     */
    constructor(options: Uploader.IOptions);
    /**
     * The underlying file browser fileBrowserModel for the widget.
     *
     * This cannot be named model as that conflicts with the model property of VDomRenderer.
     */
    readonly fileBrowserModel: FileBrowserModel;
    /**
     * The 'change' handler for the input field.
     */
    private _onInputChanged;
    /**
     * The 'click' handler for the input field.
     */
    private _onInputClicked;
    private _input;
}
/**
 * The namespace for Uploader class statics.
 */
export declare namespace Uploader {
    /**
     * The options used to create an uploader.
     */
    interface IOptions {
        /**
         * A file browser fileBrowserModel instance.
         */
        model: FileBrowserModel;
    }
}
