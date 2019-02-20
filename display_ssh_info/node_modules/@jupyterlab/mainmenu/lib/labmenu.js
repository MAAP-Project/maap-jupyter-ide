"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const disposable_1 = require("@phosphor/disposable");
const widgets_1 = require("@phosphor/widgets");
/**
 * An extensible menu for JupyterLab application menus.
 */
class JupyterLabMenu {
    /**
     * Construct a new menu.
     *
     * @param options - Options for the phosphor menu.
     *
     * @param includeSeparators - whether to include separators between the
     *   groups that are added to the menu.
     */
    constructor(options, includeSeparators = true) {
        this._groups = [];
        this._isDisposed = false;
        this.menu = new widgets_1.Menu(options);
        this._includeSeparators = includeSeparators;
    }
    /**
     * Add a group of menu items specific to a particular
     * plugin.
     *
     * @param items - the list of menu items to add.
     *
     * @param rank - the rank in the menu in which to insert the group.
     */
    addGroup(items, rank) {
        const rankGroup = {
            size: items.length,
            rank: rank === undefined ? 100 : rank
        };
        // Insert the plugin group into the list of groups.
        const groupIndex = algorithm_1.ArrayExt.upperBound(this._groups, rankGroup, Private.itemCmp);
        // Determine the index of the menu at which to insert the group.
        let insertIndex = 0;
        for (let i = 0; i < groupIndex; ++i) {
            if (this._groups[i].size > 0) {
                insertIndex += this._groups[i].size;
                // Increase the insert index by two extra in order
                // to include the leading and trailing separators.
                insertIndex += this._includeSeparators ? 2 : 0;
            }
        }
        // Keep an array of the menu items that have been created.
        const added = [];
        // Insert a separator before the group.
        // Phosphor takes care of superfluous leading,
        // trailing, and duplicate separators.
        if (this._includeSeparators) {
            added.push(this.menu.insertItem(insertIndex++, { type: 'separator' }));
        }
        // Insert the group.
        for (let item of items) {
            added.push(this.menu.insertItem(insertIndex++, item));
        }
        // Insert a separator after the group.
        if (this._includeSeparators) {
            added.push(this.menu.insertItem(insertIndex++, { type: 'separator' }));
        }
        algorithm_1.ArrayExt.insert(this._groups, groupIndex, rankGroup);
        return new disposable_1.DisposableDelegate(() => {
            added.forEach(i => this.menu.removeItem(i));
            this._groups.splice(groupIndex, 1);
        });
    }
    /**
     * Whether the menu has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the menu.
     */
    dispose() {
        this._groups.length = 0;
        this._isDisposed = true;
        this.menu.dispose();
    }
}
exports.JupyterLabMenu = JupyterLabMenu;
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
