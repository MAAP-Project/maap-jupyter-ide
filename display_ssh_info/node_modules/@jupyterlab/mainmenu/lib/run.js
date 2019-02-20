"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Run menu for the application.
 */
class RunMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the run menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Run';
        this.codeRunners = new Set();
    }
    /**
     * Dispose of the resources held by the run menu.
     */
    dispose() {
        this.codeRunners.clear();
        super.dispose();
    }
}
exports.RunMenu = RunMenu;
