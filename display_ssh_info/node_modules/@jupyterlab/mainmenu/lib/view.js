"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible View menu for the application.
 */
class ViewMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the view menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'View';
        this.editorViewers = new Set();
    }
    /**
     * Dispose of the resources held by the view menu.
     */
    dispose() {
        this.editorViewers.clear();
        super.dispose();
    }
}
exports.ViewMenu = ViewMenu;
