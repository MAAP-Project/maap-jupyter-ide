import os
import os.path
from notebook.utils import url_path_join
from .handlers import GetHandler


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    host_pattern = '.*$'


    print('Installing display_ssh_info handler on path %s' % url_path_join(base_url, 'display_ssh_info'))

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'display_ssh_info/get'), GetHandler)])

