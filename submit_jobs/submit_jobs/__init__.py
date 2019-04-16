# Running `npm run build` will create static resources in the static
# directory of this Python package (and create that directory if necessary).
from notebook.utils import url_path_join
from .handlers import DeleteAlgorithmHandler, RegisterAlgorithmHandler, RegisterAutoHandler, GetCapabilitiesHandler, ExecuteHandler, ExecuteInputsHandler, GetStatusHandler, DescribeProcessHandler, GetResultHandler, DismissHandler


def _jupyter_labextension_paths():
    return [{
        'name': 'submit_jobs',
        'src': 'static',
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "submit_jobs"
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


    print('Installing jupyterlab submit_jobs handler on path %s' % url_path_join(base_url, 'hysds'))
    print('base_url is '+base_url)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/register'), RegisterAlgorithmHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/registerAuto'), RegisterAutoHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/deleteAlgorithm'), DeleteAlgorithmHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/getCapabilities'), GetCapabilitiesHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/executeInputs'), ExecuteInputsHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/execute'), ExecuteHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/getStatus'), GetStatusHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/getResult'), GetResultHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/dismiss'), DismissHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/describeProcess'), DescribeProcessHandler)])
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'hysds/listAlgorithms'), DescribeProcessHandler)])
