import os
import requests
from requests import get
from notebook.base.handlers import IPythonHandler
import subprocess
import json
import logging
import functools

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

@functools.lru_cache(maxsize=128)
def get_maap_config(host):
    path_to_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..', 'maap_environments.json')

    with open(path_to_json) as f:
        data = json.load(f)

    match = next((x for x in data if host in x['ade_server']), None)
    maap_config = next((x for x in data if x['default_host'] == True), None) if match is None else match
    
    return maap_config

def maap_ade_url(host):
	return 'https://{}'.format(get_maap_config(host)['ade_server'])

def maap_api_url(host):
	return 'https://{}'.format(get_maap_config(host)['api_server'])

def dps_bucket_name(host):
	return get_maap_config(host)['workspace_bucket']

class InjectKeyHandler(IPythonHandler):
    def get(self):
        public_key = self.get_argument('key', '')

        if public_key:
            print("=== Injecting SSH KEY ===")

            # Check if .ssh directory exists, if not create it
            os.chdir('/projects')
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
                cmd = "echo " + public_key + " >> .ssh/authorized_keys && chmod 700 /projects && chmod 700 .ssh/ && chmod 600 .ssh/authorized_keys"
                print(cmd)
                subprocess.check_output(cmd, shell=True)
                print("=== INJECTED KEY ===")
            else:
                print("=== KEY ALREADY PRESENT ===")

        print("=== Checking for existence of MAAP_PGT ===")

        proxy_granting_ticket = self.get_argument('proxyGrantingTicket', '')

        if proxy_granting_ticket:
            print("=== MAAP_PGT found. Adding variable to environment ===")
            os.environ["MAAP_PGT"] = proxy_granting_ticket
        else:
            print("=== No MAAP_PGT found ===")


class GetHandler(IPythonHandler):
    """
    Get ssh information for user - IP and Port.
    Port comes from querying the kubernetes API
    """
    def get(self):

        try:
            svc_host = os.environ.get('KUBERNETES_SERVICE_HOST')
            svc_host_https_port = os.environ.get('KUBERNETES_SERVICE_PORT_HTTPS')
            namespace = os.environ.get('CHE_WORKSPACE_NAMESPACE') + '-che'
            che_workspace_id = os.environ.get('CHE_WORKSPACE_ID')
            sshport_name = 'sshport'

            ip = requests.get('https://api.ipify.org').text

            with open ("/var/run/secrets/kubernetes.io/serviceaccount/token", "r") as t:
                token=t.read()

            headers = {
                'Authorization': 'Bearer ' + token,
            }

            request_string = 'https://' + svc_host + ':' + svc_host_https_port + '/api/v1/namespaces/' + namespace +  '/services/'
            response = requests.get(request_string, headers=headers, verify=False)
            data = response.json()
            endpoints = data['items']

            # Ssh service is running on a seperate container from the user workspace. Query the kubernetes host service to find the container where the nodeport has been set.
            for endpoint in endpoints:
                if sshport_name in endpoint['metadata']['name']:
                    if che_workspace_id == endpoint['metadata']['labels']['che.workspace_id']:
                        port = endpoint['spec']['ports'][0]['nodePort']
                        self.finish({'ip': ip, 'port': port})

            self.finish({"status": 500, "message": "failed to get ip and port"})
        except:
            self.finish({"status": 500, "message": "failed to get ip and port"})


"""
No longer in use. Mounting now is happening outside of the Jupyter container.
"""
class MountBucketHandler(IPythonHandler):
    def get(self):
        message = ''
        user_workspace = ''
        user_bucket_dir = ''
        try:
            # get bucket name and username
            username = self.get_argument('username','')
            bucket = dps_bucket_name(self.request.host)
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
                mount_output = subprocess.check_output('s3fs -o iam_role=auto -o imdsv1only -o use_cache=/tmp/cache {} {}'.format(bucket,user_workspace), shell=True).decode('utf-8')

                message = mount_output
                logging.debug('mount log {}'.format(mount_output))

                # create user's folder within s3 bucket if it doesn't already exist
                if not os.path.exists('{}/{}'.format(user_workspace,username)):
                    os.mkdir('{}/{}'.format(user_workspace,username))

                # make sure folder permissions are at least 755
                chmod_output = subprocess.check_output('chmod 755 {path}/{username}'.format(path=user_workspace,username=username), shell=True).decode('utf-8')
                message = chmod_output
                logging.debug('chmod output {}'.format(chmod_output))

                if not os.path.exists('{}/{}/dps_output'.format(user_workspace,username)):
                    os.mkdir('{}/{}/dps_output'.format(user_workspace,username))

                # touch & rm file to register folder to filesystem
                touch_output = subprocess.check_output('touch {path}/{username}/dps_output/testfile && rm {path}/{username}/dps_output/testfile'.format(path=user_workspace,username=username), shell=True).decode('utf-8')
                message = touch_output
                logging.debug('touch output {}'.format(touch_output))

                # unmount bucket and mount user's subfolder
                umount_output = subprocess.check_output('umount {}'.format(user_workspace), shell=True).decode('utf-8')
                message = umount_output
                logging.debug('umount output {}'.format(umount_output))

                mountdir_output = subprocess.check_output('s3fs -o iam_role=auto -o imdsv1only -o use_cache=/tmp/cache {} {}'.format(user_bucket_dir,user_workspace), shell=True).decode('utf-8')

                message = mountdir_output
                logging.debug('mountdir output {}'.format(mountdir_output))

                self.finish({"status_code":200, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})
        except:
            self.finish({"status_code":500, "message":message, "user_workspace":user_workspace,"user_bucket_dir":user_bucket_dir})


