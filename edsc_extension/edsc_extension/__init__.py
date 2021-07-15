import json
from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join
from .proxy import IFrameProxyHandler
from .handlers import GetGranulesHandler, GetQueryHandler, VisualizeCMCHandler

__version__ = '0.0.11'

def _jupyter_server_extension_paths():
    return [{
        "module": "edsc_extension"
    }]


class IFrameHandler(IPythonHandler):
    def initialize(self, welcome=None, sites=None):
        self.sites = sites
        self.welcome = welcome

    def get(self):
        self.finish(json.dumps({'welcome': self.welcome or '', 'sites': self.sites}))


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    sites = nb_server_app.config.get('JupyterLabIFrame', {}).get('edsc', [])
    welcome = nb_server_app.config.get('JupyterLabIFrame', {}).get('welcome', [])

    host_pattern = '.*$'
    base_url = web_app.settings['base_url']

    print('Installing edsc_extension handler on path %s' % url_path_join(base_url, 'edsc'))
    print('Handling iframes: %s' % sites)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'edsc'), IFrameHandler, {'welcome': welcome, 'sites': sites}),
                                        (url_path_join(base_url, 'edsc/proxy'), IFrameProxyHandler)])

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'edsc/getGranules'), GetGranulesHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'edsc/getQuery'), GetQueryHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'edsc/visualizeCMC'), VisualizeCMCHandler)])