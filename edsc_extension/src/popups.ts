import {Dialog, showDialog} from "@jupyterlab/apputils";
import {LimitPopupWidget, ParamsPopupWidget, LoadGeotiffsWidget} from "./widgets";
import globals = require("./globals");

export function setResultsLimit() {
    console.log("old limit is: ", globals.limit)
    showDialog({
        title: 'Set Results Limit:',
        body: new LimitPopupWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });
}

export function displaySearchParams() {
  showDialog({
        title: 'Current Search Parameters:',
        body: new ParamsPopupWidget(),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });
}

export function promptLoadGeotiffDefaults(current) {
    showDialog({
        title: 'Function call to load_geotiffs:',
        body: new LoadGeotiffsWidget(current),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });
}