"""
No longer in use. Mounting now is happening outside of the Jupyter container.
"""
class MountSharedBucketsHandler(IPythonHandler):
    def get(self):
        message = ''
        maap_workspaces_dir = 'maap-workspaces'
        try:
            # get bucket name 
            bucket = dps_bucket_name(self.request.host)
            logging.debug('shared bucket is '+bucket)

            # local mount points
            shared_workspaces = '/projects/{}'.format(maap_workspaces_dir)
            logging.debug('shared_workspaces {}'.format(shared_workspaces))

            # create local mount points if they don't exist
            if not os.path.exists(shared_workspaces):
                os.mkdir(shared_workspaces)

            logging.debug('shared_workspaces created')

            # cache
            if not os.path.exists('/tmp/cache'):
                os.mkdir('/tmp/cache')

            logging.debug('cache created')

            # check if already mounted
            check_status = subprocess.call('df -h | grep s3fs | grep {}'.format(shared_workspaces),shell=True)
            logging.debug('check mounted is '+str(check_status))

            #if status == 0, user workspace already mounted
            if check_status == 0:
                message = 'shared workspaces already mounted'
                self.finish({'status_code':200,'message':message, 'shared_workspaces':shared_workspaces})

            # if status !- 0, user workspace not already mounted
            else:
                # create tmp directory for caching
                chtmp_output = subprocess.check_output('chmod 777 /tmp/cache', shell=True).decode('utf-8')
                message = chtmp_output
                logging.debug('chmod tmp {}'.format(chtmp_output))

                # mount whole bucket in read-only mode
                mount_output = subprocess.check_output('s3fs -o iam_role=auto -o imdsv1only -o ro -o use_cache=/tmp/cache {} {}'.format(bucket,shared_workspaces), shell=True).decode('utf-8')

                message = mount_output
                logging.debug('mount log {}'.format(mount_output))

                self.finish({"status_code":200, "message":message, "shared_workspaces":shared_workspaces})
        except:
            self.finish({"status_code":500, "message":message, "shared_workspaces":shared_workspaces})

