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
        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
        url = 'https://che-k8s.maap.xyz/api/profile'
        # --------------------------------------------------
        # TODO: FIGURE OUT AUTH KEY & verify
        # --------------------------------------------------
        headers = {
            'Accept':'application/json',
            'Authorization':'Bearer {token}'.format(token=che_machine_token)
        }
        r = requests.get(
            url, 
            headers=headers, 
            verify=False
        )
        print("====== IN SSH INJECT ========")
        resp = json.loads(r.text)               # JSON response to dict
        public_key = resp['attributes']['public_ssh_keys']   # gets ssh key from dict


        os.chdir('/root')
        if not os.path.exists(".ssh"):
            os.makedirs(".ssh")

        # Inject key into authorized keys
        cmd = "echo " + public_key + " >> .ssh/authorized_keys"
        print(cmd)
        subprocess.check_output(cmd, shell=True)
        os.chdir('/projects')
        print("====== SUCCESS ========")
