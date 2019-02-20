"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const widgets_1 = require("@phosphor/widgets");
const file_1 = require("./file");
const edit_1 = require("./edit");
const help_1 = require("./help");
const kernel_1 = require("./kernel");
const run_1 = require("./run");
const settings_1 = require("./settings");
const view_1 = require("./view");
const tabs_1 = require("./tabs");
/* tslint:disable */
/**
 * The main menu token.
 */
exports.IMainMenu = new coreutils_1.Token('@jupyterlab/mainmenu:IMainMenu');
/**
 * The main menu class.  It is intended to be used as a singleton.
 */
class MainMenu extends widgets_1.MenuBar {
    /**
     * Construct the main menu bar.
     */
    constructor(commands) {
        super();
        this._items = [];
        this.editMenu = new edit_1.EditMenu({ commands });
        this.fileMenu = new file_1.FileMenu({ commands });
        this.helpMenu = new help_1.HelpMenu({ commands });
        this.kernelMenu = new kernel_1.KernelMenu({ commands });
        this.runMenu = new run_1.RunMenu({ commands });
        this.settingsMenu = new settings_1.SettingsMenu({ commands });
        this.viewMenu = new view_1.ViewMenu({ commands });
        this.tabsMenu = new tabs_1.TabsMenu({ commands });
        this.addMenu(this.fileMenu.menu, { rank: 0 });
        this.addMenu(this.editMenu.menu, { rank: 1 });
        this.addMenu(this.viewMenu.menu, { rank: 2 });
        this.addMenu(this.runMenu.menu, { rank: 3 });
        this.addMenu(this.kernelMenu.menu, { rank: 4 });
        this.addMenu(this.tabsMenu.menu, { rank: 500 });
        this.addMenu(this.settingsMenu.menu, { rank: 999 });
        this.addMenu(this.helpMenu.menu, { rank: 1000 });
    }
    /**
     * Add a new menu to the main menu bar.
     */
    addMenu(menu, options = {}) {
        if (algorithm_1.ArrayExt.firstIndexOf(this.menus, menu) > -1) {
            return;
        }
        let rank = 'rank' in options ? options.rank : 100;
        let rankItem = { menu, rank };
        let index = algorithm_1.ArrayExt.upperBound(this._items, rankItem, Private.itemCmp);
        // Upon disposal, remove the menu and its rank reference.
        menu.disposed.connect(this._onMenuDisposed, this);
        algorithm_1.ArrayExt.insert(this._items, index, rankItem);
        /**
         * Create a new menu.
         */
        this.insertMenu(index, menu);
    }
    /**
     * Dispose of the resources held by the menu bar.
     */
    dispose() {
        this.editMenu.dispose();
        this.fileMenu.dispose();
        this.helpMenu.dispose();
        this.kernelMenu.dispose();
        this.runMenu.dispose();
        this.settingsMenu.dispose();
        this.viewMenu.dispose();
        this.tabsMenu.dispose();
        super.dispose();
    }
    /**
     * Handle the disposal of a menu.
     */
    _onMenuDisposed(menu) {
        this.removeMenu(menu);
        let index = algorithm_1.ArrayExt.findFirstIndex(this._items, item => item.menu === menu);
        if (index !== -1) {
            algorithm_1.ArrayExt.removeAt(this._items, index);
        }
    }
}
exports.MainMenu = MainMenu;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * A comparator function for menu rank items.
     */
    function itemCmp(first, second) {
        return first.rank - second.rank;
    }
    Private.itemCmp = itemCmp;
})(Private || (Private = {}));
