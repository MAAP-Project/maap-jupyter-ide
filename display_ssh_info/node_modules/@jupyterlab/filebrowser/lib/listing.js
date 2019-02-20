"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const docmanager_1 = require("@jupyterlab/docmanager");
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_2 = require("@phosphor/coreutils");
const dragdrop_1 = require("@phosphor/dragdrop");
const domutils_1 = require("@phosphor/domutils");
const messaging_1 = require("@phosphor/messaging");
const widgets_1 = require("@phosphor/widgets");
/**
 * The class name added to DirListing widget.
 */
const DIR_LISTING_CLASS = 'jp-DirListing';
/**
 * The class name added to a dir listing header node.
 */
const HEADER_CLASS = 'jp-DirListing-header';
/**
 * The class name added to a dir listing list header cell.
 */
const HEADER_ITEM_CLASS = 'jp-DirListing-headerItem';
/**
 * The class name added to a header cell text node.
 */
const HEADER_ITEM_TEXT_CLASS = 'jp-DirListing-headerItemText';
/**
 * The class name added to a header cell icon node.
 */
const HEADER_ITEM_ICON_CLASS = 'jp-DirListing-headerItemIcon';
/**
 * The class name added to the dir listing content node.
 */
const CONTENT_CLASS = 'jp-DirListing-content';
/**
 * The class name added to dir listing content item.
 */
const ITEM_CLASS = 'jp-DirListing-item';
/**
 * The class name added to the listing item text cell.
 */
const ITEM_TEXT_CLASS = 'jp-DirListing-itemText';
/**
 * The class name added to the listing item icon cell.
 */
const ITEM_ICON_CLASS = 'jp-DirListing-itemIcon';
/**
 * The class name added to the listing item modified cell.
 */
const ITEM_MODIFIED_CLASS = 'jp-DirListing-itemModified';
/**
 * The class name added to the dir listing editor node.
 */
const EDITOR_CLASS = 'jp-DirListing-editor';
/**
 * The class name added to the name column header cell.
 */
const NAME_ID_CLASS = 'jp-id-name';
/**
 * The class name added to the modified column header cell.
 */
const MODIFIED_ID_CLASS = 'jp-id-modified';
/**
 * The mime type for a con tents drag object.
 */
const CONTENTS_MIME = 'application/x-jupyter-icontents';
/**
 * The class name added to drop targets.
 */
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';
/**
 * The class name added to selected rows.
 */
const SELECTED_CLASS = 'jp-mod-selected';
/**
 * The class name added to drag state icons to add space between the icon and the file name
 */
const DRAG_ICON_CLASS = 'jp-DragIcon';
/**
 * The class name added to the widget when there are items on the clipboard.
 */
const CLIPBOARD_CLASS = 'jp-mod-clipboard';
/**
 * The class name added to cut rows.
 */
const CUT_CLASS = 'jp-mod-cut';
/**
 * The class name added when there are more than one selected rows.
 */
const MULTI_SELECTED_CLASS = 'jp-mod-multiSelected';
/**
 * The class name added to indicate running notebook.
 */
const RUNNING_CLASS = 'jp-mod-running';
/**
 * The class name added for a decending sort.
 */
const DESCENDING_CLASS = 'jp-mod-descending';
/**
 * The maximum duration between two key presses when selecting files by prefix.
 */
const PREFIX_APPEND_DURATION = 1000;
/**
 * The threshold in pixels to start a drag event.
 */
const DRAG_THRESHOLD = 5;
/**
 * A boolean indicating whether the platform is Mac.
 */
const IS_MAC = !!navigator.platform.match(/Mac/i);
/**
 * The factory MIME type supported by phosphor dock panels.
 */
const FACTORY_MIME = 'application/vnd.phosphor.widget-factory';
/**
 * A widget which hosts a file list area.
 */
