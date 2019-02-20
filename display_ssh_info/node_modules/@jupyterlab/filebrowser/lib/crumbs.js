"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const domutils_1 = require("@phosphor/domutils");
const widgets_1 = require("@phosphor/widgets");
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const docmanager_1 = require("@jupyterlab/docmanager");
/**
 * The class name added to material icons
 */
const MATERIAL_CLASS = 'jp-MaterialIcon';
/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_CLASS = 'jp-BreadCrumbs';
/**
 * The class name added to add the home icon for the breadcrumbs
 */
const BREADCRUMB_HOME = 'jp-HomeIcon';
/**
 * The class named associated to the ellipses icon
 */
const BREADCRUMB_ELLIPSES = 'jp-EllipsesIcon';
/**
 * The class name added to the breadcrumb node.
 */
const BREADCRUMB_ITEM_CLASS = 'jp-BreadCrumbs-item';
/**
 * Bread crumb paths.
 */
const BREAD_CRUMB_PATHS = ['/', '../../', '../', ''];
/**
 * The mime type for a contents drag object.
 */
const CONTENTS_MIME = 'application/x-jupyter-icontents';
/**
 * The class name added to drop targets.
 */
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';
/**
 * A class which hosts folder breadcrumbs.
 */
class BreadCrumbs extends widgets_1.Widget {
    /**
     * Construct a new file browser crumb widget.
     *
     * @param model - The file browser view model.
     */
    constructor(options) {
        super();
        this._model = options.model;
        this.addClass(BREADCRUMB_CLASS);
        this._crumbs = Private.createCrumbs();
        this._crumbSeps = Private.createCrumbSeparators();
        this.node.appendChild(this._crumbs[Private.Crumb.Home]);
        this._model.refreshed.connect(this.update, this);
    }
    /**
     * Handle the DOM events for the bread crumbs.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the panel's DOM node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'click':
                this._evtClick(event);
                break;
            case 'p-dragenter':
                this._evtDragEnter(event);
                break;
            case 'p-dragleave':
                this._evtDragLeave(event);
                break;
            case 'p-dragover':
                this._evtDragOver(event);
                break;
            case 'p-drop':
                this._evtDrop(event);
                break;
            default:
                return;
        }
    }
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.update();
        let node = this.node;
        node.addEventListener('click', this);
        node.addEventListener('p-dragenter', this);
        node.addEventListener('p-dragleave', this);
        node.addEventListener('p-dragover', this);
        node.addEventListener('p-drop', this);
    }
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    onBeforeDetach(msg) {
        super.onBeforeDetach(msg);
        let node = this.node;
        node.removeEventListener('click', this);
        node.removeEventListener('p-dragenter', this);
        node.removeEventListener('p-dragleave', this);
        node.removeEventListener('p-dragover', this);
        node.removeEventListener('p-drop', this);
    }
    /**
     * A handler invoked on an `'update-request'` message.
     */
    onUpdateRequest(msg) {
        // Update the breadcrumb list.
        const contents = this._model.manager.services.contents;
        const localPath = contents.localPath(this._model.path);
        Private.updateCrumbs(this._crumbs, this._crumbSeps, localPath);
    }
    /**
     * Handle the `'click'` event for the widget.
     */
    _evtClick(event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Find a valid click target.
        let node = event.target;
        while (node && node !== this.node) {
            if (node.classList.contains(BREADCRUMB_ITEM_CLASS)) {
                let index = algorithm_1.ArrayExt.findFirstIndex(this._crumbs, value => value === node);
                this._model
                    .cd(BREAD_CRUMB_PATHS[index])
                    .catch(error => apputils_1.showErrorMessage('Open Error', error));
                // Stop the event propagation.
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            node = node.parentElement;
        }
    }
    /**
     * Handle the `'p-dragenter'` event for the widget.
     */
    _evtDragEnter(event) {
        if (event.mimeData.hasData(CONTENTS_MIME)) {
            let index = algorithm_1.ArrayExt.findFirstIndex(this._crumbs, node => domutils_1.ElementExt.hitTest(node, event.clientX, event.clientY));
            if (index !== -1) {
                if (index !== Private.Crumb.Current) {
                    this._crumbs[index].classList.add(DROP_TARGET_CLASS);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }
    }
    /**
     * Handle the `'p-dragleave'` event for the widget.
     */
    _evtDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        let dropTarget = apputils_1.DOMUtils.findElement(this.node, DROP_TARGET_CLASS);
        if (dropTarget) {
            dropTarget.classList.remove(DROP_TARGET_CLASS);
        }
    }
    /**
     * Handle the `'p-dragover'` event for the widget.
     */
    _evtDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
        let dropTarget = apputils_1.DOMUtils.findElement(this.node, DROP_TARGET_CLASS);
        if (dropTarget) {
            dropTarget.classList.remove(DROP_TARGET_CLASS);
        }
        let index = algorithm_1.ArrayExt.findFirstIndex(this._crumbs, node => domutils_1.ElementExt.hitTest(node, event.clientX, event.clientY));
        if (index !== -1) {
            this._crumbs[index].classList.add(DROP_TARGET_CLASS);
        }
    }
    /**
     * Handle the `'p-drop'` event for the widget.
     */
    _evtDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === 'none') {
            event.dropAction = 'none';
            return;
        }
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        event.dropAction = event.proposedAction;
        let target = event.target;
        while (target && target.parentElement) {
            if (target.classList.contains(DROP_TARGET_CLASS)) {
                target.classList.remove(DROP_TARGET_CLASS);
                break;
            }
            target = target.parentElement;
        }
        // Get the path based on the target node.
        let index = algorithm_1.ArrayExt.findFirstIndex(this._crumbs, node => node === target);
        if (index === -1) {
            return;
        }
        const model = this._model;
        const path = coreutils_1.PathExt.resolve(model.path, BREAD_CRUMB_PATHS[index]);
        const manager = model.manager;
        // Move all of the items.
        let promises = [];
        let oldPaths = event.mimeData.getData(CONTENTS_MIME);
        for (let oldPath of oldPaths) {
            let localOldPath = manager.services.contents.localPath(oldPath);
            let name = coreutils_1.PathExt.basename(localOldPath);
            let newPath = coreutils_1.PathExt.join(path, name);
            promises.push(docmanager_1.renameFile(manager, oldPath, newPath));
        }
        Promise.all(promises).catch(err => {
            apputils_1.showErrorMessage('Move Error', err);
        });
    }
}
exports.BreadCrumbs = BreadCrumbs;
/**
 * The namespace for the crumbs private data.
 */
