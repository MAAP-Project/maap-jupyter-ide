"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Tabs menu for the application.
 */
class TabsMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the tabs menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Tabs';
    }
}
exports.TabsMenu = TabsMenu;
