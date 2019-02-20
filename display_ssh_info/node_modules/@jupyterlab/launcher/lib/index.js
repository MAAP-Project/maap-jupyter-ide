"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const disposable_1 = require("@phosphor/disposable");
const properties_1 = require("@phosphor/properties");
const widgets_1 = require("@phosphor/widgets");
const React = __importStar(require("react"));
require("../style/index.css");
/**
 * The class name added to Launcher instances.
 */
const LAUNCHER_CLASS = 'jp-Launcher';
/**
 * The known categories of launcher items and their default ordering.
 */
const KNOWN_CATEGORIES = ['Notebook', 'Console', 'Other'];
/**
 * These launcher item categories are known to have kernels, so the kernel icons
 * are used.
 */
const KERNEL_CATEGORIES = ['Notebook', 'Console'];
/* tslint:disable */
/**
 * The launcher token.
 */
exports.ILauncher = new coreutils_1.Token('@jupyterlab/launcher:ILauncher');
/**
 * LauncherModel keeps track of the path to working directory and has a list of
 * LauncherItems, which the Launcher will render.
 */
class LauncherModel extends apputils_1.VDomModel {
    /**
     * Create a new launcher model.
     */
    constructor() {
        super();
        this._items = [];
    }
    /**
     * Add a command item to the launcher, and trigger re-render event for parent
     * widget.
     *
     * @param options - The specification options for a launcher item.
     *
     * @returns A disposable that will remove the item from Launcher, and trigger
     * re-render event for parent widget.
     *
     */
    add(options) {
        // Create a copy of the options to circumvent mutations to the original.
        let item = Private.createItem(options);
        this._items.push(item);
        this.stateChanged.emit(void 0);
        return new disposable_1.DisposableDelegate(() => {
            algorithm_1.ArrayExt.removeFirstOf(this._items, item);
            this.stateChanged.emit(void 0);
        });
    }
    /**
     * Return an iterator of launcher items.
     */
    items() {
        return new algorithm_1.ArrayIterator(this._items);
    }
}
exports.LauncherModel = LauncherModel;
/**
 * A virtual-DOM-based widget for the Launcher.
 */
class Launcher extends apputils_1.VDomRenderer {
    /**
     * Construct a new launcher widget.
     */
    constructor(options) {
        super();
        this._pending = false;
        this._cwd = '';
        this._cwd = options.cwd;
        this._callback = options.callback;
        this._commands = options.commands;
        this.addClass(LAUNCHER_CLASS);
    }
    /**
     * The cwd of the launcher.
     */
    get cwd() {
        return this._cwd;
    }
    set cwd(value) {
        this._cwd = value;
        this.update();
    }
    /**
     * Whether there is a pending item being launched.
     */
    get pending() {
        return this._pending;
    }
    set pending(value) {
        this._pending = value;
    }
    /**
     * Render the launcher to virtual DOM nodes.
     */
    render() {
        // Bail if there is no model.
        if (!this.model) {
            return null;
        }
        // First group-by categories
        let categories = Object.create(null);
        algorithm_1.each(this.model.items(), (item, index) => {
            let cat = item.category || 'Other';
            if (!(cat in categories)) {
                categories[cat] = [];
            }
            categories[cat].push(item);
        });
        // Within each category sort by rank
        for (let cat in categories) {
            categories[cat] = categories[cat].sort((a, b) => {
                return Private.sortCmp(a, b, this._cwd, this._commands);
            });
        }
        // Variable to help create sections
        let sections = [];
        let section;
        // Assemble the final ordered list of categories, beginning with
        // KNOWN_CATEGORIES.
        let orderedCategories = [];
        algorithm_1.each(KNOWN_CATEGORIES, (cat, index) => {
            orderedCategories.push(cat);
        });
        for (let cat in categories) {
            if (KNOWN_CATEGORIES.indexOf(cat) === -1) {
                orderedCategories.push(cat);
            }
        }
        // Now create the sections for each category
        orderedCategories.forEach(cat => {
            const item = categories[cat][0];
            let iconClass = `${this._commands.iconClass(item.command, Object.assign({}, item.args, { cwd: this.cwd }))} ` + 'jp-Launcher-sectionIcon jp-Launcher-icon';
            let kernel = KERNEL_CATEGORIES.indexOf(cat) > -1;
            if (cat in categories) {
                section = (React.createElement("div", { className: "jp-Launcher-section", key: cat },
                    React.createElement("div", { className: "jp-Launcher-sectionHeader" },
                        kernel && React.createElement("div", { className: iconClass }),
                        React.createElement("h2", { className: "jp-Launcher-sectionTitle" }, cat)),
                    React.createElement("div", { className: "jp-Launcher-cardContainer" }, algorithm_1.toArray(algorithm_1.map(categories[cat], (item) => {
                        return Card(kernel, item, this, this._commands, this._callback);
                    })))));
                sections.push(section);
            }
        });
        // Wrap the sections in body and content divs.
        return (React.createElement("div", { className: "jp-Launcher-body" },
            React.createElement("div", { className: "jp-Launcher-content" },
                React.createElement("div", { className: "jp-Launcher-cwd" },
                    React.createElement("h3", null, this.cwd)),
                sections)));
    }
}
exports.Launcher = Launcher;
/**
 * A pure tsx component for a launcher card.
 *
 * @param kernel - whether the item takes uses a kernel.
 *
 * @param item - the launcher item to render.
 *
 * @param launcher - the Launcher instance to which this is added.
 *
 * @param launcherCallback - a callback to call after an item has been launched.
 *
 * @returns a vdom `VirtualElement` for the launcher card.
 */
