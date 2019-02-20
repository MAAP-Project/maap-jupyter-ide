"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const widgets_1 = require("@phosphor/widgets");
/**
 * The class name added to file dialogs.
 */
const FILE_DIALOG_CLASS = 'jp-FileDialog';
/**
 * The class name added for the new name label in the rename dialog
 */
const RENAME_NEWNAME_TITLE_CLASS = 'jp-new-name-title';
/**
 * Rename a file with a dialog.
 */
function renameDialog(manager, oldPath) {
    return apputils_1.showDialog({
        title: 'Rename File',
        body: new RenameHandler(oldPath),
        focusNodeSelector: 'input',
        buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton({ label: 'RENAME' })]
    }).then(result => {
        if (!result.value) {
            return;
        }
        if (!isValidFileName(result.value)) {
            apputils_1.showErrorMessage('Rename Error', Error(`"${result.value}" is not a valid name for a file. ` +
                `Names must have nonzero length, ` +
                `and cannot include "/", "\\", or ":"`));
            return null;
        }
        let basePath = coreutils_1.PathExt.dirname(oldPath);
        let newPath = coreutils_1.PathExt.join(basePath, result.value);
        return renameFile(manager, oldPath, newPath);
    });
}
exports.renameDialog = renameDialog;
/**
 * Rename a file, asking for confirmation if it is overwriting another.
 */
function renameFile(manager, oldPath, newPath) {
    return manager.rename(oldPath, newPath).catch(error => {
        if (error.message.indexOf('409') === -1) {
            throw error;
        }
        return shouldOverwrite(newPath).then(value => {
            if (value) {
                return manager.overwrite(oldPath, newPath);
            }
            return Promise.reject('File not renamed');
        });
    });
}
exports.renameFile = renameFile;
/**
 * Ask the user whether to overwrite a file.
 */
function shouldOverwrite(path) {
    let options = {
        title: 'Overwrite file?',
        body: `"${path}" already exists, overwrite?`,
        buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.warnButton({ label: 'OVERWRITE' })]
    };
    return apputils_1.showDialog(options).then(result => {
        return Promise.resolve(result.button.accept);
    });
}
exports.shouldOverwrite = shouldOverwrite;
/**
 * Test whether a name is a valid file name
 *
 * Disallows "/", "\", and ":" in file names, as well as names with zero length.
 */
function isValidFileName(name) {
    const validNameExp = /[\/\\:]/;
    return name.length > 0 && !validNameExp.test(name);
}
exports.isValidFileName = isValidFileName;
/**
 * A widget used to rename a file.
 */
class RenameHandler extends widgets_1.Widget {
    /**
     * Construct a new "rename" dialog.
     */
    constructor(oldPath) {
        super({ node: Private.createRenameNode(oldPath) });
        this.addClass(FILE_DIALOG_CLASS);
        let ext = coreutils_1.PathExt.extname(oldPath);
        let value = (this.inputNode.value = coreutils_1.PathExt.basename(oldPath));
        this.inputNode.setSelectionRange(0, value.length - ext.length);
    }
    /**
     * Get the input text node.
     */
    get inputNode() {
        return this.node.getElementsByTagName('input')[0];
    }
    /**
     * Get the value of the widget.
     */
    getValue() {
        return this.inputNode.value;
    }
}
/*
 * A widget used to open a file directly.
 */
class OpenDirectWidget extends widgets_1.Widget {
    /**
     * Construct a new open file widget.
     */
    constructor() {
        super({ node: Private.createOpenNode() });
    }
    /**
     * Get the value of the widget.
     */
    getValue() {
        return this.inputNode.value;
    }
    /**
     * Get the input text node.
     */
    get inputNode() {
        return this.node.getElementsByTagName('input')[0];
    }
}
/**
 * Create the node for the open handler.
 */
function getOpenPath(contentsManager) {
    return apputils_1.showDialog({
        title: 'Open File',
        body: new OpenDirectWidget(),
        buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton({ label: 'OPEN' })],
        focusNodeSelector: 'input'
    }).then((result) => {
        if (result.button.label === 'OPEN') {
            return result.value;
        }
        return;
    });
}
exports.getOpenPath = getOpenPath;
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * Create the node for a rename handler.
     */
    function createRenameNode(oldPath) {
        let body = document.createElement('div');
        let existingLabel = document.createElement('label');
        existingLabel.textContent = 'File Path';
        let existingPath = document.createElement('span');
        existingPath.textContent = oldPath;
        let nameTitle = document.createElement('label');
        nameTitle.textContent = 'New Name';
        nameTitle.className = RENAME_NEWNAME_TITLE_CLASS;
        let name = document.createElement('input');
        body.appendChild(existingLabel);
        body.appendChild(existingPath);
        body.appendChild(nameTitle);
        body.appendChild(name);
        return body;
    }
    Private.createRenameNode = createRenameNode;
    /**
     * Create the node for a open widget.
     */
    function createOpenNode() {
        let body = document.createElement('div');
        let existingLabel = document.createElement('label');
        existingLabel.textContent = 'File Path:';
        let input = document.createElement('input');
        input.value = '';
        input.placeholder = '/path/to/file';
        body.appendChild(existingLabel);
        body.appendChild(input);
        return body;
    }
    Private.createOpenNode = createOpenNode;
})(Private || (Private = {}));