"""
No longer in use. Mounting now is happening outside of the Jupyter container.
"""
class MountOrgBucketsHandler(IPythonHandler):
    def get(self):
        # Send request to Che API for list of user's orgs
        # ts pass keycloak token from window
        token = self.get_argument('token', '')
        bucket = dps_bucket_name(self.request.host)
        url = '{}/api/organization'.format(maap_ade_url(self.request.host))
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
                    org_bucket_dir = '{}:/{}'.format(bucket, org)
                    logging.debug('org_bucket_dir {}'.format(org_bucket_dir))

                    # create local mount points if they don't exist
                    if not os.path.exists(org_workspace):
                        os.mkdir(org_workspace)

                    logging.debug('{} org workspace created'.format(org))

                    # check if already mounted
                    check_status = subprocess.call(
                        'df -h | grep s3fs | grep {}'.format(org_workspace), shell=True)
                    logging.debug('check mounted is '+str(check_status))

                    if check_status == 0:
                        message = 'org workspace already mounted'
                        # skip if org folder already mounted

                    else:
                        # mount whole bucket first
                        mount_output = subprocess.check_output(
                            's3fs -o iam_role=auto -o imdsv1only {} /projects/{}'.format(
                                bucket, org),
                            shell=True).decode('utf-8')
                        message = mount_output
                        logging.debug('mount log {}'.format(mount_output))

                        # create org's folder within s3 bucket if it doesn't already exist
                        if not os.path.exists('{}/{}'.format(org_workspace, org)):
                            os.mkdir('{}/{}'.format(org_workspace, org))

                        # touch & rm file to register folder to filesystem
                        touch_output = subprocess.check_output(
                            'touch {path}/{org}/testfile && rm {path}/{org}/testfile'.format(
                                path=org_workspace, org=org),
                            shell=True).decode('utf-8')
                        message = touch_output
                        logging.debug('touch output {}'.format(touch_output))

                        # unmount bucket and mount org's subfolder
                        umount_output = subprocess.check_output(
                            'umount {}'.format(org_workspace),
                            shell=True).decode('utf-8')
                        message = umount_output
                        logging.debug('umount output {}'.format(umount_output))

                        mountdir_output = subprocess.check_output(
                            's3fs -o iam_role=auto -o imdsv1only {} {}'.format(org_bucket_dir, org_workspace),
                            shell=True).decode('utf-8')
                        message = mountdir_output
                        logging.debug('mountdir output {}'.format(mountdir_output))

                    org_workspaces.append(org_workspace)
                    org_bucket_dirs.append(org_bucket_dir)

                # once top-level orgs mounted,
                # sub-orgs don't need another mount point, just a subdirectory
                for org in sub_orgs:
                    # local mount points
                    org_workspace = '/projects/{}'.format(org)
                    logging.debug('org_workspace {}'.format(org_workspace))
                    org_bucket_dir = '{}:/{}'.format(bucket, org)
                    logging.debug('org_bucket_dir {}'.format(org_bucket_dir))

                    # create sub-org folders if they don't exist
                    if not os.path.exists(org_workspace):
                        os.mkdir(org_workspace)

                    org_workspaces.append(org_workspace)
                    org_bucket_dirs.append(org_bucket_dir)

                self.finish({"status_code":200, "message":message, "org_workspaces":org_workspaces, "org_bucket_dirs":org_bucket_dirs})
            except:
                self.finish({"status_code":500, "message":message, "org_workspaces":org_workspaces,"org_bucket_dirs":org_bucket_dirs})
        except:
            self.finish({"status_code":resp.status_code, "message":"error requesting Che organizations", "org_workspaces":[],"org_bucket_dirs":[]})

class Presigneds3UrlHandler(IPythonHandler):

    def get(self):
        # get arguments
        bucket = dps_bucket_name(self.request.host)
        key = self.get_argument('key', '')
        rt_path = os.path.expanduser(self.get_argument('home_path', ''))
        abs_path = os.path.join(rt_path, key)
        proxy_ticket = self.get_argument('proxy-ticket','')
        expiration = self.get_argument('duration','86400') # default 24 hrs
        che_ws_namespace = os.environ.get('CHE_WORKSPACE_NAMESPACE')

        logging.debug('bucket is '+bucket)     
        logging.debug('key is '+key)        
        logging.debug('full path is '+abs_path) 

        # -----------------------
        # Checking for bad input
        # -----------------------
        # if directory, return error - dirs not supported
        if os.path.isdir(abs_path):
            self.finish({"status_code": 412, "message": "error", "url": "Presigned S3 links do not support folders"})
            return

        # check if file in valid folder (under mounted folder path)
        resp = subprocess.check_output("df -h | grep s3fs | awk '{print $6}'", shell=True).decode('utf-8')
        mounted_dirs = resp.strip().split('\n')
        logging.debug(mounted_dirs)
        if len(mounted_dirs) == 0:
            self.finish({"status_code": 412, "message": "error",
                "url": "Presigned S3 links can only be created for files in a mounted org or user folder" +
                    "\nMounted folders include:\n{}".format(resp)
                })
            return

        if not any([mounted_dir in abs_path for mounted_dir in mounted_dirs]):
            self.finish({"status_code": 412, "message": "error",
                "url": "Presigned S3 links can only be created for files in a mounted org or user folder" +
                    "\nMounted folders include:\n{}".format(resp)
                })
            return

        # -----------------------
        # Generate S3 Link
        # -----------------------
        # if valid path, get presigned URL
        # expiration = '43200' # 12 hrs in seconds
        logging.debug('expiration is {} seconds', expiration)

        url = '{}/api/members/self/presignedUrlS3/{}/{}?exp={}&ws={}'.format(maap_api_url(self.request.host), bucket, key, expiration, che_ws_namespace)
        headers = {'Accept': 'application/json', 'proxy-ticket': proxy_ticket}
        r = requests.get(
            url,
            headers=headers,
            verify=False
        )
        logging.debug(r.text)

        resp = json.loads(r.text)   
        self.finish({"status_code":200, "message": "success", "url":resp['url']})