class DirListing extends widgets_1.Widget {
    /**
     * Construct a new file browser directory listing widget.
     *
     * @param model - The file browser view model.
     */
    constructor(options) {
        super({
            node: (options.renderer || DirListing.defaultRenderer).createNode()
        });
        this._items = [];
        this._sortedItems = [];
        this._sortState = {
            direction: 'ascending',
            key: 'name'
        };
        this._drag = null;
        this._dragData = null;
        this._selectTimer = -1;
        this._isCut = false;
        this._prevPath = '';
        this._clipboard = [];
        this._softSelection = '';
        this._selection = Object.create(null);
        this._searchPrefix = '';
        this._searchPrefixTimer = -1;
        this._inRename = false;
        this._isDirty = false;
        this.addClass(DIR_LISTING_CLASS);
        this._model = options.model;
        this._model.fileChanged.connect(this._onFileChanged, this);
        this._model.refreshed.connect(this._onModelRefreshed, this);
        this._model.pathChanged.connect(this._onPathChanged, this);
        this._editNode = document.createElement('input');
        this._editNode.className = EDITOR_CLASS;
        this._manager = this._model.manager;
        this._renderer = options.renderer || DirListing.defaultRenderer;
        const headerNode = apputils_1.DOMUtils.findElement(this.node, HEADER_CLASS);
        this._renderer.populateHeaderNode(headerNode);
        this._manager.activateRequested.connect(this._onActivateRequested, this);
    }
    /**
     * Dispose of the resources held by the directory listing.
     */
    dispose() {
        this._items.length = 0;
        this._sortedItems.length = 0;
        this._clipboard.length = 0;
        super.dispose();
    }
    /**
     * Get the model used by the listing.
     */
    get model() {
        return this._model;
    }
    /**
     * Get the dir listing header node.
     *
     * #### Notes
     * This is the node which holds the header cells.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    get headerNode() {
        return apputils_1.DOMUtils.findElement(this.node, HEADER_CLASS);
    }
    /**
     * Get the dir listing content node.
     *
     * #### Notes
     * This is the node which holds the item nodes.
     *
     * Modifying this node directly can lead to undefined behavior.
     */
    get contentNode() {
        return apputils_1.DOMUtils.findElement(this.node, CONTENT_CLASS);
    }
    /**
     * The renderer instance used by the directory listing.
     */
    get renderer() {
        return this._renderer;
    }
    /**
     * The current sort state.
     */
    get sortState() {
        return this._sortState;
    }
    /**
     * Create an iterator over the listing's selected items.
     *
     * @returns A new iterator over the listing's selected items.
     */
    selectedItems() {
        let items = this._sortedItems;
        return algorithm_1.filter(items, item => this._selection[item.name]);
    }
    /**
     * Create an iterator over the listing's sorted items.
     *
     * @returns A new iterator over the listing's sorted items.
     */
    sortedItems() {
        return new algorithm_1.ArrayIterator(this._sortedItems);
    }
    /**
     * Sort the items using a sort condition.
     */
    sort(state) {
        this._sortedItems = Private.sort(this.model.items(), state);
        this._sortState = state;
        this.update();
    }
    /**
     * Rename the first currently selected item.
     *
     * @returns A promise that resolves with the new name of the item.
     */
    rename() {
        return this._doRename();
    }
    /**
     * Cut the selected items.
     */
    cut() {
        this._isCut = true;
        this._copy();
        this.update();
    }
    /**
     * Copy the selected items.
     */
    copy() {
        this._copy();
    }
    /**
     * Paste the items from the clipboard.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    paste() {
        if (!this._clipboard.length) {
            this._isCut = false;
            return Promise.resolve(undefined);
        }
        const basePath = this._model.path;
        let promises = [];
        algorithm_1.each(this._clipboard, path => {
            if (this._isCut) {
                const parts = path.split('/');
                const name = parts[parts.length - 1];
                const newPath = coreutils_1.PathExt.join(basePath, name);
                promises.push(this._model.manager.rename(path, newPath));
            }
            else {
                promises.push(this._model.manager.copy(path, basePath));
            }
        });
        // Remove any cut modifiers.
        algorithm_1.each(this._items, item => {
            item.classList.remove(CUT_CLASS);
        });
        this._clipboard.length = 0;
        this._isCut = false;
        this.removeClass(CLIPBOARD_CLASS);
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            apputils_1.showErrorMessage('Paste Error', error);
        });
    }
    /**
     * Delete the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    delete() {
        let names = [];
        algorithm_1.each(this._sortedItems, item => {
            if (this._selection[item.name]) {
                names.push(item.name);
            }
        });
        let message = `Are you sure you want to permanently delete the ${names.length} files/folders selected?`;
        if (names.length === 1) {
            message = `Are you sure you want to permanently delete: ${names[0]}?`;
        }
        if (names.length) {
            return apputils_1.showDialog({
                title: 'Delete',
                body: message,
                buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.warnButton({ label: 'DELETE' })]
            }).then(result => {
                if (!this.isDisposed && result.button.accept) {
                    return this._delete(names);
                }
            });
        }
        return Promise.resolve(void 0);
    }
    /**
     * Duplicate the currently selected item(s).
     *
     * @returns A promise that resolves when the operation is complete.
     */
    duplicate() {
        const basePath = this._model.path;
        let promises = [];
        algorithm_1.each(this.selectedItems(), item => {
            if (item.type !== 'directory') {
                let oldPath = coreutils_1.PathExt.join(basePath, item.name);
                promises.push(this._model.manager.copy(oldPath, basePath));
            }
        });
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            apputils_1.showErrorMessage('Duplicate file', error);
        });
    }
    /**
     * Download the currently selected item(s).
     */
    download() {
        algorithm_1.each(this.selectedItems(), item => {
            if (item.type !== 'directory') {
                this._model.download(item.path);
            }
        });
    }
    /**
     * Shut down kernels on the applicable currently selected items.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    shutdownKernels() {
        const model = this._model;
        const items = this._sortedItems;
        const paths = items.map(item => item.path);
        const promises = algorithm_1.toArray(this._model.sessions())
            .filter(session => {
            let index = algorithm_1.ArrayExt.firstIndexOf(paths, session.path);
            return this._selection[items[index].name];
        })
            .map(session => model.manager.services.sessions.shutdown(session.id));
        return Promise.all(promises)
            .then(() => {
            return undefined;
        })
            .catch(error => {
            apputils_1.showErrorMessage('Shutdown kernel', error);
        });
    }
    /**
     * Select next item.
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectNext(keepExisting = false) {
        let index = -1;
        let selected = Object.keys(this._selection);
        let items = this._sortedItems;
        if (selected.length === 1 || keepExisting) {
            // Select the next item.
            let name = selected[selected.length - 1];
            index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
            index += 1;
            if (index === this._items.length) {
                index = 0;
            }
        }
        else if (selected.length === 0) {
            // Select the first item.
            index = 0;
        }
        else {
            // Select the last selected item.
            let name = selected[selected.length - 1];
            index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
        }
        if (index !== -1) {
            this._selectItem(index, keepExisting);
            domutils_1.ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Select previous item.
     *
     * @param keepExisting - Whether to keep the current selection and add to it.
     */
    selectPrevious(keepExisting = false) {
        let index = -1;
        let selected = Object.keys(this._selection);
        let items = this._sortedItems;
        if (selected.length === 1 || keepExisting) {
            // Select the previous item.
            let name = selected[0];
            index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
            index -= 1;
            if (index === -1) {
                index = this._items.length - 1;
            }
        }
        else if (selected.length === 0) {
            // Select the last item.
            index = this._items.length - 1;
        }
        else {
            // Select the first selected item.
            let name = selected[0];
            index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
        }
        if (index !== -1) {
            this._selectItem(index, keepExisting);
            domutils_1.ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Select the first item that starts with prefix being typed.
     */
    selectByPrefix() {
        const prefix = this._searchPrefix;
        let items = this._sortedItems;
        let index = algorithm_1.ArrayExt.findFirstIndex(items, value => {
            return value.name.toLowerCase().substr(0, prefix.length) === prefix;
        });
        if (index !== -1) {
            this._selectItem(index, false);
            domutils_1.ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        }
    }
    /**
     * Get whether an item is selected by name.
     *
     * @param name - The name of of the item.
     *
     * @returns Whether the item is selected.
     */
    isSelected(name) {
        return this._selection[name] === true;
    }
    /**
     * Find a model given a click.
     *
     * @param event - The mouse event.
     *
     * @returns The model for the selected file.
     */
    modelForClick(event) {
        let items = this._sortedItems;
        let index = Private.hitTestNodes(this._items, event.clientX, event.clientY);
        if (index !== -1) {
            return items[index];
        }
        return undefined;
    }
    /**
     * Select an item by name.
     *
     * @parem name - The name of the item to select.
     *
     * @returns A promise that resolves when the name is selected.
     */
    selectItemByName(name) {
        // Make sure the file is available.
        return this.model.refresh().then(() => {
            if (this.isDisposed) {
                throw new Error('File browser is disposed.');
            }
            let items = this._sortedItems;
            let index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
            if (index === -1) {
                throw new Error('Item does not exist.');
            }
            this._selectItem(index, false);
            messaging_1.MessageLoop.sendMessage(this, widgets_1.Widget.Msg.UpdateRequest);
            domutils_1.ElementExt.scrollIntoViewIfNeeded(this.contentNode, this._items[index]);
        });
    }
    /**
     * Handle the DOM events for the directory listing.
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
            case 'mousedown':
                this._evtMousedown(event);
                break;
            case 'mouseup':
                this._evtMouseup(event);
                break;
            case 'mousemove':
                this._evtMousemove(event);
                break;
            case 'keydown':
                this._evtKeydown(event);
                break;
            case 'click':
                this._evtClick(event);
                break;
            case 'dblclick':
                this._evtDblClick(event);
                break;
            case 'dragenter':
            case 'dragover':
                this.addClass('jp-mod-native-drop');
                event.preventDefault();
                break;
            case 'dragleave':
            case 'dragend':
                this.removeClass('jp-mod-native-drop');
                break;
            case 'drop':
                this.removeClass('jp-mod-native-drop');
                this._evtNativeDrop(event);
                break;
            case 'scroll':
                this._evtScroll(event);
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
                break;
        }
    }
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        let node = this.node;
        let content = apputils_1.DOMUtils.findElement(node, CONTENT_CLASS);
        node.addEventListener('mousedown', this);
        node.addEventListener('keydown', this);
        node.addEventListener('click', this);
        node.addEventListener('dblclick', this);
        content.addEventListener('dragenter', this);
        content.addEventListener('dragover', this);
        content.addEventListener('dragleave', this);
        content.addEventListener('dragend', this);
        content.addEventListener('drop', this);
        content.addEventListener('scroll', this);
        content.addEventListener('p-dragenter', this);
        content.addEventListener('p-dragleave', this);
        content.addEventListener('p-dragover', this);
        content.addEventListener('p-drop', this);
    }
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    onBeforeDetach(msg) {
        super.onBeforeDetach(msg);
        let node = this.node;
        let content = apputils_1.DOMUtils.findElement(node, CONTENT_CLASS);
        node.removeEventListener('mousedown', this);
        node.removeEventListener('keydown', this);
        node.removeEventListener('click', this);
        node.removeEventListener('dblclick', this);
        content.removeEventListener('scroll', this);
        content.removeEventListener('dragover', this);
        content.removeEventListener('dragover', this);
        content.removeEventListener('dragleave', this);
        content.removeEventListener('dragend', this);
        content.removeEventListener('drop', this);
        content.removeEventListener('p-dragenter', this);
        content.removeEventListener('p-dragleave', this);
        content.removeEventListener('p-dragover', this);
        content.removeEventListener('p-drop', this);
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
    }
    /**
     * A message handler invoked on an `'after-show'` message.
     */
    onAfterShow(msg) {
        if (this._isDirty) {
            // Update the sorted items.
            this.sort(this.sortState);
            this.update();
        }
    }
    /**
     * A handler invoked on an `'update-request'` message.
     */
    onUpdateRequest(msg) {
        this._isDirty = false;
        // Fetch common variables.
        let items = this._sortedItems;
        let nodes = this._items;
        let content = apputils_1.DOMUtils.findElement(this.node, CONTENT_CLASS);
        let renderer = this._renderer;
        this.removeClass(MULTI_SELECTED_CLASS);
        this.removeClass(SELECTED_CLASS);
        // Remove any excess item nodes.
        while (nodes.length > items.length) {
            content.removeChild(nodes.pop());
        }
        // Add any missing item nodes.
        while (nodes.length < items.length) {
            let node = renderer.createItemNode();
            node.classList.add(ITEM_CLASS);
            nodes.push(node);
            content.appendChild(node);
        }
        // Remove extra classes from the nodes.
        nodes.forEach(item => {
            item.classList.remove(SELECTED_CLASS);
            item.classList.remove(RUNNING_CLASS);
            item.classList.remove(CUT_CLASS);
        });
        // Add extra classes to item nodes based on widget state.
        items.forEach((item, i) => {
            let node = nodes[i];
            let ft = this._manager.registry.getFileTypeForModel(item);
            renderer.updateItemNode(node, item, ft);
            if (this._selection[item.name]) {
                node.classList.add(SELECTED_CLASS);
                if (this._isCut && this._model.path === this._prevPath) {
                    node.classList.add(CUT_CLASS);
                }
            }
            // add metadata to the node
            node.setAttribute('data-isdir', item.type === 'directory' ? 'true' : 'false');
        });
        // Handle the selectors on the widget node.
        let selected = Object.keys(this._selection).length;
        if (selected) {
            this.addClass(SELECTED_CLASS);
            if (selected > 1) {
                this.addClass(MULTI_SELECTED_CLASS);
            }
        }
        // Handle file session statuses.
        let paths = items.map(item => item.path);
        algorithm_1.each(this._model.sessions(), session => {
            let index = algorithm_1.ArrayExt.firstIndexOf(paths, session.path);
            let node = nodes[index];
            let name = session.kernel.name;
            let specs = this._model.specs;
            node.classList.add(RUNNING_CLASS);
            if (specs) {
                name = specs.kernelspecs[name].display_name;
            }
            node.title = `${node.title}\nKernel: ${name}`;
        });
        this._prevPath = this._model.path;
    }
    /**
     * Handle the `'click'` event for the widget.
     */
    _evtClick(event) {
        let target = event.target;
        let header = this.headerNode;
        if (header.contains(target)) {
            let state = this.renderer.handleHeaderClick(header, event);
            if (state) {
                this.sort(state);
            }
            return;
        }
    }
    /**
     * Handle the `'scroll'` event for the widget.
     */
    _evtScroll(event) {
        this.headerNode.scrollLeft = this.contentNode.scrollLeft;
    }
    /**
     * Handle the `'mousedown'` event for the widget.
     */
    _evtMousedown(event) {
        // Bail if clicking within the edit node
        if (event.target === this._editNode) {
            return;
        }
        // Blur the edit node if necessary.
        if (this._editNode.parentNode) {
            if (this._editNode !== event.target) {
                this._editNode.focus();
                this._editNode.blur();
                clearTimeout(this._selectTimer);
            }
            else {
                return;
            }
        }
        let index = Private.hitTestNodes(this._items, event.clientX, event.clientY);
        if (index === -1) {
            return;
        }
        this._handleFileSelect(event);
        if (event.button !== 0) {
            clearTimeout(this._selectTimer);
        }
        // Check for clearing a context menu.
        let newContext = (IS_MAC && event.ctrlKey) || event.button === 2;
        if (newContext) {
            return;
        }
        // Left mouse press for drag start.
        if (event.button === 0) {
            this._dragData = {
                pressX: event.clientX,
                pressY: event.clientY,
                index: index
            };
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
        }
    }
    /**
     * Handle the `'mouseup'` event for the widget.
     */
    _evtMouseup(event) {
        // Handle any soft selection from the previous mouse down.
        if (this._softSelection) {
            let altered = event.metaKey || event.shiftKey || event.ctrlKey;
            // See if we need to clear the other selection.
            if (!altered && event.button === 0) {
                this._selection = Object.create(null);
                this._selection[this._softSelection] = true;
                this.update();
            }
            this._softSelection = '';
        }
        // Remove the drag listeners if necessary.
        if (event.button !== 0 || !this._drag) {
            document.removeEventListener('mousemove', this, true);
            document.removeEventListener('mouseup', this, true);
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    /**
     * Handle the `'mousemove'` event for the widget.
     */
    _evtMousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        // Bail if we are the one dragging.
        if (this._drag || !this._dragData) {
            return;
        }
        // Check for a drag initialization.
        let data = this._dragData;
        let dx = Math.abs(event.clientX - data.pressX);
        let dy = Math.abs(event.clientY - data.pressY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            return;
        }
        this._startDrag(data.index, event.clientX, event.clientY);
    }
    /**
     * Handle the `'keydown'` event for the widget.
     */
    _evtKeydown(event) {
        switch (event.keyCode) {
            case 13: // Enter
                // Do nothing if any modifier keys are pressed.
                if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                let selected = Object.keys(this._selection);
                let name = selected[0];
                let items = this._sortedItems;
                let i = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
                if (i === -1) {
                    return;
                }
                let model = this._model;
                let item = this._sortedItems[i];
                if (item.type === 'directory') {
                    model
                        .cd(item.name)
                        .catch(error => apputils_1.showErrorMessage('Open directory', error));
                }
                else {
                    let path = item.path;
                    this._manager.openOrReveal(path);
                }
                break;
            case 38: // Up arrow
                this.selectPrevious(event.shiftKey);
                event.stopPropagation();
                event.preventDefault();
                break;
            case 40: // Down arrow
                this.selectNext(event.shiftKey);
                event.stopPropagation();
                event.preventDefault();
                break;
            default:
                break;
        }
        // Detects printable characters typed by the user.
        // Not all browsers support .key, but it discharges us from reconstructing
        // characters from key codes.
        if (!this._inRename && event.key !== undefined && event.key.length === 1) {
            this._searchPrefix += event.key;
            clearTimeout(this._searchPrefixTimer);
            this._searchPrefixTimer = window.setTimeout(() => {
                this._searchPrefix = '';
            }, PREFIX_APPEND_DURATION);
            this.selectByPrefix();
            event.stopPropagation();
            event.preventDefault();
        }
    }
    /**
     * Handle the `'dblclick'` event for the widget.
     */
    _evtDblClick(event) {
        // Do nothing if it's not a left mouse press.
        if (event.button !== 0) {
            return;
        }
        // Do nothing if any modifier keys are pressed.
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
        }
        // Stop the event propagation.
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(this._selectTimer);
        this._editNode.blur();
        // Find a valid double click target.
        let target = event.target;
        let i = algorithm_1.ArrayExt.findFirstIndex(this._items, node => node.contains(target));
        if (i === -1) {
            return;
        }
        let model = this._model;
        let item = this._sortedItems[i];
        if (item.type === 'directory') {
            model
                .cd(item.name)
                .catch(error => apputils_1.showErrorMessage('Open directory', error));
        }
        else {
            let path = item.path;
            this._manager.openOrReveal(path);
        }
    }
    /**
     * Handle the `drop` event for the widget.
     */
    _evtNativeDrop(event) {
        let files = event.dataTransfer.files;
        if (files.length === 0) {
            return;
        }
        event.preventDefault();
        for (let i = 0; i < files.length; i++) {
            this._model.upload(files[i]);
        }
    }
    /**
     * Handle the `'p-dragenter'` event for the widget.
     */
    _evtDragEnter(event) {
        if (event.mimeData.hasData(CONTENTS_MIME)) {
            let index = Private.hitTestNodes(this._items, event.clientX, event.clientY);
            if (index === -1) {
                return;
            }
            let item = this._sortedItems[index];
            if (item.type !== 'directory' || this._selection[item.name]) {
                return;
            }
            let target = event.target;
            target.classList.add(DROP_TARGET_CLASS);
            event.preventDefault();
            event.stopPropagation();
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
        let index = Private.hitTestNodes(this._items, event.clientX, event.clientY);
        this._items[index].classList.add(DROP_TARGET_CLASS);
    }
    /**
     * Handle the `'p-drop'` event for the widget.
     */
    _evtDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(this._selectTimer);
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
        const index = algorithm_1.ArrayExt.firstIndexOf(this._items, target);
        const items = this._sortedItems;
        let basePath = this._model.path;
        if (items[index].type === 'directory') {
            basePath = coreutils_1.PathExt.join(basePath, items[index].name);
        }
        const manager = this._manager;
        // Handle the items.
        const promises = [];
        const paths = event.mimeData.getData(CONTENTS_MIME);
        for (let path of paths) {
            let localPath = manager.services.contents.localPath(path);
            let name = coreutils_1.PathExt.basename(localPath);
            let newPath = coreutils_1.PathExt.join(basePath, name);
            // Skip files that are not moving.
            if (newPath === path) {
                continue;
            }
            promises.push(docmanager_1.renameFile(manager, path, newPath));
        }
        Promise.all(promises).catch(error => {
            apputils_1.showErrorMessage('Move Error', error);
        });
    }
    /**
     * Start a drag event.
     */
    _startDrag(index, clientX, clientY) {
        let selectedNames = Object.keys(this._selection);
        let source = this._items[index];
        let items = this._sortedItems;
        let item;
        // If the source node is not selected, use just that node.
        if (!source.classList.contains(SELECTED_CLASS)) {
            item = items[index];
            selectedNames = [item.name];
        }
        else {
            let name = selectedNames[0];
            item = algorithm_1.find(items, value => value.name === name);
        }
        if (!item) {
            return;
        }
        // Create the drag image.
        let ft = this._manager.registry.getFileTypeForModel(item);
        let dragImage = this.renderer.createDragImage(source, selectedNames.length, ft);
        // Set up the drag event.
        this._drag = new dragdrop_1.Drag({
            dragImage,
            mimeData: new coreutils_2.MimeData(),
            supportedActions: 'move',
            proposedAction: 'move'
        });
        let basePath = this._model.path;
        let paths = algorithm_1.toArray(algorithm_1.map(selectedNames, name => {
            return coreutils_1.PathExt.join(basePath, name);
        }));
        this._drag.mimeData.setData(CONTENTS_MIME, paths);
        if (item && item.type !== 'directory') {
            const otherPaths = paths.slice(1).reverse();
            this._drag.mimeData.setData(FACTORY_MIME, () => {
                if (!item) {
                    return;
                }
                let path = item.path;
                let widget = this._manager.findWidget(path);
                if (!widget) {
                    widget = this._manager.open(item.path);
                }
                if (otherPaths.length) {
                    const firstWidgetPlaced = new coreutils_2.PromiseDelegate();
                    firstWidgetPlaced.promise.then(() => {
                        let prevWidget = widget;
                        otherPaths.forEach(path => {
                            const options = {
                                ref: prevWidget.id,
                                mode: 'tab-after'
                            };
                            prevWidget = this._manager.openOrReveal(path, void 0, void 0, options);
                            this._manager.openOrReveal(item.path);
                        });
                    });
                    firstWidgetPlaced.resolve(void 0);
                }
                return widget;
            });
        }
        // Start the drag and remove the mousemove and mouseup listeners.
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        clearTimeout(this._selectTimer);
        this._drag.start(clientX, clientY).then(action => {
            this._drag = null;
            clearTimeout(this._selectTimer);
        });
    }
    /**
     * Handle selection on a file node.
     */
    _handleFileSelect(event) {
        // Fetch common variables.
        let items = this._sortedItems;
        let index = Private.hitTestNodes(this._items, event.clientX, event.clientY);
        clearTimeout(this._selectTimer);
        if (index === -1) {
            return;
        }
        // Clear any existing soft selection.
        this._softSelection = '';
        let name = items[index].name;
        let selected = Object.keys(this._selection);
        // Handle toggling.
        if ((IS_MAC && event.metaKey) || (!IS_MAC && event.ctrlKey)) {
            if (this._selection[name]) {
                delete this._selection[name];
            }
            else {
                this._selection[name] = true;
            }
            // Handle multiple select.
        }
        else if (event.shiftKey) {
            this._handleMultiSelect(selected, index);
            // Handle a 'soft' selection
        }
        else if (name in this._selection && selected.length > 1) {
            this._softSelection = name;
            // Default to selecting the only the item.
        }
        else {
            // Select only the given item.
            this._selection = Object.create(null);
            this._selection[name] = true;
        }
        this.update();
    }
    /**
     * Handle a multiple select on a file item node.
     */
    _handleMultiSelect(selected, index) {
        // Find the "nearest selected".
        let items = this._sortedItems;
        let nearestIndex = -1;
        for (let i = 0; i < this._items.length; i++) {
            if (i === index) {
                continue;
            }
            let name = items[i].name;
            if (selected.indexOf(name) !== -1) {
                if (nearestIndex === -1) {
                    nearestIndex = i;
                }
                else {
                    if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
                        nearestIndex = i;
                    }
                }
            }
        }
        // Default to the first element (and fill down).
        if (nearestIndex === -1) {
            nearestIndex = 0;
        }
        // Select the rows between the current and the nearest selected.
        for (let i = 0; i < this._items.length; i++) {
            if ((nearestIndex >= i && index <= i) ||
                (nearestIndex <= i && index >= i)) {
                this._selection[items[i].name] = true;
            }
        }
    }
    /**
     * Copy the selected items, and optionally cut as well.
     */
    _copy() {
        this._clipboard.length = 0;
        algorithm_1.each(this.selectedItems(), item => {
            this._clipboard.push(item.path);
        });
    }
    /**
     * Delete the files with the given names.
     */
    _delete(names) {
        const promises = [];
        const basePath = this._model.path;
        for (let name of names) {
            let newPath = coreutils_1.PathExt.join(basePath, name);
            let promise = this._model.manager.deleteFile(newPath).catch(err => {
                apputils_1.showErrorMessage('Delete Failed', err);
            });
            promises.push(promise);
        }
        return Promise.all(promises).then(() => undefined);
    }
    /**
     * Allow the user to rename item on a given row.
     */
    _doRename() {
        this._inRename = true;
        let items = this._sortedItems;
        let name = Object.keys(this._selection)[0];
        let index = algorithm_1.ArrayExt.findFirstIndex(items, value => value.name === name);
        let row = this._items[index];
        let item = items[index];
        let nameNode = this.renderer.getNameNode(row);
        let original = item.name;
        this._editNode.value = original;
        this._selectItem(index, false);
        return Private.doRename(nameNode, this._editNode).then(newName => {
            if (!newName || newName === original) {
                this._inRename = false;
                return original;
            }
            if (!docmanager_1.isValidFileName(newName)) {
                apputils_1.showErrorMessage('Rename Error', Error(`"${newName}" is not a valid name for a file. ` +
                    `Names must have nonzero length, ` +
                    `and cannot include "/", "\\", or ":"`));
                this._inRename = false;
                return original;
            }
            if (this.isDisposed) {
                this._inRename = false;
                throw new Error('File browser is disposed.');
            }
            const manager = this._manager;
            const oldPath = coreutils_1.PathExt.join(this._model.path, original);
            const newPath = coreutils_1.PathExt.join(this._model.path, newName);
            const promise = docmanager_1.renameFile(manager, oldPath, newPath);
            return promise
                .catch(error => {
                if (error !== 'File not renamed') {
                    apputils_1.showErrorMessage('Rename Error', error);
                }
                this._inRename = false;
                return original;
            })
                .then(() => {
                if (this.isDisposed) {
                    this._inRename = false;
                    throw new Error('File browser is disposed.');
                }
                if (this._inRename) {
                    // No need to catch because `newName` will always exit.
                    this.selectItemByName(newName);
                }
                this._inRename = false;
                return newName;
            });
        });
    }
    /**
     * Select a given item.
     */
    _selectItem(index, keepExisting) {
        // Selected the given row(s)
        let items = this._sortedItems;
        if (!keepExisting) {
            this._selection = Object.create(null);
        }
        let name = items[index].name;
        this._selection[name] = true;
        this.update();
    }
    /**
     * Handle the `refreshed` signal from the model.
     */
    _onModelRefreshed() {
        // Update the selection.
        let existing = Object.keys(this._selection);
        this._selection = Object.create(null);
        algorithm_1.each(this._model.items(), item => {
            let name = item.name;
            if (existing.indexOf(name) !== -1) {
                this._selection[name] = true;
            }
        });
        if (this.isVisible) {
            // Update the sorted items.
            this.sort(this.sortState);
        }
        else {
            this._isDirty = true;
        }
    }
    /**
     * Handle a `pathChanged` signal from the model.
     */
    _onPathChanged() {
        // Reset the selection.
        this._selection = Object.create(null);
        // Update the sorted items.
        this.sort(this.sortState);
    }
    /**
     * Handle a `fileChanged` signal from the model.
     */
    _onFileChanged(sender, args) {
        let newValue = args.newValue;
        if (!newValue) {
            return;
        }
        if (args.type !== 'new' || !name) {
            return;
        }
        this.selectItemByName(name)
            .then(() => {
            if (!this.isDisposed && newValue.type === 'directory') {
                this._doRename();
            }
        })
            .catch(() => {
            /* Ignore if file does not exist. */
        });
    }
    /**
     * Handle an `activateRequested` signal from the manager.
     */
    _onActivateRequested(sender, args) {
        let dirname = coreutils_1.PathExt.dirname(args);
        if (dirname !== this._model.path) {
            return;
        }
        let basename = coreutils_1.PathExt.basename(args);
        this.selectItemByName(basename).catch(() => {
            /* Ignore if file does not exist. */
        });
    }
}
exports.DirListing = DirListing;
/**
 * The namespace for the `DirListing` class statics.
 */
