import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer
} from "@jupyterlab/application";

//import { Classes } from "@blueprintjs/core";
import { ReactWidget } from "@jupyterlab/apputils";

import { Token } from "@phosphor/coreutils";
import { Widget } from "@phosphor/widgets";
import * as React from "react";
//import { classes, style } from "typestyle";
//import { IActiveDataset, ACTIVE_URL } from "./active";
//import { UseObservable } from "./utils";
//import { viewerDataType } from "./viewers";
// //import { RegistryToken } from "./registry";
// import {
//   Registry,
//   URL_,
//   ObservableSet,
//  // nestedDataType
// } from "@jupyterlab/dataregistry";
//import { Observable } from "rxjs";


/* tslint:disable */
export const IDataExplorer = new Token<IDataExplorer>(
  "@jupyterlab/dataRegistry:IDataExplorer"
);

export interface IDataExplorer {
  widget: Widget;

  // /**
  //  * Adds a URL to display on the top level of the data explorer.
  //  */
  // addURL(url: string): void;
  //
  // /**
  //  * Removes a URL from the top level of the data explorer.
  //  */
  // removeURL(url: string): void;
}

const id = "@jupyterlab/dataregistry-extension:data-explorer";

/**
 * Adds a visual data explorer to the sidebar...
 */
export default {
  activate,
  id,
  requires: [ILabShell, ILayoutRestorer],
  provides: IDataExplorer,
  autoStart: true
} as JupyterFrontEndPlugin<IDataExplorer>;


function activate(
  lab: JupyterFrontEnd,
  labShell: ILabShell,
  restorer: ILayoutRestorer,
): IDataExplorer {

  const widget = ReactWidget.create(
    <div>
      test
    </div>
  );
  widget.id = "@jupyterlab-dataRegistry/explorer";
  widget.title.iconClass = "jp-SpreadsheetIcon jp-SideBar-tabIcon";
  widget.title.caption = "Data Explorer";

  restorer.add(widget, widget.id);
  labShell.add(widget, "left");
  return { widget };
}