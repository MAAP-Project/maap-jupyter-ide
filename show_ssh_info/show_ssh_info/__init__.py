__version__ = '0.1.0'
import os
import os.path
from notebook.utils import url_path_join
from .handlers import GetHandler, CheckInstallersHandler, InstallHandler, InjectKeyHandler, MountBucketHandler

def _jupyter_server_extension_paths():
    return [{
        "module": "show_ssh_info"
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


    print('Installing jupyterlab_projects handler on path %s' % url_path_join(base_url, 'show_ssh_info'))
    print('base_url is '+base_url)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'show_ssh_info/get'), GetHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'show_ssh_info/checkInstallers'), CheckInstallersHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'show_ssh_info/install'), InstallHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'show_ssh_info/inject_public_key'), InjectKeyHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'show_ssh_info/mountBucket'), MountBucketHandler)])

