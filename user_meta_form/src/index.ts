import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

// Comment the following back in if settings for the PIQ can be updated to allow iframe
import {
  ICommandPalette /*, MainAreaWidget, IFrame */
} from '@jupyterlab/apputils';


// Comment the following back in if settings for the PIQ can be updated to allow iframe

// import { URLExt } from '@jupyterlab/coreutils';

// const LAB_IS_SECURE = window.location.protocol === 'https:';

const extension: JupyterFrontEndPlugin<void> = { 
  id: 'jupyterlab_apod',
  requires: [ICommandPalette],
  autoStart: true,
  activate (app: JupyterFrontEnd, palette: ICommandPalette): void {
    
    // Comment the following back in if settings for the PIQ can be updated to allow iframe
    /*
    const { shell } = app;
  
    function newWidget(url: string, text: string): MainAreaWidget<IFrame> {
      // Allow scripts and forms so that things like
      // readthedocs can use their search functionality.
      // We *don't* allow same origin requests, which
      // can prevent some content from being loaded onto the
      // help pages.
      let content = new IFrame({
        sandbox: ['allow-scripts', 'allow-forms']
      });
      content.url = url;
      // content.addClass(HELP_CLASS);
      content.title.label = text;
      // content.id = `${namespace}-${++counter}`;
      let widget = new MainAreaWidget({ content });
      widget.addClass('jp-Help');
      return widget;
    }
    */

    /**
     * Initialization data for the jupyterlab-ext extension.
     */
    const command: string = 'apod:open';
    app.commands.addCommand(command, {
      label: 'Share your own data',
      execute: () => {
        const url = 'https://questionnaire.maap-project.org/';
        // const text = 'Share your data';

        window.open(url)

        // Comment the following back in if settings for the PIQ can be updated to allow iframe
        /*
        // If help resource will generate a mixed content error, load externally.
        if (LAB_IS_SECURE && URLExt.parse(url).protocol !== 'https:') {
          window.open(url);
          return;
        }

        let widget = newWidget(url, text);
        shell.add(widget, 'main');
        return widget;
        */
      }
    });

    palette.addItem({ command: command, category: 'Metadata' });
    console.log("user_meta_form activated");

  }
};

export default extension;