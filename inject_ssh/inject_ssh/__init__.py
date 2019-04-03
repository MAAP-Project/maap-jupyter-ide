from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join

import os
import subprocess

__version__ = '0.0.1'


class InjectKeyHandler(IPythonHandler):
    def get(self):
        public_key = self.get_argument('key', '')

        print("=== Injecting SSH KEY ===")
        os.chdir('/root')
        if not os.path.exists(".ssh"):
            os.makedirs(".ssh")

        # Inject key into authorized keys
        cmd = "echo " + public_key + " >> .ssh/authorized_keys"
        print(cmd)
        subprocess.check_output(cmd, shell=True)
        os.chdir('/projects')
        print("====== SUCCESS ========")
        # self.finish()


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


def _jupyter_labextension_paths():
    return [{
        'name': 'inject_ssh',
        'src': 'static',
    }]


def _jupyter_server_extension_paths():
    return [{
        "module": "inject_ssh"
    }]