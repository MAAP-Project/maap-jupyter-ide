"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Settings menu for the application.
 */
class SettingsMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the settings menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Settings';
    }
}
exports.SettingsMenu = SettingsMenu;
