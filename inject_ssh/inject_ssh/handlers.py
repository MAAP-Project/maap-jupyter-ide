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

        try:
            resp = json.loads(r.text)               # JSON response to dict
            public_key = resp['attributes']['public_ssh_keys']   # gets ssh key from dict

            # Inject key into authorized keys
            cmd = "echo " + public_key + " >> ~/.ssh/authorized_keys"
            print(cmd)
            subprocess.check_output(cmd, shell=True)

            print("====== SUCCESS ========")
            self.finish({"status_code": r.status_code})
        except:
            print("====== FAILURE ========")
            self.finish({"status_code": r.status_code})
