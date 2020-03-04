import { ILayoutRestorer, IRouter, JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ICommandPalette, IWindowResolver } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { activateGetCapabilities, activateDescribe, activateList, activateRegisterAlgorithm, activateDeleteAlgorithm, activateExecute, activateGetStatus, activateGetResult, activateDismiss, activateDelete, activateMenuOptions } from './activate'
import { constructFileTreeWidget } from "./filetree";
//import DataExplorer from './dataExplorer';
import { IDocumentManager } from "@jupyterlab/docmanager";
import "../style/index.css";

const extensionCapabilities: JupyterFrontEndPlugin<void> = {
  id: 'dps-capabilities',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetCapabilities
};

const extensionDescribe: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-describe',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDescribe
};

const extensionList: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-list',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateList
};

const extensionRegisterAlgorithm: JupyterFrontEndPlugin<void> = {
  id: 'mas-register2',
  requires: [ICommandPalette, IFileBrowserFactory],
  autoStart: true,
  activate: activateRegisterAlgorithm
};

const extensionDeleteAlgorithm: JupyterFrontEndPlugin<void> = {
  id: 'mas-algo-delete',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDeleteAlgorithm
};

const extensionExecute: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-execute',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateExecute
};

const extensionStatus: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-status',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetStatus
};

const extensionResult: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-result',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetResult
};

const extensionDismiss: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-dismiss',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDismiss
};

const extensionDelete: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-delete',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateDelete
};

const extensionDPSMASMenu: JupyterFrontEndPlugin<void> = {
  id: 'dps-mas-menu',
  autoStart: true,
  requires: [IMainMenu],
  activate: activateMenuOptions
};


function activate(app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths, resolver: IWindowResolver, restorer: ILayoutRestorer, manager: IDocumentManager, router: IRouter) {
  // tslint:disable-next-line: no-console
  console.log("JupyterLab extension jupyterlab_filetree is activated!");
  constructFileTreeWidget(app, "", "filetree-jupyterlab", "left", paths, resolver, restorer, manager, router);
}

const fileTreePanel: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyterlab_filetree",
  requires: [JupyterFrontEnd.IPaths, IWindowResolver, ILayoutRestorer, IDocumentManager, IRouter],
};


export default [extensionDeleteAlgorithm,extensionRegisterAlgorithm,extensionCapabilities,extensionStatus,extensionResult,extensionExecute,extensionDismiss,extensionDelete,extensionDescribe,extensionList,extensionDPSMASMenu, fileTreePanel];
