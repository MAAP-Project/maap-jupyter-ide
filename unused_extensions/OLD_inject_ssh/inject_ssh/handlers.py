import os.path
import sys
from notebook.base.handlers import IPythonHandler

import os
import requests
import json
import subprocess

# Set selected ADE Docker Image 
class InjectKeyHandler(IPythonHandler):
    def get(self):
        public_key = self.get_argument('key', '')

        os.chdir('/root')
        if not os.path.exists(".ssh"):
            os.makedirs(".ssh")

        # Inject key into authorized keys
        cmd = "echo " + public_key + " >> .ssh/authorized_keys"
        print(cmd)
        subprocess.check_output(cmd, shell=True)
        os.chdir('/projects')
        print("====== SUCCESS ========")
