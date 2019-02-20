import { Menu, Widget } from '@phosphor/widgets';
import { IJupyterLabMenu, IMenuExtender, JupyterLabMenu } from './labmenu';
/**
 * An interface for a View menu.
 */
export interface IViewMenu extends IJupyterLabMenu {
    /**
     * A set storing IKernelUsers for the Kernel menu.
     */
    readonly editorViewers: Set<IViewMenu.IEditorViewer<Widget>>;
}
/**
 * An extensible View menu for the application.
 */
export declare class ViewMenu extends JupyterLabMenu implements IViewMenu {
    /**
     * Construct the view menu.
     */
    constructor(options: Menu.IOptions);
    /**
     * A set storing IEditorViewers for the View menu.
     */
    readonly editorViewers: Set<IViewMenu.IEditorViewer<Widget>>;
    /**
     * Dispose of the resources held by the view menu.
     */
    dispose(): void;
}
/**
 * Namespace for IViewMenu.
 */
export declare namespace IViewMenu {
    /**
     * Interface for a text editor viewer to register
     * itself with the text editor extension points.
     */
    interface IEditorViewer<T extends Widget> extends IMenuExtender<T> {
        /**
         * Whether to show line numbers in the editor.
         */
        toggleLineNumbers?: (widget: T) => void;
        /**
         * Whether to word-wrap the editor.
         */
        toggleWordWrap?: (widget: T) => void;
        /**
         * Whether to match brackets in the editor.
         */
        toggleMatchBrackets?: (widget: T) => void;
        /**
         * Whether line numbers are toggled.
         */
        lineNumbersToggled?: (widget: T) => boolean;
        /**
         * Whether word wrap is toggled.
         */
        wordWrapToggled?: (widget: T) => boolean;
        /**
         * Whether match brackets is toggled.
         */
        matchBracketsToggled?: (widget: T) => boolean;
    }
}
