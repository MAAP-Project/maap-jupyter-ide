import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the insert_defaults_to_notebook extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'insert_defaults_to_notebook',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension insert_defaults_to_notebook is activated!');
  }
};

export default extension;
