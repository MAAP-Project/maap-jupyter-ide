"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible FileMenu for the application.
 */
class FileMenu extends labmenu_1.JupyterLabMenu {
    constructor(options) {
        super(options);
        this.menu.title.label = 'File';
        this.quitEntry = false;
        // Create the "New" submenu.
        this.newMenu = new labmenu_1.JupyterLabMenu(options, false);
        this.newMenu.menu.title.label = 'New';
        this.closeAndCleaners = new Set();
        this.persistAndSavers = new Set();
        this.consoleCreators = new Set();
    }
    /**
     * Dispose of the resources held by the file menu.
     */
    dispose() {
        this.newMenu.dispose();
        this.consoleCreators.clear();
        super.dispose();
    }
}
exports.FileMenu = FileMenu;
