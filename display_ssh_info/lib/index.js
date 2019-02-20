"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var apputils_1 = require("@jupyterlab/apputils");
var coreutils_1 = require("@jupyterlab/coreutils");
var application_1 = require("@jupyterlab/application");
var docmanager_1 = require("@jupyterlab/docmanager");
var filebrowser_1 = require("@jupyterlab/filebrowser");
var launcher_1 = require("@jupyterlab/launcher");
var mainmenu_1 = require("@jupyterlab/mainmenu");
var widgets_1 = require("@phosphor/widgets");
var request_1 = require("./request");
require("../style/index.css");
var extension = {
    id: 'display_ssh_info',
    autoStart: true,
    requires: [docmanager_1.IDocumentManager, apputils_1.ICommandPalette, application_1.ILayoutRestorer, mainmenu_1.IMainMenu, filebrowser_1.IFileBrowserFactory],
    optional: [launcher_1.ILauncher],
    activate: activate
};
var SshWidget = /** @class */ (function (_super) {
    __extends(SshWidget, _super);
    function SshWidget() {
        var _this = this;
        var body = document.createElement('div');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        // let type = document.createElement('select');
        request_1.request('get', coreutils_1.PageConfig.getBaseUrl() + "display_ssh_info/get").then(function (res) {
            if (res.ok) {
                var contents = document.createTextNode(JSON.stringify(res.json()));
                body.appendChild(contents);
            }
        });
        // type.style.marginBottom = '15px';
        // type.style.minHeight = '25px';
        // body.appendChild(type);
        _this = _super.call(this, { node: body }) || this;
        return _this;
    }
    return SshWidget;
}(widgets_1.Widget));
exports.SshWidget = SshWidget;
function autoversion() {
    apputils_1.showDialog({
        title: 'SSH Info:',
        body: new SshWidget(),
        focusNodeSelector: 'input',
        buttons: [apputils_1.Dialog.okButton({ label: 'Ok' })]
    });
}
exports.autoversion = autoversion;
function activate(app, docManager, palette, restorer, mainMenu, browser, launcher) {
    // let widget: SshWidget;
    // Add an application command
    var open_command = 'sshinfo:open';
    app.commands.addCommand(open_command, {
        label: 'Display SSH Info',
        isEnabled: function () { return true; },
        execute: function (args) {
            autoversion();
        }
    });
    palette.addItem({ command: open_command, category: 'SSH' });
    console.log('JupyterLab ssh is activated!');
}
exports._activate = activate;
;
exports.default = extension;
