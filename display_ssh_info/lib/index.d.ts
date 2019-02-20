import { ICommandPalette } from '@jupyterlab/apputils';
import { JupyterLab, JupyterLabPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Widget } from '@phosphor/widgets';
import '../style/index.css';
declare const extension: JupyterLabPlugin<void>;
export declare class SshWidget extends Widget {
    constructor();
}
export declare function autoversion(): void;
declare function activate(app: JupyterLab, docManager: IDocumentManager, palette: ICommandPalette, restorer: ILayoutRestorer, mainMenu: IMainMenu, browser: IFileBrowserFactory, launcher: ILauncher | null): void;
export default extension;
export { activate as _activate };
