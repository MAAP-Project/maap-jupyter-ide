"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Help menu for the application.
 */
class HelpMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the help menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Help';
        this.kernelUsers = new Set();
    }
}
exports.HelpMenu = HelpMenu;