(function (DirListing) {
    /**
     * The default implementation of an `IRenderer`.
     */
    class Renderer {
        /**
         * Create the DOM node for a dir listing.
         */
        createNode() {
            let node = document.createElement('div');
            let header = document.createElement('div');
            let content = document.createElement('ul');
            content.className = CONTENT_CLASS;
            header.className = HEADER_CLASS;
            node.appendChild(header);
            node.appendChild(content);
            node.tabIndex = 1;
            return node;
        }
        /**
         * Populate and empty header node for a dir listing.
         *
         * @param node - The header node to populate.
         */
        populateHeaderNode(node) {
            let name = this._createHeaderItemNode('Name');
            let modified = this._createHeaderItemNode('Last Modified');
            name.classList.add(NAME_ID_CLASS);
            name.classList.add(SELECTED_CLASS);
            modified.classList.add(MODIFIED_ID_CLASS);
            node.appendChild(name);
            node.appendChild(modified);
        }
        /**
         * Handle a header click.
         *
         * @param node - A node populated by [[populateHeaderNode]].
         *
         * @param event - A click event on the node.
         *
         * @returns The sort state of the header after the click event.
         */
        handleHeaderClick(node, event) {
            let name = apputils_1.DOMUtils.findElement(node, NAME_ID_CLASS);
            let modified = apputils_1.DOMUtils.findElement(node, MODIFIED_ID_CLASS);
            let state = { direction: 'ascending', key: 'name' };
            let target = event.target;
            if (name.contains(target)) {
                if (name.classList.contains(SELECTED_CLASS)) {
                    if (!name.classList.contains(DESCENDING_CLASS)) {
                        state.direction = 'descending';
                        name.classList.add(DESCENDING_CLASS);
                    }
                    else {
                        name.classList.remove(DESCENDING_CLASS);
                    }
                }
                else {
                    name.classList.remove(DESCENDING_CLASS);
                }
                name.classList.add(SELECTED_CLASS);
                modified.classList.remove(SELECTED_CLASS);
                modified.classList.remove(DESCENDING_CLASS);
                return state;
            }
            if (modified.contains(target)) {
                state.key = 'last_modified';
                if (modified.classList.contains(SELECTED_CLASS)) {
                    if (!modified.classList.contains(DESCENDING_CLASS)) {
                        state.direction = 'descending';
                        modified.classList.add(DESCENDING_CLASS);
                    }
                    else {
                        modified.classList.remove(DESCENDING_CLASS);
                    }
                }
                else {
                    modified.classList.remove(DESCENDING_CLASS);
                }
                modified.classList.add(SELECTED_CLASS);
                name.classList.remove(SELECTED_CLASS);
                name.classList.remove(DESCENDING_CLASS);
                return state;
            }
            return state;
        }
        /**
         * Create a new item node for a dir listing.
         *
         * @returns A new DOM node to use as a content item.
         */
        createItemNode() {
            let node = document.createElement('li');
            let icon = document.createElement('span');
            let text = document.createElement('span');
            let modified = document.createElement('span');
            icon.className = ITEM_ICON_CLASS;
            text.className = ITEM_TEXT_CLASS;
            modified.className = ITEM_MODIFIED_CLASS;
            node.appendChild(icon);
            node.appendChild(text);
            node.appendChild(modified);
            return node;
        }
        /**
         * Update an item node to reflect the current state of a model.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param model - The model object to use for the item state.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         */
        updateItemNode(node, model, fileType) {
            let icon = apputils_1.DOMUtils.findElement(node, ITEM_ICON_CLASS);
            let text = apputils_1.DOMUtils.findElement(node, ITEM_TEXT_CLASS);
            let modified = apputils_1.DOMUtils.findElement(node, ITEM_MODIFIED_CLASS);
            if (fileType) {
                icon.textContent = fileType.iconLabel || '';
                icon.className = `${ITEM_ICON_CLASS} ${fileType.iconClass || ''}`;
            }
            else {
                icon.textContent = '';
                icon.className = ITEM_ICON_CLASS;
            }
            node.title = model.name;
            // If an item is being edited currently, its text node is unavailable.
            if (text) {
                text.textContent = model.name;
            }
            let modText = '';
            let modTitle = '';
            if (model.last_modified) {
                modText = coreutils_1.Time.formatHuman(new Date(model.last_modified));
                modTitle = coreutils_1.Time.format(new Date(model.last_modified));
            }
            modified.textContent = modText;
            modified.title = modTitle;
        }
        /**
         * Get the node containing the file name.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @returns The node containing the file name.
         */
        getNameNode(node) {
            return apputils_1.DOMUtils.findElement(node, ITEM_TEXT_CLASS);
        }
        /**
         * Create a drag image for an item.
         *
         * @param node - A node created by [[createItemNode]].
         *
         * @param count - The number of items being dragged.
         *
         * @param fileType - The file type of the item, if applicable.
         *
         * @returns An element to use as the drag image.
         */
        createDragImage(node, count, fileType) {
            let dragImage = node.cloneNode(true);
            let modified = apputils_1.DOMUtils.findElement(dragImage, ITEM_MODIFIED_CLASS);
            let icon = apputils_1.DOMUtils.findElement(dragImage, ITEM_ICON_CLASS);
            dragImage.removeChild(modified);
            if (!fileType) {
                icon.textContent = '';
                icon.className = '';
            }
            else {
                icon.textContent = fileType.iconLabel || '';
                icon.className = fileType.iconClass || '';
            }
            icon.classList.add(DRAG_ICON_CLASS);
            if (count > 1) {
                let nameNode = apputils_1.DOMUtils.findElement(dragImage, ITEM_TEXT_CLASS);
                nameNode.textContent = count + ' Items';
            }
            return dragImage;
        }
        /**
         * Create a node for a header item.
         */
        _createHeaderItemNode(label) {
            let node = document.createElement('div');
            let text = document.createElement('span');
            let icon = document.createElement('span');
            node.className = HEADER_ITEM_CLASS;
            text.className = HEADER_ITEM_TEXT_CLASS;
            icon.className = HEADER_ITEM_ICON_CLASS;
            text.textContent = label;
            node.appendChild(text);
            node.appendChild(icon);
            return node;
        }
    }
    DirListing.Renderer = Renderer;
    /**
     * The default `IRenderer` instance.
     */
    DirListing.defaultRenderer = new Renderer();
})(DirListing = exports.DirListing || (exports.DirListing = {}));
/**
 * The namespace for the listing private data.
 */
