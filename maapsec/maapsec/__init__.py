__version__ = '0.0.1'
import os
import os.path
from notebook.utils import url_path_join

from .handlers import MaapLoginHandler, MaapEnvironmentSetup

def _jupyter_labextension_paths():
    return [{
        'name': 'maapsec',
        'src': 'static',
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "maapsec"
    }]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    print('Initializing maapsec installation 0.2')



    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    host_pattern = '.*$'

    print('Installing jupyterlab maapsec handler on path %s' % url_path_join(base_url, 'maapsec'))
    print('base_url is '+base_url)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'maapsec/login'), MaapLoginHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'maapsec/environment'), MaapEnvironmentSetup)])

