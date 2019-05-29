__version__ = '0.1.0'
import os
import os.path
from notebook.utils import url_path_join

from .handlers import ListProjectsHandler, GetProjectHandler, GetAllProjectsHandler, ListFilesHandler

def _jupyter_labextension_paths():
    return [{
        'name': 'pull_projects',
        'src': 'static',
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "pull_projects"
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


    print('Installing jupyterlab pull_projects handler on path %s' % url_path_join(base_url, 'pull_projects'))
    print('base_url is '+base_url)

    # ws_url = os.environ['PREVIEW_URL']
    # ws_ind = ws_url.find('/server')
    # che_url = 'https://che-k8s.maap.xyz'+ws_url[ws_ind:]
    # che_url = ws_url[ws_ind:]
    #http://0.0.0.0:3100/serverlx80f9ci-ws-jupyter/server-3100/
    #https://che-k8s.maap.xyz/serverlx80f9ci-ws-jupyter/server-3100/

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'pull_projects/list'), ListProjectsHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'pull_projects/listFiles'), ListFilesHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'pull_projects/getProject'), GetProjectHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'pull_projects/getAllProjects'), GetAllProjectsHandler)])

