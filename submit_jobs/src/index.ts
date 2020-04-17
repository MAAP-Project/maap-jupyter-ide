import { JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ICommandPalette } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { activateGetCapabilities, activateDescribe, activateList, activateRegisterAlgorithm, activateDeleteAlgorithm, activatePublishAlgorithm, activateExecute, activateGetStatus, activateGetMetrics, activateGetResult, activateDismiss, activateDelete, activateMenuOptions } from './activate'

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

const extensionPublishAlgorithm: JupyterFrontEndPlugin<void> = {
  id: 'mas-algo-publish',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activatePublishAlgorithm
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

const extensionMetrics: JupyterFrontEndPlugin<void> = {
  id: 'dps-job-metrics',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: activateGetMetrics
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


export default [extensionCapabilities,extensionDescribe,extensionList,extensionRegisterAlgorithm,extensionDeleteAlgorithm,extensionPublishAlgorithm,extensionExecute,extensionStatus,extensionMetrics,extensionResult,extensionDismiss,extensionDelete,extensionDPSMASMenu];
