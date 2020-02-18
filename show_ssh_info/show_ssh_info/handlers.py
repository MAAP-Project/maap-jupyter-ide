import os
import requests
from requests import get
from notebook.base.handlers import IPythonHandler
import subprocess
import boto3
from botocore.exceptions import ClientError
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

        print("=== Adding MAAP_PGT to environment ===")

        proxy_granting_ticket = self.get_argument('proxyGrantingTicket', '')

        if proxy_granting_ticket:
            os.environ["MAAP_PGT"] = proxy_granting_ticket


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
        url = 'https://ade.maap-project.org/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')
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
        url = 'https://ade.maap-project.org/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')
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

        put_url = 'https://ade.maap-project.org/api/workspace/' + os.environ.get('CHE_WORKSPACE_ID')

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
            # get bucket name and username
            username = self.get_argument('username','')
            bucket = self.get_argument('bucket','')
            logging.debug('username is '+username)
            logging.debug('bucket is '+bucket)

            # local mount points
            user_workspace = '/projects/{}'.format(username)
            logging.debug('user_workspace {}'.format(user_workspace))
            user_bucket_dir = '{}:/{}'.format(bucket,username)
            logging.debug('user_bucket_dir {}'.format(user_bucket_dir))

            # create local mount points if they don't exist
            if not os.path.exists(user_workspace):
                os.mkdir(user_workspace)

            logging.debug('user_workspace created')

            # cache
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
                mount_output = subprocess.check_output('s3fs -o passwd_file="/.passwd-s3fs" -o use_cache=/tmp/cache {} /projects/{}'.format(bucket,username), shell=True).decode('utf-8')
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

                mountdir_output = subprocess.check_output('s3fs -o passwd_file="/.passwd-s3fs" -o use_cache=/tmp/cache {} {}'.format(user_bucket_dir,user_workspace), shell=True).decode('utf-8')
                message = mountdir_output
                logging.debug('mountdir output {}'.format(mountdir_output))

                self.finish({"status_code":200, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})
        except:
            self.finish({"status_code":500, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})

