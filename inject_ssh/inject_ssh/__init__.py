__version__ = '0.1.0'
import os
import os.path
from notebook.utils import url_path_join

from .handlers import InjectKeyHandler

def _jupyter_labextension_paths():
    return [{
        'name': 'inject_ssh',
        'src': 'static',
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "inject_ssh"
    }]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    host_pattern = '.*$'


    print('Installing jupyterlab pull_projects handler on path %s' % url_path_join(base_url, 'inject_ssh'))
    print('base_url is '+base_url)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'inject_ssh/inject_public_key'), InjectKeyHandler)])


