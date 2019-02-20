"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const labmenu_1 = require("./labmenu");
/**
 * An extensible Kernel menu for the application.
 */
class KernelMenu extends labmenu_1.JupyterLabMenu {
    /**
     * Construct the kernel menu.
     */
    constructor(options) {
        super(options);
        this.menu.title.label = 'Kernel';
        this.kernelUsers = new Set();
    }
    /**
     * Dispose of the resources held by the kernel menu.
     */
    dispose() {
        this.kernelUsers.clear();
        super.dispose();
    }
}
exports.KernelMenu = KernelMenu;
