import {
  ILayoutRestorer, IRouter, JupyterFrontEnd, JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import {
  ContentsManager,
} from "@jupyterlab/services";

import {
  DocumentRegistry,
} from "@jupyterlab/docregistry";

import {
  IDocumentManager, isValidFileName, renameFile,
} from "@jupyterlab/docmanager";

import {
  PageConfig, PathExt, Time, URLExt,
} from "@jupyterlab/coreutils";

import {
  Clipboard, Dialog, IWindowResolver, showDialog, showErrorMessage, Toolbar, ToolbarButton,
} from "@jupyterlab/apputils";

import {
  PanelLayout, Widget,
} from "@phosphor/widgets";

// import {
//   Uploader,
// } from "./upload";
//
// import { saveAs } from "file-saver";
//
// import * as JSZip from "jszip";

import "../style/treeview.css";
import {INotification} from "jupyterlab_toastify";
import {request, RequestResult} from "./request";

// tslint:disable: no-namespace
// tslint:disable: variable-name
// tslint:disable: max-line-length
// tslint:disable: max-classes-per-file

namespace CommandIDs {
  export const navigate = "filetree:navigate";

  export const toggle = "filetree:toggle";

  export const refresh = "filetree:refresh";

  export const select = "filetree:select";

  export const set_context = "filetree:set-context";

  export const rename = "filetree:rename";

  export const create_folder = "filetree:create-folder";

  export const create_file = "filetree:create-file";

  export const delete_op = "filetree:delete";

  export const download = "filetree:download";

  export const upload = "filetree:upload";

  export const move = "filetree:move";

  export const copy_path = "filetree:copy_path";
}

namespace Patterns {

  export const tree = new RegExp(`^${PageConfig.getOption("treeUrl")}([^?]+)`);
  export const workspace = new RegExp(`^${PageConfig.getOption("workspacesUrl")}[^?\/]+/tree/([^?]+)`);

}

namespace Private {

  export function doRename(text: HTMLElement, edit: HTMLInputElement) {
    const parent = text.parentElement as HTMLElement;
    parent.replaceChild(edit, text);
    edit.focus();
    const index = edit.value.lastIndexOf(".");
    if (index === -1) {
      edit.setSelectionRange(0, edit.value.length);
    } else {
      edit.setSelectionRange(0, index);
    }
    // handle enter
    return new Promise<string>((resolve, reject) => {
      edit.onblur = () => {
        parent.replaceChild(text, edit);
        resolve(edit.value);
      };
      edit.onkeydown = (event: KeyboardEvent) => {
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

  export function createOpenNode(): HTMLElement {
    const body = document.createElement("div");
    const existingLabel = document.createElement("label");
    existingLabel.textContent = "File Path:";

    const input = document.createElement("input");
    input.value = "";
    input.placeholder = "/path/to/file";

    body.appendChild(existingLabel);
    body.appendChild(input);
    return body;
  }

}

class OpenDirectWidget extends Widget {

  constructor() {
    super({ node: Private.createOpenNode() });
  }

  public getValue(): string {
    return this.inputNode.value;
  }

  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName("input")[0] as HTMLInputElement;
  }
}

export class FileTreeWidget extends Widget {
  public cm: ContentsManager;
  public dr: DocumentRegistry;
  public commands: any;
  public toolbar: Toolbar;
  public table: HTMLTableElement;
  public tree: HTMLElement;
  public controller: any;
  public selected: string;
  public basepath: string;

  constructor(lab: JupyterFrontEnd,
              basepath: string = "",
              id: string = "jupyterlab-filetree") {
    super();
    this.id = id;
    this.title.iconClass = "filetree-icon";
    this.title.caption = "File Tree";
    this.title.closable = true;
    this.addClass("jp-filetreeWidget");
    this.addClass(id);

    this.cm = lab.serviceManager.contents;
    this.dr = lab.docRegistry;
    this.commands = lab.commands;
    this.toolbar = new Toolbar<Widget>();
    this.controller = {};
    this.selected = "";

    this.toolbar.addClass("filetree-toolbar");
    this.toolbar.addClass(id);

    const layout = new PanelLayout();
    layout.addWidget(this.toolbar);

    this.layout = layout;
    this.basepath = basepath === "" ? basepath : basepath + ":";

    const base = this.cm.get(this.basepath);
    base.then((res) => {
      this.controller[""] = {last_modified: res.last_modified, open: true};
      const table = this.buildTable(["Name", "Size", "Timestamp", "Permission"], res.content);




      //test calls
      console.log(res.content);
          // call list jobs endpoint using username
        var getUrl = new URL('https://api.maap.xyz/api/cmr/granules');
      //  getUrl.searchParams.append('username',this._username);
      //  console.log(getUrl.href);
        // --------------------
        // get jobs list request
        // --------------------
        request('get', getUrl.href).then((res: RequestResult) => {
          if(res.ok){
        //    let json_response:any = res.json();
            // console.log(json_response['status_code']);
            INotification.success("Get user cmr granules success.");
            console.log(res);
            console.log(res.json());
            // console.log(json_response['displays']);

            // if (json_response['status_code'] == 200){
            //   this._table = json_response['table'];
            //   this._jobs = json_response['jobs'];
            //   // later get user to pick the job
            //   this._displays = json_response['displays'];
            //
            //   // catch case if user has no jobs
            //   let num_jobs = Object.keys(this._jobs).length;
            //   if (num_jobs > 0 && this._job_id == '') {
            //
            //     this._job_id = json_response['result'][0]['job_id'];
            //   }
            //
            // } else {
            //   console.log('unable to get user job list');
            //   INotification.error("Get user jobs failed.");
            // }
          } else {
            console.log('unable to get user job list');
            INotification.error("Get user jobs failed.");
          }
        });




      this.node.appendChild(table);
    });
  }

  public buildTable(headers: any, data: any) {
    const table = document.createElement("table");
    table.className = "filetree-head";
    const thead = table.createTHead();
    const tbody = table.createTBody();
    tbody.id = "filetree-body";
    const headRow = document.createElement("tr");
    headers.forEach((el: string) => {
      const th = document.createElement("th");
      th.className = "filetree-header";
      th.appendChild(document.createTextNode(el));
      headRow.appendChild(th);
    });
    headRow.children[headRow.children.length - 1].className += " modified";
    thead.appendChild(headRow);
    table.appendChild(thead);

    this.table = table;
    this.tree = tbody;
    this.buildTableContents(data, 1, "");

    table.appendChild(tbody);

    return table;
  }

  public reload() { // rebuild tree
    this.table.removeChild(this.tree);
    const tbody = this.table.createTBody();
    tbody.id = "filetree-body";
    this.tree = tbody;
    const base = this.cm.get(this.basepath);
    base.then((res) => {
      this.buildTableContents(res.content, 1, "");
    });
    this.table.appendChild(tbody);
  }

  public restore() { // restore expansion prior to rebuild
    const array: Array<Promise<any>> = [];
    Object.keys(this.controller).forEach((key) => {
      if (this.controller[key].open && (key !== "")) {
        const promise = this.cm.get(this.basepath + key);
        // tslint:disable-next-line: no-console
        promise.catch((res) => { console.log(res); });
        array.push(promise);
      }
    });
    Promise.all(array).then((results) => {
      for (const r in results) {
        const row_element = this.node.querySelector("[id='" + btoa(results[r].path.replace(this.basepath, "")) + "']");
        this.buildTableContents(results[r].content, 1 + results[r].path.split("/").length, row_element);
      }
    }).catch((reasons) => {
      // tslint:disable-next-line: no-console
      console.log(reasons);
    });
  }

  public refresh() {
    this.reload();
    this.restore();
  }

  public updateController(oldPath: string, newPath: string) { // replace keys for renamed path
    Object.keys(this.controller).forEach((key) => {
      if (key.startsWith(oldPath)) {
        if (newPath !== "") {
          this.controller[key.replace(oldPath, newPath)] = this.controller[key];
        }
        delete this.controller[key];
      }
    });
  }

  public buildTableContents(data: any, level: number, parent: any) {
    const commands = this.commands;
    const map = this.sortContents(data);
    for (const index in data) {
      const sorted_entry = map[parseInt(index)];
      const entry = data[sorted_entry[1]];
      const tr = this.createTreeElement(entry, level);

      let path = entry.path;
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      tr.oncontextmenu = () => { commands.execute((CommandIDs.set_context + ":" + this.id), {path}); };
      tr.draggable = true;
      tr.ondragstart = (event) => {event.dataTransfer.setData("Path", tr.id); };

      if (entry.type === "directory") {
        tr.onclick = (event) => {
          event.stopPropagation();
          event.preventDefault();
          if ((event.target as HTMLElement).classList.contains("jp-DirListing-itemIcon")) {
            commands.execute((CommandIDs.select + ":" + this.id), {path});
            // clicks on icon -> expand
            commands.execute((CommandIDs.toggle + ":" + this.id), {row: path, level: level + 1});
          } else if (this.selected === path && (event.target as HTMLElement).classList.contains("filetree-name-span")) {
            // clicks on name -> rename
            commands.execute((CommandIDs.rename + ":" + this.id));
          } else {
            commands.execute((CommandIDs.select + ":" + this.id), {path});
          }
        };

        tr.ondrop = (event) => { commands.execute("filetree:move", {from: event.dataTransfer.getData("Path"), to: path}); };
        tr.ondragover = (event) => {event.preventDefault(); };
        if (!(path in this.controller)) {
          this.controller[path] = {last_modified: entry.last_modified, open: false};
        }
      } else {
        tr.onclick = (event) => {
          event.stopPropagation();
          event.preventDefault();
          if (this.selected === path && (event.target as HTMLElement).classList.contains("filetree-name-span")) {
            // clicks on name -> rename
            commands.execute((CommandIDs.rename + ":" + this.id));
          } else {
            commands.execute((CommandIDs.select + ":" + this.id), {path});
          }
        };
        tr.ondblclick = () => { commands.execute("docmanager:open", {path: this.basepath + path}); };
      }

      if (level === 1) {
        this.tree.appendChild(tr);
      } else {
        parent.after(tr);
        parent = tr;
      }
    }
  }

  public sortContents(data: any) {
    const names = [];
    for (const i in data) {
      names[names.length] = [data[i].name, parseInt(i)];
    }
    return names.sort();
  }

  public createTreeElement(object: any, level: number) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const td1 = document.createElement("td");
    const td2 = document.createElement("td");
    const td3 = document.createElement("td");
    tr.className = "filetree-item";

    const icon = document.createElement("span");
    icon.className = "jp-DirListing-itemIcon ";
    if (object.type === "directory") {
      icon.className += this.dr.getFileType("directory").iconClass;
      tr.className += " filetree-folder";
    } else {
      const iconClass = this.dr.getFileTypesForPath(object.path);
      tr.className += " filetree-file";
      if (iconClass.length === 0) {
        icon.className += this.dr.getFileType("text").iconClass;
      } else {
        icon.className += this.dr.getFileTypesForPath(object.path)[0].iconClass;
      }
    }

    // icon and name
    td.appendChild(icon);
    const title = document.createElement("span");
    title.innerHTML = object.name;
    title.className = "filetree-name-span";
    td.appendChild(title);
    td.className = "filetree-item-name";
    td.style.setProperty("--indent", level + "em");

    // file size
    const size = document.createElement("span");
    size.innerHTML = fileSizeString(object.size);
    td1.className = "filetree-attribute";
    td1.appendChild(size);

    // last modified
    const date = document.createElement("span");
    date.innerHTML = Time.format(object.last_modified);
    td2.className = "filetree-attribute";
    td2.appendChild(date);

    // check permissions
    const perm = document.createElement("span");
    td3.className = "filetree-attribute";
    if (object.writable) {
      perm.innerHTML = "Writable";
    } else {
      this.cm.get(this.basepath + object.path)
      .then((res) => {
        perm.innerHTML = "Readable";
      })
      .catch((err) => {
        perm.innerHTML = "Locked";
      });
    }
    td3.appendChild(perm);

    tr.appendChild(td);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.id = btoa(object.path);

    return tr;
  }

  public async download(path: string, folder: boolean): Promise<any> {
    // if (folder) {
    //   const zip = new JSZip();
    //   await this.wrapFolder(zip, path); // folder packing
    //   // generate and save zip, reset path
    //   path = PathExt.basename(path);
    //   writeZipFile(zip, path);
    // } else {
    //   return this.cm.getDownloadUrl(this.basepath + path).then((url) => {
    //     const element = document.createElement("a");
    //     document.body.appendChild(element);
    //     element.setAttribute("href", url);
    //     element.setAttribute("download", "");
    //     element.click();
    //     document.body.removeChild(element);
    //     return void 0;
    //   });
    // }
  }

  // public async wrapFolder(zip: JSZip, path: string) {
  //   const base = this.cm.get(this.basepath + path);
  //   const next = base.then(async (res) => {
  //     if (res.type === "directory") {
  //       const new_folder = zip.folder(res.name);
  //       for (const c in res.content) {
  //         await this.wrapFolder(new_folder, res.content[c].path);
  //       }
  //     } else {
  //       zip.file(res.name, res.content);
  //     }
  //   });
  //   await next;
  // }

}

function switchView(mode: any) {
  if (mode === "none") { return ""; } else { return "none"; }
}

function fileSizeString(fileBytes: number) {
    if (fileBytes == null) {
      return "";
    }
    if (fileBytes < 1024) {
      return fileBytes + " B";
    }

    let i = -1;
    const byteUnits = [" KB", " MB", " GB", " TB"];
    do {
        fileBytes = fileBytes / 1024;
        i++;
    } while (fileBytes > 1024);

    return Math.max(fileBytes, 0.1).toFixed(1) + byteUnits[i];
}

// function writeZipFile(zip: JSZip, path: string) {
//   zip.generateAsync({type: "blob"}).then((content) => {
//     saveAs(content, PathExt.basename(path));
//   });
// }

function activate(app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths, resolver: IWindowResolver, restorer: ILayoutRestorer, manager: IDocumentManager, router: IRouter) {
  // tslint:disable-next-line: no-console
  console.log("JupyterLab extension jupyterlab_filetree is activated!");
  constructFileTreeWidget(app, "", "filetree-jupyterlab", "left", paths, resolver, restorer, manager, router);
}

export
function constructFileTreeWidget(app: JupyterFrontEnd,
                                 basepath: string = "",
                                 id: string = "filetree-jupyterlab",
                                 side: string = "left",
                                 paths: JupyterFrontEnd.IPaths,
                                 resolver: IWindowResolver,
                                 restorer: ILayoutRestorer,
                                 manager: IDocumentManager,
                                 router: IRouter) {

  const widget = new FileTreeWidget(app, basepath, id || "jupyterlab-filetree");
  restorer.add(widget, widget.id);
  app.shell.add(widget, side);

//  const uploader = new Uploader({manager, widget});

  app.commands.addCommand((CommandIDs.toggle + ":" + widget.id), {
    execute: (args) => {
      const row = args.row as string;
      const level = args.level as number;

      let row_element = widget.node.querySelector("[id='" + btoa(row) + "']") as HTMLElement;

      if (row_element.nextElementSibling && atob(row_element.nextElementSibling.id).startsWith(row + "/")) { // next element in folder, already constructed
        const display = switchView((widget.node.querySelector("[id='" + row_element.nextElementSibling.id + "']") as HTMLElement).style.display);
        widget.controller[row].open = !(widget.controller[row].open);
        const open_flag = widget.controller[row].open;
        // open folder
        while (row_element.nextElementSibling && atob(row_element.nextElementSibling.id).startsWith(row + "/")) {
          row_element = (widget.node.querySelector("[id='" + row_element.nextElementSibling.id + "']") as HTMLElement);
          // check if the parent folder is open
          if (!(open_flag) || widget.controller[PathExt.dirname(atob(row_element.id))].open) {
            row_element.style.display = display;
          }
        }
      } else { // if children elements don't exist yet
        const base = app.serviceManager.contents.get(widget.basepath + row);
        base.then((res) => {
          widget.buildTableContents(res.content, level, row_element);
          widget.controller[row] = {last_modified: res.last_modified, open: true};
        });
      }
    },
  });

  app.commands.addCommand((CommandIDs.navigate + ":" + widget.id), {
    execute: async (args) => {
      const treeMatch = router.current.path.match(Patterns.tree);
      const workspaceMatch = router.current.path.match(Patterns.workspace);
      const match = treeMatch || workspaceMatch;
      const path = decodeURI(match[1]);
      // const { page, workspaces } = app.info.urls;
      const workspace = PathExt.basename(resolver.name);
      const url =
        (workspaceMatch ? URLExt.join(paths.urls.workspaces, workspace) : paths.urls.app) +
        router.current.search +
        router.current.hash;

      router.navigate(url);

      try {
        const tree_paths: string[] = [];
        const temp: string[] = path.split("/");
        let current: string = "";
        for (const t in temp) {
          current += (current === "") ? temp[t] : "/" + temp[t];
          tree_paths.push(current);
        }
        const array: Array<Promise<any>> = [];
        tree_paths.forEach((key) => {
          array.push(app.serviceManager.contents.get(key));
        });
        Promise.all(array).then((results) => {
          for (const r in results) {
            if (results[r].type === "directory") {
              const row_element = widget.node.querySelector("[id='" + btoa(results[r].path) + "']");
              widget.buildTableContents(results[r].content, 1 + results[r].path.split("/").length, row_element);
            }
          }
        });
      } catch (error) {
        // tslint:disable-next-line: no-console
        console.warn("Tree routing failed.", error);
      }
    },
  });

  app.commands.addCommand((CommandIDs.refresh + ":" + widget.id), {
    execute: () => {
      Object.keys(widget.controller).forEach((key) => {
        const promise = app.serviceManager.contents.get(widget.basepath + key);
        promise.then(async (res) => {
          if (res.last_modified > widget.controller[key].last_modified) {
            widget.controller[key].last_modified = res.last_modified;
          }
        });
        promise.catch((reason) => {
          // tslint:disable-next-line: no-console
          console.log(reason);
          delete widget.controller[key];
        });
      });
      widget.refresh();
    },
  });

  router.register({ command: (CommandIDs.navigate + ":" + widget.id), pattern: Patterns.tree });
  router.register({ command: (CommandIDs.navigate + ":" + widget.id), pattern: Patterns.workspace });

  app.commands.addCommand((CommandIDs.set_context + ":" + widget.id), {
    execute: (args) => {
      if (widget.selected !== "") {
        const element = (widget.node.querySelector("[id='" + btoa(widget.selected) + "']") as HTMLElement);
        if (element !== null) {
          element.className = element.className.replace("selected", "");
        }
      }
      widget.selected = args.path as string;
      if (widget.selected !== "") {
        const element = widget.node.querySelector("[id='" + btoa(widget.selected) + "']");
        if (element !== null) {
          element.className += " selected";
        }
      }
    },
    label: "Need some Context",
  });

  app.commands.addCommand((CommandIDs.select + ":" + widget.id), {
    execute: (args) => {
      if (widget.selected !== "") {
        // tslint:disable-next-line: no-shadowed-variable
        const element = (widget.node.querySelector("[id='" + btoa(widget.selected) + "']") as HTMLElement);
        if (element !== null) {
          element.className = element.className.replace("selected", "");
        }
      }
      if (args.path === "") { return; }
      widget.selected = args.path as string;
      const element = widget.node.querySelector("[id='" + btoa(widget.selected) + "']");
      if (element !== null) {
        element.className += " selected";
      }
    },
    label: "Select",
  });

  // remove context highlight on context menu exit
  document.ondblclick = () => { app.commands.execute((CommandIDs.set_context + ":" + widget.id), {path: ""}); };
  widget.node.onclick = (event) => { app.commands.execute((CommandIDs.select + ":" + widget.id), {path: ""}); };

  app.commands.addCommand((CommandIDs.rename + ":" + widget.id), {
    execute: () => {
      const td = widget.node.querySelector("[id='" + btoa(widget.selected) + "']").
        getElementsByClassName("filetree-item-name")[0];
      const text_area = td.getElementsByClassName("filetree-name-span")[0] as HTMLElement;

      if (text_area === undefined) {
        return;
      }
      const original = text_area.innerHTML;
      const edit = document.createElement("input");
      edit.value = original;
      Private.doRename(text_area, edit).then((newName) => {
        if (!newName || newName === original) {
          return original;
        }
        if (!isValidFileName(newName)) {
          showErrorMessage(
            "Rename Error",
            Error(
              `"${newName}" is not a valid name for a file. ` +
                `Names must have nonzero length, ` +
                `and cannot include "/", "\\", or ":"`,
            ),
          );
          return original;
        }
        const current_id = widget.selected;
        const new_path = PathExt.join(PathExt.dirname(widget.selected), newName);
        renameFile(manager, widget.basepath + current_id, widget.basepath + new_path);
        widget.updateController(current_id, new_path);
        text_area.innerHTML = newName;
        widget.refresh();
      });
    },
    iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-EditIcon",
    label: "Rename",
  });

  app.commands.addCommand((CommandIDs.create_folder + ":" + widget.id), {
    execute: async (args) => {
      await manager.newUntitled({
        path: widget.basepath + (args.path as string || widget.selected),
        type: "directory",
      });
      widget.refresh();
    },
    iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-NewFolderIcon",
    label: "New Folder",
  });

  app.commands.addCommand((CommandIDs.create_file + ":" + widget.id), {
    execute: () => {
      showDialog({
        body: new OpenDirectWidget(),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "CREATE" })],
        focusNodeSelector: "input",
        title: "Create File",
      }).then((result: any) => {
        if (result.button.label === "CREATE") {
          // tslint:disable-next-line: no-shadowed-variable
          const new_file = PathExt.join(widget.selected, result.value);
          manager.createNew(widget.basepath + new_file);
          if (!(widget.selected in widget.controller) || widget.controller[widget.selected].open === false) {
            app.commands.execute((CommandIDs.toggle + ":" + widget.id), {row: widget.selected, level: new_file.split("/").length});
          }
          widget.refresh();
        }
      });
    },
    iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-AddIcon",
    label: "New File",
  });

  app.commands.addCommand((CommandIDs.delete_op + ":" + widget.id), {
    execute: () => {
      const message = `Are you sure you want to delete: ${widget.selected} ?`;
      showDialog({
        body: message,
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: "DELETE" })],
        title: "Delete",
      }).then(async (result: any) => {
        if (result.button.accept) {
          await manager.deleteFile(widget.basepath + widget.selected);
          widget.updateController(widget.selected, "");
          app.commands.execute((CommandIDs.set_context + ":" + widget.id), {path: ""});
          widget.refresh();
        }
      });
    },
    iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-CloseIcon",
    label: "Delete",
  });

  app.commands.addCommand((CommandIDs.download + ":" + widget.id), {
    execute: (args) => {
      widget.download(widget.selected, args.folder as boolean || false);
    },
    iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-DownloadIcon",
    label: "Download",
  });

  // app.commands.addCommand((CommandIDs.upload + ":" + widget.id), {
  //   execute: () => {
  //     uploader.contextClick(widget.selected);
  //   },
  //   iconClass: "p-Menu-itemIcon jp-MaterialIcon jp-FileUploadIcon",
  //   label: "Upload",
  // });

  app.commands.addCommand((CommandIDs.move + ":" + widget.id), {
    execute: (args) => {
      const from = args.from as string;
      const to = args.to as string;
      const file_name = PathExt.basename(from);
      const message = "Are you sure you want to move " + file_name + "?";
      showDialog({
        body: message,
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: "MOVE" })],
        title: "Move",
      }).then(async (result: any) => {
        if (result.button.accept) {
          const new_path = PathExt.join(to, file_name);
          renameFile(manager, widget.basepath + from, widget.basepath + new_path);
          widget.updateController(from, new_path);
          widget.refresh();
        }
      });
    },
    label: "Move",
  });

  app.commands.addCommand((CommandIDs.copy_path + ":" + widget.id), {
    execute: () => {
      Clipboard.copyToSystem(widget.selected);
    },
    iconClass: widget.dr.getFileType("text").iconClass,
    label: "Copy Path",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.rename + ":" + widget.id),
    rank: 3,
    selector: "div." + widget.id + " > table > *> .filetree-item",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.delete_op + ":" + widget.id),
    rank: 4,
    selector: "div." + widget.id + " > table > *> .filetree-item",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.copy_path + ":" + widget.id),
    rank: 5,
    selector: "div." + widget.id + " > table > *> .filetree-item",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.download + ":" + widget.id),
    rank: 1,
    selector: "div." + widget.id + " > table > *> .filetree-file",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.create_folder + ":" + widget.id),
    rank: 2,
    selector: "div." + widget.id + " > table > * > .filetree-folder",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.create_file + ":" + widget.id),
    rank: 1,
    selector: "div." + widget.id + " > table > * > .filetree-folder",
  });

  app.contextMenu.addItem({
    command: (CommandIDs.upload + ":" + widget.id),
    rank: 3,
    selector: "div." + widget.id + " > table > * > .filetree-folder",
  });

  app.contextMenu.addItem({
    args: {folder: true},
    command: (CommandIDs.download + ":" + widget.id),
    rank: 1,
    selector: "div." + widget.id + " > table > *> .filetree-folder",
  });

  const new_file = new ToolbarButton({
    iconClassName: "jp-NewFolderIcon jp-Icon jp-Icon-16",
    onClick: () => {
      app.commands.execute((CommandIDs.create_folder + ":" + widget.id), {path: ""});
    },
    tooltip: "New Folder",
  });
  widget.toolbar.addItem("new file", new_file);

//  widget.toolbar.addItem("upload", uploader);

  const refresh = new ToolbarButton({
    iconClassName: "jp-RefreshIcon jp-Icon jp-Icon-16",
    onClick: () => {
      app.commands.execute((CommandIDs.refresh + ":" + widget.id));
    },
    tooltip: "Refresh",
  });
  widget.toolbar.addItem("refresh", refresh);

  // setInterval(() => {
  //   app.commands.execute(CommandIDs.refresh);
  // }, 10000);
}

const extension: JupyterFrontEndPlugin<void> = {
  activate,
  autoStart: true,
  id: "jupyterlab_filetree",
  requires: [JupyterFrontEnd.IPaths, IWindowResolver, ILayoutRestorer, IDocumentManager, IRouter],
};

export default extension;