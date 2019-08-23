import os
import requests
from requests import get
from notebook.base.handlers import IPythonHandler
import subprocess
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

class InjectKeyHandler(IPythonHandler):
    def get(self):
        public_key = self.get_argument('key', '')

        print("=== Injecting SSH KEY ===")

        # Check if .ssh directory exists, if not create it
        os.chdir('/root')
        if not os.path.exists(".ssh"):
            os.makedirs(".ssh")

        # Check if authorized_keys file exits, if not create it
        if not os.path.exists(".ssh/authorized_keys"):
            with open(".ssh/authorized_keys", 'w'):
                pass

        # Check if key already in file
        with open('.ssh/authorized_keys', 'r') as f:
            linelist = f.readlines()

        found = False
        for line in linelist:
            if public_key in line:
                print("Key already in authorized_keys")
                found = True

        # If not in file, inject key into authorized keys
        if not found:
            cmd = "echo " + public_key + " >> .ssh/authorized_keys && chmod 700 .ssh/ && chmod 600 .ssh/authorized_keys"
            print(cmd)
            subprocess.check_output(cmd, shell=True)
            os.chdir('/projects')
        else:
            os.chdir('/projects')
            print("====== SUCCESS ========")

class GetHandler(IPythonHandler):
    """
    Get ssh information for user - IP and Port.
    Port comes from querying the kubernetes API
    """
    def get(self):

        # Get Port from Kubernetes
        host = os.environ.get('KUBERNETES_SERVICE_HOST')
        host_port = os.environ.get('KUBERNETES_PORT_443_TCP_PORT')
        workspace_id = os.environ.get('CHE_WORKSPACE_ID')

        with open ("/var/run/secrets/kubernetes.io/serviceaccount/token", "r") as t:
            token=t.read()

        headers = {
            'Authorization': 'Bearer ' + token,
        }

        request_string = 'https://' + host + ':' + host_port + '/api/v1/namespaces/' + workspace_id + '/services/ws'
        response = requests.get(request_string, headers=headers, verify=False)

        data = response.json()
        port = data['spec']['ports'][0]['nodePort']


        # Get external IP address
        ip = get('https://api.ipify.org').text

        self.finish({'ip': ip, 'port': port})
        return


class CheckInstallersHandler(IPythonHandler):
    """
    Check if SSH and exec Che Installers are enabled. If they are not, a user would not be able to ssh in becuase there
    would be no SSH agent.
    """
    def get(self):
        #
        # TODO: DELTE THIS LINE!!!!! IT MAKES THE CHECK NOT HAPPEN!!!
        #
        # self.finish({'status': True})

        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
        url = 'https://che-k8s.maap.xyz/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')
        # --------------------------------------------------
        # TODO: FIGURE OUT AUTH KEY & verify
        # --------------------------------------------------
        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer {token}'.format(token=che_machine_token)
        }
        r = requests.get(
            url,
            headers=headers,
            verify=False
        )

        resp = json.loads(r.text)               # JSON response to dict
        installers = resp['config']['environments']["default"]["machines"]["ws/jupyter"]['installers']
        # Check installers
        if 'org.eclipse.che.ssh' in installers and 'org.eclipse.che.exec' in installers:
            self.finish({'status': True})
        else:
            self.finish({'status': False})


class InstallHandler(IPythonHandler):
    """
    Update workspace config to enable SSH and exec installers. Not sure if the workspace has to be maunually restarted
    at this point or if I can restart it.
    """
    def get(self):

        che_machine_token = os.environ['CHE_MACHINE_TOKEN']
        url = 'https://che-k8s.maap.xyz/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')
        # --------------------------------------------------
        # TODO: FIGURE OUT AUTH KEY & verify
        # --------------------------------------------------
        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer {token}'.format(token=che_machine_token)
        }
        r = requests.get(
            url,
            headers=headers,
            verify=False
        )

        installers = ['org.eclipse.che.ssh', 'org.eclipse.che.exec']
        workspace_config = json.loads(r.text)    # JSON response to dict

        # Update workspace config with new installers
        workspace_config['config']['environments']["default"]["machines"]["ws/jupyter"]['installers'] = installers

        put_url = 'https://che-k8s.maap.xyz/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')

        r = requests.put(
            url,
            headers=headers,
            verify=False
        )

        self.finish(r.status_code)

class MountBucketHandler(IPythonHandler):
    def get(self):
        message = ''
        user_workspace = ''
        user_bucket_dir = ''
        try:
            username = self.get_argument('username','')
            logging.debug('username is '+username)

            user_workspace = '/projects/{}'.format(username)
            logging.debug('user_workspace {}'.format(user_workspace))
            user_bucket_dir = 'maap-mount-dev:/{}'.format(username)
            logging.debug('user_bucket_dir {}'.format(user_bucket_dir))

            if not os.path.exists(user_workspace):
                os.mkdir(user_workspace)

            logging.debug('user_workspace created')

            if not os.path.exists('/tmp/cache'):
                os.mkdir('/tmp/cache')

            logging.debug('cache created')

            # check if already mounted
            check_status = subprocess.call('df -h | grep s3fs | grep {}'.format(user_workspace),shell=True)
            logging.debug('check mounted is '+str(check_status))

            #if status == 0, user workspace already mounted
            if check_status == 0:
                message = 'user workspace already mounted'
                self.finish({'status_code':200,'message':message, 'user_workspace':user_workspace, 'user_bucket_dir':user_bucket_dir})

            # if status !- 0, user workspace not already mounted
            else:
                # create tmp directory for caching
                chtmp_output = subprocess.check_output('chmod 777 /tmp/cache', shell=True).decode('utf-8')
                message = chtmp_output
                logging.debug('chmod tmp {}'.format(chtmp_output))

                # mount whole bucket first
                mount_output = subprocess.check_output('s3fs -o use_cache=/tmp/cache maap-mount-dev /projects/{}'.format(username), shell=True).decode('utf-8')
                message = mount_output
                logging.debug('mount log {}'.format(mount_output))

                # create user's folder within s3 bucket if it doesn't already exist
                if not os.path.exists('{}/{}'.format(user_workspace,username)):
                    os.mkdir('{}/{}'.format(user_workspace,username))

                # touch & rm file to register folder to filesystem
                touch_output = subprocess.check_output('touch {path}/{user}/testfile && rm {path}/{user}/testfile'.format(path=user_workspace,user=username), shell=True).decode('utf-8')
                message = touch_output
                logging.debug('touch output {}'.format(touch_output))

                # unmount bucket and mount user's subfolder
                umount_output = subprocess.check_output('umount {}'.format(user_workspace), shell=True).decode('utf-8')
                message = umount_output
                logging.debug('umount output {}'.format(umount_output))

                mountdir_output = subprocess.check_output('s3fs -o use_cache=/tmp/cache {} {}'.format(user_bucket_dir,user_workspace), shell=True).decode('utf-8')
                message = mountdir_output
                logging.debug('mountdir output {}'.format(mountdir_output))

                self.finish({"status_code":200, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})
        except:
            self.finish({"status_code":500, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})