var Private;
(function (Private) {
    /**
     * Handle editing text on a node.
     *
     * @returns Boolean indicating whether the name changed.
     */
    function doRename(text, edit) {
        let parent = text.parentElement;
        parent.replaceChild(edit, text);
        edit.focus();
        let index = edit.value.lastIndexOf('.');
        if (index === -1) {
            edit.setSelectionRange(0, edit.value.length);
        }
        else {
            edit.setSelectionRange(0, index);
        }
        return new Promise((resolve, reject) => {
            edit.onblur = () => {
                parent.replaceChild(text, edit);
                resolve(edit.value);
            };
            edit.onkeydown = (event) => {
                switch (event.keyCode) {
                    case 13: // Enter
                        event.stopPropagation();
                        event.preventDefault();
                        edit.blur();
                        break;
                    case 27: // Escape
                        event.stopPropagation();
                        event.preventDefault();
                        edit.blur();
                        break;
                    case 38: // Up arrow
                        event.stopPropagation();
                        event.preventDefault();
                        if (edit.selectionStart !== edit.selectionEnd) {
                            edit.selectionStart = edit.selectionEnd = 0;
                        }
                        break;
                    case 40: // Down arrow
                        event.stopPropagation();
                        event.preventDefault();
                        if (edit.selectionStart !== edit.selectionEnd) {
                            edit.selectionStart = edit.selectionEnd = edit.value.length;
                        }
                        break;
                    default:
                        break;
                }
            };
        });
    }
    Private.doRename = doRename;
    /**
     * Sort a list of items by sort state as a new array.
     */
    function sort(items, state) {
        let copy = algorithm_1.toArray(items);
        if (state.key === 'last_modified') {
            // Sort by type and then by last modified.
            copy.sort((a, b) => {
                // Compare based on type.
                let t1 = typeWeight(a);
                let t2 = typeWeight(b);
                if (t1 !== t2) {
                    return t1 < t2 ? -1 : 1; // Infinity safe
                }
                let valA = new Date(a.last_modified).getTime();
                let valB = new Date(b.last_modified).getTime();
                if (state.direction === 'descending') {
                    return valA - valB;
                }
                return valB - valA;
            });
        }
        else {
            // Sort by type and then by name.
            copy.sort((a, b) => {
                // Compare based on type.
                let t1 = typeWeight(a);
                let t2 = typeWeight(b);
                if (t1 !== t2) {
                    return t1 < t2 ? -1 : 1; // Infinity safe
                }
                // Compare by display name.
                if (state.direction === 'descending') {
                    return b.name.localeCompare(a.name);
                }
                return a.name.localeCompare(b.name);
            });
        }
        return copy;
    }
    Private.sort = sort;
    /**
     * Get the index of the node at a client position, or `-1`.
     */
    function hitTestNodes(nodes, x, y) {
        return algorithm_1.ArrayExt.findFirstIndex(nodes, node => domutils_1.ElementExt.hitTest(node, x, y));
    }
    Private.hitTestNodes = hitTestNodes;
    /**
     * Weight a contents model by type.
     */
    function typeWeight(model) {
        switch (model.type) {
            case 'directory':
                return 0;
            case 'notebook':
                return 1;
            case 'file':
                return 2;
            default:
                return Infinity;
        }
    }
})(Private || (Private = {}));