class MountOrgBucketsHandler(IPythonHandler):
    def get(self):
        # Send request to Che API for list of user's orgs
        # ts pass keycloak token from window
        token = self.get_argument('token','')
        bucket = self.get_argument('bucket','')
        url = 'https://ade.maap-project.org/api/organization'
        headers = {
            'Accept':'application/json',
            'Authorization':'Bearer {token}'.format(token=token)
        }
        try:
            # send request
            resp = requests.get(
                url, 
                headers=headers, 
                verify=False
            )
            logging.debug(resp)
            org_lst = [e['qualifiedName'] for e in eval(resp.text)]
            top_orgs = list(filter(lambda x: '/' not in x, org_lst))
            sub_orgs = list(filter(lambda x: '/' in x, org_lst))

            org_workspaces = []
            org_bucket_dirs = []

            try:
                # create 
                for org in top_orgs:
                    # local mount points
                    org_workspace = '/projects/{}'.format(org)
                    logging.debug('org_workspace {}'.format(org_workspace))
                    org_bucket_dir = '{}:/{}'.format(bucket,org)
                    logging.debug('org_bucket_dir {}'.format(org_bucket_dir))

                    # create local mount points if they don't exist
                    if not os.path.exists(org_workspace):
                        os.mkdir(org_workspace)

                    logging.debug('{} org workspace created'.format(org))

                    # check if already mounted
                    check_status = subprocess.call('df -h | grep s3fs | grep {}'.format(org_workspace),shell=True)
                    logging.debug('check mounted is '+str(check_status))

                    if check_status == 0:
                        message = 'org workspace already mounted'
                        # skip if org folder already mounted

                    else:
                        # mount whole bucket first
                        mount_output = subprocess.check_output('s3fs -o passwd_file="/.passwd-s3fs" {} /projects/{}'.format(bucket,org), shell=True).decode('utf-8')
                        message = mount_output
                        logging.debug('mount log {}'.format(mount_output))

                        # create org's folder within s3 bucket if it doesn't already exist
                        if not os.path.exists('{}/{}'.format(org_workspace,org)):
                            os.mkdir('{}/{}'.format(org_workspace,org))

                        # touch & rm file to register folder to filesystem
                        touch_output = subprocess.check_output('touch {path}/{org}/testfile && rm {path}/{org}/testfile'.format(path=org_workspace,org=org), shell=True).decode('utf-8')
                        message = touch_output
                        logging.debug('touch output {}'.format(touch_output))

                        # unmount bucket and mount org's subfolder
                        umount_output = subprocess.check_output('umount {}'.format(org_workspace), shell=True).decode('utf-8')
                        message = umount_output
                        logging.debug('umount output {}'.format(umount_output))

                        mountdir_output = subprocess.check_output('s3fs -o passwd_file="/.passwd-s3fs" {} {}'.format(org_bucket_dir,org_workspace), shell=True).decode('utf-8')
                        message = mountdir_output
                        logging.debug('mountdir output {}'.format(mountdir_output))

                    org_workspaces.append(org_workspace)
                    org_bucket_dirs.append(org_bucket_dir)

                # once top-level orgs mounted, sub-orgs don't need another mount point, just a subdirectory
                for org in sub_orgs:
                    # local mount points
                    org_workspace = '/projects/{}'.format(org)
                    logging.debug('org_workspace {}'.format(org_workspace))
                    org_bucket_dir = '{}:/{}'.format(bucket,org)
                    logging.debug('org_bucket_dir {}'.format(org_bucket_dir))

                    # create sub-org folders if they don't exist
                    if not os.path.exists(org_workspace):
                        os.mkdir(org_workspace)

                    org_workspaces.append(org_workspace)
                    org_bucket_dirs.append(org_bucket_dir)

                self.finish({"status_code":200, "message":message, "org_workspaces":org_workspaces,"org_bucket_dirs":org_bucket_dirs})
            except:
                self.finish({"status_code":500, "message":message, "org_workspaces":org_workspaces,"org_bucket_dirs":org_bucket_dirs})
        except:
            self.finish({"status_code":resp.status_code, "message":"error requesting Che organizations", "org_workspaces":[],"org_bucket_dirs":[]})

class Presigneds3UrlHandler(IPythonHandler):
    def get(self):
        # get arguments
        bucket = self.get_argument('bucket','')
        key = self.get_argument('key','')
        logging.debug('bucket is '+bucket)
        logging.debug('key is '+key)

        # expiration = '300' # 5 min in seconds
        expiration = '43200' # 12 hrs in seconds
        logging.debug('expiration is {} seconds'+expiration)
        keys = subprocess.check_output('cat ~/.passwd-s3fs',shell=True).decode('utf-8').strip().split(':')

        # check if provided key exists
        try:
            s3 = boto3.resource('s3',
                aws_access_key_id=keys[0],
                aws_secret_access_key=keys[1]
            )
            s3.Object(bucket,key).load()
            logging.debug('key {} exists in bucket {}'.format(key,bucket))
        # return with error if provided key doesn't exist
        except ClientError as e:
            if e.response['Error']['Code'] == "404":
                logging.debug('s3 object {} does not exist in bucket {}'.format(key,bucket))
                self.finish({"status_code":404, "message":"404 s3 object {} does not exist in bucket {}".format(key,bucket), "url":""})
            else:
                logging.error(e)
                self.finish(json.dumps({"status_code":500, "message":e, "url":""}))

        # continue if provided key exists
        # create s3 client for creating url
        try:
            s3_client = boto3.client('s3',
                aws_access_key_id=keys[0],
                aws_secret_access_key=keys[1]
            )
            resp = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket,'Key': key},
                ExpiresIn=expiration
            )
            logging.debug('link is '+resp)
        except ClientError as e:
            logging.error(e)
            self.finish(json.dumps({"status_code":500, "message":e, "url":""}))

        self.finish({"status_code":200, "message": "success", "url":resp})
