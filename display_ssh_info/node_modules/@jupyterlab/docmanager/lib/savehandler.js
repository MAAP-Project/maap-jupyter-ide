"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const signaling_1 = require("@phosphor/signaling");
/**
 * A class that manages the auto saving of a document.
 *
 * #### Notes
 * Implements https://github.com/ipython/ipython/wiki/IPEP-15:-Autosaving-the-IPython-Notebook.
 */
class SaveHandler {
    /**
     * Construct a new save handler.
     */
    constructor(options) {
        this._autosaveTimer = -1;
        this._minInterval = -1;
        this._interval = -1;
        this._isActive = false;
        this._inDialog = false;
        this._isDisposed = false;
        this._multiplier = 10;
        this._context = options.context;
        let interval = options.saveInterval || 120;
        this._minInterval = interval * 1000;
        this._interval = this._minInterval;
        // Restart the timer when the contents model is updated.
        this._context.fileChanged.connect(this._setTimer, this);
        this._context.disposed.connect(this.dispose, this);
    }
    /**
     * The save interval used by the timer (in seconds).
     */
    get saveInterval() {
        return this._interval / 1000;
    }
    set saveInterval(value) {
        this._minInterval = this._interval = value * 1000;
        if (this._isActive) {
            this._setTimer();
        }
    }
    /**
     * Get whether the handler is active.
     */
    get isActive() {
        return this._isActive;
    }
    /**
     * Get whether the save handler is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the save handler.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        clearTimeout(this._autosaveTimer);
        signaling_1.Signal.clearData(this);
    }
    /**
     * Start the autosaver.
     */
    start() {
        this._isActive = true;
        this._setTimer();
    }
    /**
     * Stop the autosaver.
     */
    stop() {
        this._isActive = false;
        clearTimeout(this._autosaveTimer);
    }
    /**
     * Set the timer.
     */
    _setTimer() {
        clearTimeout(this._autosaveTimer);
        if (!this._isActive) {
            return;
        }
        this._autosaveTimer = window.setTimeout(() => {
            this._save();
        }, this._interval);
    }
    /**
     * Handle an autosave timeout.
     */
    _save() {
        let context = this._context;
        // Trigger the next update.
        this._setTimer();
        if (!context) {
            return;
        }
        // Bail if the model is not dirty or the file is not writable, or the dialog
        // is already showing.
        let writable = context.contentsModel && context.contentsModel.writable;
        if (!writable || !context.model.dirty || this._inDialog) {
            return;
        }
        let start = new Date().getTime();
        context
            .save()
            .then(() => {
            if (this.isDisposed) {
                return;
            }
            let duration = new Date().getTime() - start;
            // New save interval: higher of 10x save duration or min interval.
            this._interval = Math.max(this._multiplier * duration, this._minInterval);
            // Restart the update to pick up the new interval.
            this._setTimer();
        })
            .catch(err => {
            // If the user canceled the save, do nothing.
            if (err.message === 'Cancel') {
                return;
            }
            // Otherwise, log the error.
            console.error('Error in Auto-Save', err.message);
        });
    }
}
exports.SaveHandler = SaveHandler;