var Private;
(function (Private) {
    /**
     * Breadcrumb item list enum.
     */
    let Crumb;
    (function (Crumb) {
        Crumb[Crumb["Home"] = 0] = "Home";
        Crumb[Crumb["Ellipsis"] = 1] = "Ellipsis";
        Crumb[Crumb["Parent"] = 2] = "Parent";
        Crumb[Crumb["Current"] = 3] = "Current";
    })(Crumb = Private.Crumb || (Private.Crumb = {}));
    /**
     * Populate the breadcrumb node.
     */
    function updateCrumbs(breadcrumbs, separators, path) {
        let node = breadcrumbs[0].parentNode;
        // Remove all but the home node.
        let firstChild = node.firstChild;
        while (firstChild && firstChild.nextSibling) {
            node.removeChild(firstChild.nextSibling);
        }
        let parts = path.split('/');
        if (parts.length > 2) {
            node.appendChild(separators[0]);
            node.appendChild(breadcrumbs[Crumb.Ellipsis]);
            let grandParent = parts.slice(0, parts.length - 2).join('/');
            breadcrumbs[Crumb.Ellipsis].title = grandParent;
        }
        if (path) {
            if (parts.length >= 2) {
                node.appendChild(separators[1]);
                breadcrumbs[Crumb.Parent].textContent = parts[parts.length - 2];
                node.appendChild(breadcrumbs[Crumb.Parent]);
                let parent = parts.slice(0, parts.length - 1).join('/');
                breadcrumbs[Crumb.Parent].title = parent;
            }
            node.appendChild(separators[2]);
            breadcrumbs[Crumb.Current].textContent = parts[parts.length - 1];
            node.appendChild(breadcrumbs[Crumb.Current]);
            breadcrumbs[Crumb.Current].title = path;
        }
    }
    Private.updateCrumbs = updateCrumbs;
    /**
     * Create the breadcrumb nodes.
     */
    function createCrumbs() {
        let home = document.createElement('span');
        home.className =
            MATERIAL_CLASS + ' ' + BREADCRUMB_HOME + ' ' + BREADCRUMB_ITEM_CLASS;
        home.title = 'Home';
        let ellipsis = document.createElement('span');
        ellipsis.className =
            MATERIAL_CLASS + ' ' + BREADCRUMB_ELLIPSES + ' ' + BREADCRUMB_ITEM_CLASS;
        let parent = document.createElement('span');
        parent.className = BREADCRUMB_ITEM_CLASS;
        let current = document.createElement('span');
        current.className = BREADCRUMB_ITEM_CLASS;
        return [home, ellipsis, parent, current];
    }
    Private.createCrumbs = createCrumbs;
    /**
     * Create the breadcrumb separator nodes.
     */
    function createCrumbSeparators() {
        let items = [];
        for (let i = 0; i < 3; i++) {
            let item = document.createElement('i');
            item.className = 'fa fa-angle-right';
            items.push(item);
        }
        return items;
    }
    Private.createCrumbSeparators = createCrumbSeparators;
})(Private || (Private = {}));
