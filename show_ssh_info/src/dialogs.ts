import { Dialog } from '@jupyterlab/apputils';

const notImplemented: string[] = [];

export class DialogEnter<T> extends Dialog<T> {
  /**
   * Create a dialog panel instance.
   *
   * @param options - The dialog setup options.
   */
  constructor(options: Partial<Dialog.IOptions<T>> = {}) {
    super(options);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._evtKeydown(event as KeyboardEvent);
        break;
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'focus':
        this._evtFocus(event as FocusEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
      default:
        break;
    }
  }

  protected _evtKeydown(event: KeyboardEvent): void {
    // Check for escape key
    switch (event.keyCode) {
      case 13: // Enter.
        //event.stopPropagation();
        //event.preventDefault();
        //this.resolve();
        break;
      default:
        super._evtKeydown(event);
        break;
    }
  }
}

export function showDialogEnter<T>(
  options: Partial<Dialog.IOptions<T>> = {}
): void {
  let dialog = new DialogEnter(options);
  dialog.launch();
  // setTimeout(function(){console.log('go away'); dialog.resolve(0);}, 3000);
  return;
}

export function popup(b:any): void {
  if ( !(notImplemented.includes(b.req) )){ 
    popupTitle(b,b.popupTitle);
  } else {
    console.log("not implemented yet");
    popupResult("Not Implemented yet","Not Implemented yet")
  }
}

export function popupTitle(b:any,popupTitle:string): void {
  showDialogEnter({
    title: popupTitle,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({ label : 'Cancel'})]
  });
}

export function popupResult(b:any,popupTitle:string): void {
  showDialogEnter({
    title: popupTitle,
    body: b,
    focusNodeSelector: 'input',
    buttons: [Dialog.okButton({ label: 'Ok' })]
  });
}

export function isEmpty(obj:any) {
  return Object.keys(obj).length === 0;
}

