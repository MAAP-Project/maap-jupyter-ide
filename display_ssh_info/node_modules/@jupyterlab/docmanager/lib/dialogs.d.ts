import { Contents } from '@jupyterlab/services';
import { JSONObject } from '@phosphor/coreutils';
import { IDocumentManager } from './';
/**
 * A stripped-down interface for a file container.
 */
export interface IFileContainer extends JSONObject {
    /**
     * The list of item names in the current working directory.
     */
    items: string[];
    /**
     * The current working directory of the file container.
     */
    path: string;
}
/**
 * Rename a file with a dialog.
 */
export declare function renameDialog(manager: IDocumentManager, oldPath: string): Promise<Contents.IModel | null>;
/**
 * Rename a file, asking for confirmation if it is overwriting another.
 */
export declare function renameFile(manager: IDocumentManager, oldPath: string, newPath: string): Promise<Contents.IModel | null>;
/**
 * Ask the user whether to overwrite a file.
 */
export declare function shouldOverwrite(path: string): Promise<boolean>;
/**
 * Test whether a name is a valid file name
 *
 * Disallows "/", "\", and ":" in file names, as well as names with zero length.
 */
export declare function isValidFileName(name: string): boolean;
/**
 * Create the node for the open handler.
 */
export declare function getOpenPath(contentsManager: any): Promise<string | undefined>;
