import { Widget } from "@lumino/widgets";
import { Dialog, showDialog } from "@jupyterlab/apputils";
import { IStateDB } from '@jupyterlab/statedb';
import { getPresignedUrl } from './funcs';

export class DropdownSelector extends Widget {
    private _dropdown: HTMLSelectElement;
    public selected: string;

    // constructor(options:string[], private defaultOption:string) {
    constructor(options:string[], private defaultOption:string, private state: IStateDB, public path:string) {
        super();
        this._dropdown = <HTMLSelectElement>document.createElement("SELECT");
        if (! defaultOption) {
            this.defaultOption = '';
        }

        let opt:HTMLOptionElement;
        for (let option of options) {
            opt = <HTMLOptionElement>document.createElement("option");
            if (this.defaultOption === option) {
                opt.setAttribute("selected","selected");
            }
            opt.setAttribute("id", option);
            opt.setAttribute("label",option);
            opt.appendChild(document.createTextNode(option));
            this._dropdown.appendChild(opt);
        }
        this.node.appendChild(this._dropdown);
    }

    getValue() {
        this.selected = this._dropdown.value;
        let ind = this.selected.indexOf('(');
        if (ind > -1) {
        this.selected = this.selected.substr(0,ind).trim();
        }
        
        // guarantee default value
        if (this.selected == null || this.selected == '') {
            this.selected = this.defaultOption;
            console.log('no option selected, using '+this.defaultOption);
        }
        console.log(this.selected);
        
        // send request to get url
        getPresignedUrl(this.state, this.path, this.selected).then((url) => {
            let display = url;
            if (url.substring(0,5) == 'https'){
              display = '<a href='+url+' target="_blank" style="border-bottom: 1px solid #0000ff; color: #0000ff;">'+url+'</a>';
            } else {
                display = url
            }
    
            let body = document.createElement('div');
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
    
            var textarea = document.createElement("div");
            textarea.id = 'result-text';
            textarea.style.display = 'flex';
            textarea.style.flexDirection = 'column';
            textarea.innerHTML = "<pre>"+display+"</pre>";
    
            body.appendChild(textarea);
    
            showDialog({
              title: 'Presigned Url',
              body: new Widget({node:body}),
              focusNodeSelector: 'input',
              buttons: [Dialog.okButton({label: 'Ok'})]
            });
          });
    }
}