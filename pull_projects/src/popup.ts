import {Dialog} from "@jupyterlab/apputils";

export function showDialog<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new Dialog(options);
  dialog.launch();
  setTimeout(function(){dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:any, title:string): void {
  showDialog({
    title: title,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}