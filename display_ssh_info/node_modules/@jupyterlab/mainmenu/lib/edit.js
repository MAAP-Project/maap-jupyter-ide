"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Edit menu for the application.
 */
class EditMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the edit menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Edit';
        this.undoers = new Set();
        this.clearers = new Set();
        this.findReplacers = new Set();
        this.goToLiners = new Set();
    }
    /**
     * Dispose of the resources held by the edit menu.
     */
    dispose() {
        this.undoers.clear();
        this.clearers.clear();
        this.findReplacers.clear();
        super.dispose();
    }
}
exports.EditMenu = EditMenu;