function Card(kernel, item, launcher, commands, launcherCallback) {
    // Get some properties of the command
    const command = item.command;
    const args = Object.assign({}, item.args, { cwd: launcher.cwd });
    const label = commands.label(command, args);
    // Build the onclick handler.
    let onclick = () => {
        // If an item has already been launched,
        // don't try to launch another.
        if (launcher.pending === true) {
            return;
        }
        launcher.pending = true;
        commands
            .execute(command, Object.assign({}, item.args, { cwd: launcher.cwd }))
            .then(value => {
            launcher.pending = false;
            if (value instanceof widgets_1.Widget) {
                launcherCallback(value);
                launcher.dispose();
            }
        })
            .catch(err => {
            launcher.pending = false;
            apputils_1.showErrorMessage('Launcher Error', err);
        });
    };
    // Return the VDOM element.
    return (React.createElement("div", { className: "jp-LauncherCard", title: label, onClick: onclick, "data-category": item.category || 'Other', key: Private.keyProperty.get(item) },
        React.createElement("div", { className: "jp-LauncherCard-icon" },
            item.kernelIconUrl &&
                kernel && (React.createElement("img", { src: item.kernelIconUrl, className: "jp-Launcher-kernelIcon" })),
            !item.kernelIconUrl &&
                !kernel && (React.createElement("div", { className: `${commands.iconClass(command, args)} jp-Launcher-icon` })),
            !item.kernelIconUrl &&
                kernel && (React.createElement("div", { className: "jp-LauncherCard-noKernelIcon" }, label[0].toUpperCase()))),
        React.createElement("div", { className: "jp-LauncherCard-label", title: label }, label)));
}
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * An incrementing counter for keys.
     */
    let id = 0;
    /**
     * An attached property for an item's key.
     */
    Private.keyProperty = new properties_1.AttachedProperty({
        name: 'key',
        create: () => id++
    });
    /**
     * Create a fully specified item given item options.
     */
    function createItem(options) {
        return Object.assign({}, options, { category: options.category || '', rank: options.rank !== undefined ? options.rank : Infinity });
    }
    Private.createItem = createItem;
    /**
     * A sort comparison function for a launcher item.
     */
    function sortCmp(a, b, cwd, commands) {
        // First, compare by rank.
        let r1 = a.rank;
        let r2 = b.rank;
        if (r1 !== r2 && r1 !== undefined && r2 !== undefined) {
            return r1 < r2 ? -1 : 1; // Infinity safe
        }
        // Finally, compare by display name.
        const aLabel = commands.label(a.command, Object.assign({}, a.args, { cwd }));
        const bLabel = commands.label(b.command, Object.assign({}, b.args, { cwd }));
        return aLabel.localeCompare(bLabel);
    }
    Private.sortCmp = sortCmp;
})(Private || (Private = {}));
